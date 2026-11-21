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
            ->map(function ($order) {
                $items = DB::table('order_items')
                    ->where('order_id', $order->id)
                    ->get();
                $order->items = $items;
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
            ->map(function ($order) {
                $items = DB::table('order_items')
                    ->where('order_id', $order->id)
                    ->get();
                $order->items = $items;
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

        // 5. Fetch 10 Restaurant Tables Floor Overview with active sessions
        $tables = DB::table('restaurant_tables')
            ->where('is_active', true)
            ->orderBy('table_number', 'asc')
            ->get()
            ->map(function ($tbl) {
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

                // If active session is Pending Validation, reflect that in table status
                if ($activeSession && $activeSession->status === 'Pending Validation' && $tbl->status === 'Available') {
                    $tbl->status = 'Pending Validation';
                }

                // Check active pending or ready orders for this table
                $activeOrdersCount = DB::table('orders')
                    ->where('table_number', $tbl->table_number)
                    ->whereIn('order_status', ['Paid', 'Confirmed', 'Preparing', 'Ready'])
                    ->count();

                $tbl->active_orders_count = $activeOrdersCount;

                return $tbl;
            });

        // 6. Reservations (for Calendar Floor Plan synchronization)
        $todayStr = Carbon::today()->toDateString();
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
}
