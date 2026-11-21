<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CashierController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return redirect()->route('login');
        }

        // Check role: allow cashier and admin
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        $roleName = $role ? $role->name : 'customer';

        if (!in_array($roleName, ['cashier', 'admin'])) {
            return redirect()->route('order.app')->with('error', 'Akses khusus staf kasir dan admin operasional.');
        }

        $today = Carbon::today();

        // 1. Metric Calculations
        $pendingCount = DB::table('orders')
            ->whereIn('order_status', ['Pending', 'Awaiting Payment', 'Paid'])
            ->count();

        $preparingCount = DB::table('orders')
            ->where('order_status', 'Preparing')
            ->count();

        $readyCount = DB::table('orders')
            ->where('order_status', 'Ready')
            ->count();

        $completedTodayCount = DB::table('orders')
            ->whereIn('order_status', ['Served', 'Picked Up', 'Completed'])
            ->whereDate('created_at', $today)
            ->count();

        $todayRevenue = DB::table('orders')
            ->whereNotIn('order_status', ['Cancelled', 'Pending', 'Awaiting Payment'])
            ->whereDate('created_at', $today)
            ->sum('total');

        // 2. Fetch Orders Queue (centralized Dine-in & Takeaway)
        $ordersQuery = DB::table('orders')
            ->leftJoin('customers', 'orders.customer_id', '=', 'customers.id')
            ->leftJoin('table_sessions', 'orders.table_session_id', '=', 'table_sessions.id')
            ->leftJoin('restaurant_tables', 'table_sessions.table_id', '=', 'restaurant_tables.id')
            ->select(
                'orders.*',
                'customers.name as customer_name',
                'customers.phone_normalized as customer_phone',
                DB::raw("COALESCE(orders.table_number, restaurant_tables.table_number, 'Meja -') as table_number"),
                'table_sessions.session_code'
            )
            ->orderByRaw("
                CASE 
                    WHEN orders.order_status IN ('Pending', 'Awaiting Payment', 'Paid') THEN 1
                    WHEN orders.order_status = 'Preparing' THEN 2
                    WHEN orders.order_status = 'Ready' THEN 3
                    ELSE 4
                END ASC
            ")
            ->orderBy('orders.id', 'desc');

        // Optional status filter
        if ($request->filled('status') && $request->status !== 'all') {
            if ($request->status === 'pending') {
                $ordersQuery->whereIn('orders.order_status', ['Pending', 'Awaiting Payment', 'Paid']);
            } elseif ($request->status === 'preparing') {
                $ordersQuery->where('orders.order_status', 'Preparing');
            } elseif ($request->status === 'ready') {
                $ordersQuery->where('orders.order_status', 'Ready');
            } elseif ($request->status === 'completed') {
                $ordersQuery->whereIn('orders.order_status', ['Served', 'Picked Up', 'Completed']);
            } elseif ($request->status === 'cancelled') {
                $ordersQuery->where('orders.order_status', 'Cancelled');
            }
        }

        // Optional order_type filter (dine_in vs takeaway)
        if ($request->filled('type') && $request->type !== 'all') {
            $ordersQuery->where('orders.order_type', $request->type);
        }

        // Optional search query
        if ($request->filled('search')) {
            $s = trim($request->search);
            $ordersQuery->where(function ($q) use ($s) {
                $q->where('orders.order_code', 'like', "%{$s}%")
                  ->orWhere('customers.name', 'like', "%{$s}%")
                  ->orWhere('orders.table_number', 'like', "%{$s}%");
            });
        }

        $orders = $ordersQuery->limit(100)->get()->map(function ($order) {
            $order->items = DB::table('order_items')
                ->where('order_id', $order->id)
                ->get();

            $order->payment = DB::table('payments')
                ->where('order_id', $order->id)
                ->first();

            return $order;
        });

        // 3. Restaurant Tables
        $tables = DB::table('restaurant_tables')
            ->where('is_active', true)
            ->get()
            ->map(function ($table) {
                $table->active_session = DB::table('table_sessions')
                    ->where('table_id', $table->id)
                    ->whereIn('status', ['Pending Validation', 'Open'])
                    ->orderBy('id', 'desc')
                    ->first();
                return $table;
            });

        // 4. Reservations for today and upcoming with table info
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
            ->whereDate('reservations.reservation_datetime', '>=', $today)
            ->orderBy('reservations.reservation_datetime', 'asc')
            ->limit(50)
            ->get();

        // 5. Chat messages with Admin & unread count
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

        return Inertia::render('Cashier/Dashboard', [
            'cashierUser' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $roleName,
            ],
            'metrics' => [
                'pendingOrders' => $pendingCount,
                'preparingOrders' => $preparingCount,
                'readyOrders' => $readyCount,
                'completedToday' => $completedTodayCount,
                'todayRevenue' => (float) $todayRevenue,
            ],
            'orders' => $orders,
            'tables' => $tables,
            'reservations' => $reservations,
            'chatMessages' => $chatMessages,
            'unreadChatCount' => $unreadChatCount,
            'settings' => $settings,
            'filters' => [
                'status' => $request->query('status', 'all'),
                'type' => $request->query('type', 'all'),
                'search' => $request->query('search', ''),
            ],
        ]);
    }

    public function updateOrderStatus(Request $request, $orderId)
    {
        $user = Auth::user();
        $request->validate([
            'order_status' => 'required|in:Pending,Awaiting Payment,Paid,Confirmed,Preparing,Ready,Served,Picked Up,Cancelled',
            'notes' => 'nullable|string',
        ]);

        $order = DB::table('orders')->where('id', $orderId)->first();
        if (!$order) {
            return redirect()->back()->with('error', 'Pesanan tidak ditemukan.');
        }

        $prevStatus = $order->order_status;
        $newStatus = $request->order_status;

        DB::table('orders')->where('id', $orderId)->update([
            'order_status' => $newStatus,
            'updated_at' => now(),
        ]);

        // Track order status history
        DB::table('order_status_histories')->insert([
            'order_id' => $orderId,
            'changed_by' => $user->id,
            'previous_status' => $prevStatus,
            'new_status' => $newStatus,
            'notes' => $request->notes ?? "Diperbarui oleh Kasir {$user->name}",
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Audit log
        DB::table('audit_logs')->insert([
            'user_id' => $user->id,
            'action' => 'UPDATE_ORDER_STATUS',
            'entity_type' => 'orders',
            'entity_id' => $orderId,
            'description' => "Kasir {$user->name} memperbarui status pesanan {$order->order_code} menjadi {$newStatus}",
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return redirect()->back()->with('success', "Pesanan #{$order->order_code} berhasil diubah ke status: {$newStatus}!");
    }

    public function confirmCashPayment(Request $request, $orderId)
    {
        $user = Auth::user();
        $order = DB::table('orders')->where('id', $orderId)->first();
        if (!$order) {
            return redirect()->back()->with('error', 'Pesanan tidak ditemukan.');
        }

        // Record payment
        $existingPayment = DB::table('payments')->where('order_id', $orderId)->first();
        if ($existingPayment) {
            DB::table('payments')->where('id', $existingPayment->id)->update([
                'payment_method' => 'Cash',
                'payment_status' => 'Success',
                'amount' => $order->total,
                'paid_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            DB::table('payments')->insert([
                'order_id' => $orderId,
                'payment_method' => 'Cash',
                'payment_status' => 'Success',
                'amount' => $order->total,
                'paid_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Advance status to Confirmed or Preparing
        $prevStatus = $order->order_status;
        $newStatus = 'Preparing'; // Send straight to kitchen after payment confirmed by cashier

        DB::table('orders')->where('id', $orderId)->update([
            'order_status' => $newStatus,
            'updated_at' => now(),
        ]);

        DB::table('order_status_histories')->insert([
            'order_id' => $orderId,
            'changed_by' => $user->id,
            'previous_status' => $prevStatus,
            'new_status' => $newStatus,
            'notes' => "Pembayaran tunai diterima kasir {$user->name}. Pesanan dikonfirmasi & diteruskan ke dapur.",
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('audit_logs')->insert([
            'user_id' => $user->id,
            'action' => 'CONFIRM_CASH_PAYMENT',
            'entity_type' => 'orders',
            'entity_id' => $orderId,
            'description' => "Kasir {$user->name} mengonfirmasi pembayaran tunai Rp " . number_format($order->total, 0, ',', '.') . " untuk pesanan {$order->order_code}",
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return redirect()->back()->with('success', "Pembayaran tunai pesanan #{$order->order_code} sebesar Rp " . number_format($order->total, 0, ',', '.') . " berhasil diverifikasi dan dikirim ke dapur!");
    }

    public function updateTableStatus(Request $request, $tableId)
    {
        $user = Auth::user();
        $request->validate([
            'status' => 'required|in:Available,Occupied,Reserved,Cleaning,Inactive',
        ]);

        $table = DB::table('restaurant_tables')->where('id', $tableId)->first();
        if (!$table) {
            return redirect()->back()->with('error', 'Meja tidak ditemukan.');
        }

        DB::table('restaurant_tables')->where('id', $tableId)->update([
            'status' => $request->status,
            'updated_at' => now(),
        ]);

        DB::table('audit_logs')->insert([
            'user_id' => $user->id,
            'action' => 'UPDATE_TABLE_STATUS',
            'entity_type' => 'restaurant_tables',
            'entity_id' => $tableId,
            'description' => "Kasir {$user->name} mengubah status {$table->table_number} menjadi {$request->status}",
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return redirect()->back()->with('success', "Status {$table->table_number} berhasil diubah menjadi {$request->status}!");
    }

    public function updateReservationStatus(Request $request, $reservationId)
    {
        $user = Auth::user();
        $request->validate([
            'status' => 'required|in:Pending,Confirmed,Seated,Completed,Cancelled',
        ]);

        $res = DB::table('reservations')->where('id', $reservationId)->first();
        if (!$res) {
            return redirect()->back()->with('error', 'Reservasi tidak ditemukan.');
        }

        DB::table('reservations')->where('id', $reservationId)->update([
            'status' => $request->status,
            'updated_at' => now(),
        ]);

        DB::table('audit_logs')->insert([
            'user_id' => $user->id,
            'action' => 'UPDATE_RESERVATION_STATUS',
            'entity_type' => 'reservations',
            'entity_id' => $reservationId,
            'description' => "Kasir {$user->name} memperbarui reservasi {$res->reservation_code} menjadi {$request->status}",
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return redirect()->back()->with('success', "Reservasi #{$res->reservation_code} berhasil diubah ke {$request->status}!");
    }
}
