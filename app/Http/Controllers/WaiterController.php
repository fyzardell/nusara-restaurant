<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class WaiterController extends Controller
{
    /**
     * Display Waiter Operational Dashboard (PRD Section 2 & 8.2)
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return redirect()->route('login');
        }

        // Allow waiter, admin, and cashier roles
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        $roleName = $role ? strtolower($role->name) : 'customer';

        if (!in_array($roleName, ['waiter', 'admin', 'cashier'])) {
            return redirect()->route('order.app')->with('error', 'Akses khusus staf pelayan (waiter) dan manajemen restoran.');
        }

        $today = Carbon::today();

        // 1. Calculate Real-time Metrics for Waiter
        $occupiedCount = DB::table('restaurant_tables')
            ->where('is_active', true)
            ->where('status', 'Occupied')
            ->count();

        $pendingValidationCount = DB::table('restaurant_tables')
            ->where('is_active', true)
            ->where(function ($q) {
                $q->where('status', 'Pending Validation')
                  ->orWhereExists(function ($sub) {
                      $sub->select(DB::raw(1))
                          ->from('table_sessions')
                          ->whereColumn('table_sessions.table_id', 'restaurant_tables.id')
                          ->where('table_sessions.status', 'Pending Validation');
                  });
            })
            ->count();

        $readyOrdersCount = DB::table('orders')
            ->where('order_type', 'dine_in')
            ->where('order_status', 'Ready')
            ->count();

        $cleaningCount = DB::table('restaurant_tables')
            ->where('is_active', true)
            ->where('status', 'Cleaning')
            ->count();

        $availableCount = DB::table('restaurant_tables')
            ->where('is_active', true)
            ->where('status', 'Available')
            ->count();

        $servedTodayCount = DB::table('orders')
            ->where('order_type', 'dine_in')
            ->where('order_status', 'Served')
            ->whereDate('updated_at', $today)
            ->count();

        $metrics = [
            'occupiedTables' => $occupiedCount,
            'pendingValidationTables' => $pendingValidationCount,
            'readyToServeOrders' => $readyOrdersCount,
            'cleaningTables' => $cleaningCount,
            'availableTables' => $availableCount,
            'servedToday' => $servedTodayCount,
        ];

        // Active queue for today (First-come first-served)
        $activeQueueOrderIds = DB::table('orders')
            ->whereIn('order_status', ['Pending', 'Awaiting Payment', 'Paid', 'Confirmed', 'Preparing'])
            ->whereDate('created_at', $today)
            ->orderBy('id', 'asc')
            ->pluck('id')
            ->toArray();
        $totalActiveQueue = count($activeQueueOrderIds);

        // 2. Fetch Dine-in Orders Ready to Serve (Priority Queue)
        $readyOrders = DB::table('orders')
            ->leftJoin('customers', 'orders.customer_id', '=', 'customers.id')
            ->leftJoin('table_sessions', 'orders.table_session_id', '=', 'table_sessions.id')
            ->leftJoin('restaurant_tables', 'table_sessions.table_id', '=', 'restaurant_tables.id')
            ->where('orders.order_type', 'dine_in')
            ->where('orders.order_status', 'Ready')
            ->select(
                'orders.*',
                'customers.name as customer_name',
                'customers.phone_normalized as customer_phone',
                DB::raw("COALESCE(orders.table_number, restaurant_tables.table_number, 'Meja 01') as table_number"),
                'table_sessions.session_code'
            )
            ->orderBy('orders.updated_at', 'asc') // Oldest ready order first
            ->get()
            ->map(function ($order) use ($activeQueueOrderIds, $totalActiveQueue) {
                $items = DB::table('order_items')
                    ->where('order_id', $order->id)
                    ->get();
                $order->items = $items;
                $pos = array_search($order->id, $activeQueueOrderIds);
                $order->queue_number = ($pos !== false) ? ($pos + 1) : null;
                $order->total_queue = $totalActiveQueue;
                return $order;
            });

        // 3. Fetch Dine-in Orders in Kitchen Preparation (Up Next Preview)
        $preparingOrders = DB::table('orders')
            ->leftJoin('customers', 'orders.customer_id', '=', 'customers.id')
            ->leftJoin('table_sessions', 'orders.table_session_id', '=', 'table_sessions.id')
            ->leftJoin('restaurant_tables', 'table_sessions.table_id', '=', 'restaurant_tables.id')
            ->where('orders.order_type', 'dine_in')
            ->where('orders.order_status', 'Preparing')
            ->select(
                'orders.*',
                'customers.name as customer_name',
                DB::raw("COALESCE(orders.table_number, restaurant_tables.table_number, 'Meja 01') as table_number")
            )
            ->orderBy('orders.updated_at', 'asc')
            ->limit(10)
            ->get()
            ->map(function ($order) use ($activeQueueOrderIds, $totalActiveQueue) {
                $items = DB::table('order_items')
                    ->where('order_id', $order->id)
                    ->get();
                $order->items = $items;
                $pos = array_search($order->id, $activeQueueOrderIds);
                $order->queue_number = ($pos !== false) ? ($pos + 1) : null;
                $order->total_queue = $totalActiveQueue;
                return $order;
            });

        // 4. Fetch Recently Served Orders Today (Audit & History)
        $recentServedOrders = DB::table('orders')
            ->leftJoin('customers', 'orders.customer_id', '=', 'customers.id')
            ->leftJoin('table_sessions', 'orders.table_session_id', '=', 'table_sessions.id')
            ->leftJoin('restaurant_tables', 'table_sessions.table_id', '=', 'restaurant_tables.id')
            ->where('orders.order_type', 'dine_in')
            ->where('orders.order_status', 'Served')
            ->whereDate('orders.updated_at', $today)
            ->select(
                'orders.*',
                'customers.name as customer_name',
                DB::raw("COALESCE(orders.table_number, restaurant_tables.table_number, 'Meja 01') as table_number")
            )
            ->orderBy('orders.updated_at', 'desc')
            ->limit(8)
            ->get()
            ->map(function ($order) {
                $items = DB::table('order_items')
                    ->where('order_id', $order->id)
                    ->get();
                $order->items = $items;
                return $order;
            });

        // 5. Fetch 10 Restaurant Tables Floor Overview with active sessions & live orders
        $todayStr = Carbon::today('Asia/Jakarta')->toDateString();
        $tables = DB::table('restaurant_tables')
            ->where('is_active', true)
            ->orderBy('table_number', 'asc')
            ->get()
            ->map(function ($tbl) use ($todayStr) {
                // Find latest active session
                $activeSession = DB::table('table_sessions')
                    ->where('table_id', $tbl->id)
                    ->whereIn('status', ['Pending Validation', 'Open'])
                    ->orderBy('id', 'desc')
                    ->first();

                $tbl->active_session = $activeSession ? [
                    'id' => $activeSession->id,
                    'session_code' => $activeSession->session_code,
                    'status' => $activeSession->status,
                    'started_at' => $activeSession->started_at,
                ] : null;

                // Check active orders for this table (Pending, Preparing, Ready, Delivered, etc.)
                $activeOrders = DB::table('orders')
                    ->where(function ($q) use ($tbl) {
                        $q->where('table_number', $tbl->table_number)
                          ->orWhere('table_number', 'Meja ' . str_pad($tbl->id, 2, '0', STR_PAD_LEFT))
                          ->orWhere('table_number', (string) $tbl->id)
                          ->orWhere('table_session_id', function ($sub) use ($tbl) {
                              $sub->select('id')->from('table_sessions')
                                  ->where('table_id', $tbl->id)
                                  ->whereIn('status', ['Open', 'Pending Validation'])
                                  ->limit(1);
                          });
                    })
                    ->whereIn('order_status', ['Pending', 'Awaiting Payment', 'Paid', 'Confirmed', 'Preparing', 'Ready', 'Delivered'])
                    ->orderBy('id', 'desc')
                    ->get();

                $activeOrdersCount = $activeOrders->count();
                $latestOrder = $activeOrders->first();

                // Find active reservation for today on this table
                $activeReservation = DB::table('reservations')
                    ->join('reservation_tables', 'reservations.id', '=', 'reservation_tables.reservation_id')
                    ->leftJoin('customers', 'reservations.customer_id', '=', 'customers.id')
                    ->leftJoin('dining_experiences', 'reservations.experience_id', '=', 'dining_experiences.id')
                    ->where('reservation_tables.table_id', $tbl->id)
                    ->whereIn('reservations.status', ['Pending', 'Confirmed', 'Seated'])
                    ->whereDate('reservations.reservation_datetime', $todayStr)
                    ->select(
                        'reservations.id',
                        'reservations.reservation_code',
                        'reservations.reservation_datetime',
                        'reservations.guest_count',
                        'reservations.status',
                        'customers.name as customer_name',
                        'customers.phone_normalized as customer_phone',
                        'dining_experiences.name as experience_name'
                    )
                    ->orderBy('reservations.reservation_datetime', 'asc')
                    ->first();

                // 1. Meja terpakai jika customer sudah memesan di halaman order
                // 2. Meja tercatat reservasi jika ada booking untuk hari ini
                if ($activeOrdersCount > 0) {
                    $tbl->status = 'Occupied';
                } elseif ($activeReservation && !in_array($tbl->status, ['Cleaning', 'Maintenance', 'Inactive'])) {
                    $tbl->status = 'Reserved';
                } elseif ($activeSession && $activeSession->status === 'Pending Validation' && $tbl->status === 'Available') {
                    $tbl->status = 'Pending Validation';
                }

                $tbl->active_orders_count = $activeOrdersCount;
                $tbl->active_order = $latestOrder ? [
                    'order_code' => $latestOrder->order_code,
                    'customer_name' => $latestOrder->customer_name,
                    'order_status' => $latestOrder->order_status,
                    'total' => (float) $latestOrder->total,
                ] : null;

                $tbl->active_reservation = $activeReservation ? [
                    'id' => $activeReservation->id,
                    'reservation_code' => $activeReservation->reservation_code,
                    'customer_name' => $activeReservation->customer_name ?: 'Tamu Reservasi',
                    'customer_phone' => $activeReservation->customer_phone,
                    'guest_count' => $activeReservation->guest_count,
                    'time' => Carbon::parse($activeReservation->reservation_datetime)->format('H:i') . ' WIB',
                    'experience_name' => $activeReservation->experience_name ?: 'A La Carte',
                    'status' => $activeReservation->status,
                ] : null;

                return $tbl;
            });

        // 6. Reservations (for Calendar Floor Plan synchronization)
        $reservations = DB::table('reservations')
            ->leftJoin('customers', 'reservations.customer_id', '=', 'customers.id')
            ->leftJoin('dining_experiences', 'reservations.experience_id', '=', 'dining_experiences.id')
            ->leftJoin('reservation_tables', 'reservations.id', '=', 'reservation_tables.reservation_id')
            ->leftJoin('restaurant_tables', 'reservation_tables.table_id', '=', 'restaurant_tables.id')
            ->select(
                'reservations.*',
                'customers.name as customer_name',
                'customers.phone_normalized as customer_phone',
                'dining_experiences.name as experience_name',
                'restaurant_tables.table_number as table_number',
                'restaurant_tables.id as table_id'
            )
            ->whereDate('reservations.reservation_datetime', '>=', $todayStr)
            ->orderBy('reservations.reservation_datetime', 'asc')
            ->limit(50)
            ->get();

        // 7. Chat messages with Admin & unread count
        $chatMessages = DB::table('chat_messages')
            ->where('user_id', $user->id)
            ->orderBy('id', 'asc')
            ->get();

        $unreadChatCount = DB::table('chat_messages')
            ->where('user_id', $user->id)
            ->where('sender_type', 'admin')
            ->where('is_read', false)
            ->count();

        $settings = DB::table('restaurant_settings')->first();

        return Inertia::render('Waiter/Dashboard', [
            'waiterUser' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $roleName,
            ],
            'metrics' => $metrics,
            'readyOrders' => $readyOrders,
            'preparingOrders' => $preparingOrders,
            'recentServedOrders' => $recentServedOrders,
            'tables' => $tables,
            'reservations' => $reservations,
            'chatMessages' => $chatMessages,
            'unreadChatCount' => $unreadChatCount,
            'settings' => $settings,
        ]);
    }

    /**
     * Waiter validates table occupancy (Pending Validation -> Occupied / Open Session)
     * PRD Section 4.1 & 6.1
     */
    public function validateTable(Request $request, $id)
    {
        $table = DB::table('restaurant_tables')->where('id', $id)->first();
        if (!$table) {
            return back()->with('error', 'Meja tidak ditemukan.');
        }

        DB::table('restaurant_tables')->where('id', $id)->update([
            'status' => 'Occupied',
            'updated_at' => now(),
        ]);

        // Find or create active table session
        $existingSession = DB::table('table_sessions')
            ->where('table_id', $id)
            ->whereIn('status', ['Pending Validation', 'Open'])
            ->first();

        if ($existingSession) {
            DB::table('table_sessions')->where('id', $existingSession->id)->update([
                'status' => 'Open',
                'opened_by' => Auth::id(),
                'started_at' => $existingSession->started_at ?? now(),
                'updated_at' => now(),
            ]);
        } else {
            DB::table('table_sessions')->insert([
                'table_id' => $id,
                'session_code' => 'SES-' . strtoupper(Str::random(6)),
                'status' => 'Open',
                'opened_by' => Auth::id(),
                'started_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return back()->with('success', "Okupansi {$table->table_number} berhasil divalidasi! Sesi meja telah dibuka (Open).");
    }

    /**
     * Waiter marks order as Served (Ready -> Served)
     * PRD Section 5.1 & 8.2
     */
    public function markServed(Request $request, $orderId)
    {
        $order = DB::table('orders')->where('id', $orderId)->first();
        if (!$order) {
            return back()->with('error', 'Pesanan tidak ditemukan.');
        }

        if ($order->order_status !== 'Ready') {
            return back()->with('error', "Pesanan {$order->order_code} saat ini belum siap saji ({$order->order_status}).");
        }

        DB::table('orders')->where('id', $orderId)->update([
            'order_status' => 'Served',
            'updated_at' => now(),
        ]);

        // Record history
        DB::table('order_status_histories')->insert([
            'order_id' => $orderId,
            'changed_by' => Auth::id(),
            'previous_status' => 'Ready',
            'new_status' => 'Served',
            'notes' => 'Hidangan telah diantarkan dan disajikan ke meja oleh Waiter (' . (Auth::user()->name ?? 'Waiter') . ')',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Record waiter assignment
        DB::table('waiter_assignments')->insert([
            'order_id' => $orderId,
            'waiter_id' => Auth::id(),
            'assigned_by' => Auth::id(),
            'assigned_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $tableLabel = $order->table_number ? "{$order->table_number}" : 'meja tamu';
        return back()->with('success', "Pesanan {$order->order_code} berhasil disajikan ke {$tableLabel}!");
    }

    /**
     * Waiter starts cleaning table after customer departs (Occupied -> Cleaning)
     * PRD Section 6.1 & 6.2
     */
    public function startCleaning(Request $request, $tableId)
    {
        $table = DB::table('restaurant_tables')->where('id', $tableId)->first();
        if (!$table) {
            return back()->with('error', 'Meja tidak ditemukan.');
        }

        DB::table('restaurant_tables')->where('id', $tableId)->update([
            'status' => 'Cleaning',
            'updated_at' => now(),
        ]);

        return back()->with('success', "{$table->table_number} ditandai sedang dibersihkan (Cleaning).");
    }

    /**
     * Waiter finishes cleaning table and closes session (Cleaning -> Available)
     * PRD Section 6.1 & 6.2
     */
    public function finishCleaning(Request $request, $tableId)
    {
        $table = DB::table('restaurant_tables')->where('id', $tableId)->first();
        if (!$table) {
            return back()->with('error', 'Meja tidak ditemukan.');
        }

        DB::table('restaurant_tables')->where('id', $tableId)->update([
            'status' => 'Available',
            'updated_at' => now(),
        ]);

        // Close any active table sessions
        DB::table('table_sessions')
            ->where('table_id', $tableId)
            ->whereIn('status', ['Pending Validation', 'Open'])
            ->update([
                'status' => 'Closed',
                'closed_by' => Auth::id(),
                'ended_at' => now(),
                'updated_at' => now(),
            ]);

        return back()->with('success', "{$table->table_number} telah selesai dibersihkan, rapi, dan siap digunakan (Available)!");
    }

    /**
     * Trigger simulated pending validation for test preview
     */
    public function requestOccupancy(Request $request, $tableId)
    {
        $table = DB::table('restaurant_tables')->where('id', $tableId)->first();
        if (!$table) {
            return back()->with('error', 'Meja tidak ditemukan.');
        }

        DB::table('restaurant_tables')->where('id', $tableId)->update([
            'status' => 'Pending Validation',
            'updated_at' => now(),
        ]);

        DB::table('table_sessions')->insert([
            'table_id' => $tableId,
            'session_code' => 'SES-' . strtoupper(Str::random(6)),
            'status' => 'Pending Validation',
            'opened_by' => null,
            'started_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return back()->with('success', "Simulasi: Tamu memindai QR {$table->table_number}. Meja menunggu validasi waiter.");
    }

    /**
     * Waiter manual table status update (synchronous with Admin desk)
     */
    public function updateTableStatus(Request $request, $tableId)
    {
        $user = Auth::user();
        $request->validate([
            'status' => 'required|in:Available,Occupied,Reserved,Cleaning,Maintenance,Inactive',
        ]);

        $table = DB::table('restaurant_tables')->where('id', $tableId)->first();
        if (!$table) {
            return back()->with('error', 'Meja tidak ditemukan.');
        }

        DB::table('restaurant_tables')->where('id', $tableId)->update([
            'status' => $request->status,
            'updated_at' => now(),
        ]);

        // If marked available, close any open sessions
        if ($request->status === 'Available') {
            DB::table('table_sessions')
                ->where('table_id', $tableId)
                ->whereIn('status', ['Pending Validation', 'Open'])
                ->update([
                    'status' => 'Closed',
                    'closed_by' => $user->id,
                    'ended_at' => now(),
                    'updated_at' => now(),
                ]);
        }

        DB::table('audit_logs')->insert([
            'user_id' => $user->id,
            'action' => 'UPDATE_TABLE_STATUS_WAITER',
            'entity_type' => 'restaurant_tables',
            'entity_id' => $tableId,
            'description' => "Waiter {$user->name} mengubah status {$table->table_number} dari {$table->status} menjadi {$request->status}",
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return back()->with('success', "Status {$table->table_number} berhasil diubah menjadi {$request->status}!");
    }
}
