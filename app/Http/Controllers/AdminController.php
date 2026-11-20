<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return redirect()->route('login');
        }

        // Verify Admin role
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        if (!$role || $role->name !== 'admin') {
            return redirect()->route('home')->with('error', 'Akses ditolak. Halaman ini khusus Administrator Restoran.');
        }

        // 1. KPI Metrics
        $today = now()->toDateString();
        $todayRevenue = DB::table('orders')
            ->whereDate('created_at', $today)
            ->whereNotIn('order_status', ['Cancelled'])
            ->sum('total');

        $monthlyRevenue = DB::table('orders')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->whereNotIn('order_status', ['Cancelled'])
            ->sum('total');

        $totalOrdersCount = DB::table('orders')->count();
        $activeOrdersCount = DB::table('orders')
            ->whereIn('order_status', ['Awaiting Payment', 'Paid', 'Confirmed', 'Preparing', 'Ready'])
            ->count();

        $occupiedTablesCount = DB::table('restaurant_tables')
            ->where('status', 'Occupied')
            ->count();
        $totalTablesCount = DB::table('restaurant_tables')->where('is_active', true)->count();

        $pendingReservationsCount = DB::table('reservations')
            ->where('status', 'Pending')
            ->count();

        // 2. Orders with items and customer details
        $orders = DB::table('orders')
            ->leftJoin('customers', 'orders.customer_id', '=', 'customers.id')
            ->leftJoin('table_sessions', 'orders.table_session_id', '=', 'table_sessions.id')
            ->leftJoin('restaurant_tables', 'table_sessions.table_id', '=', 'restaurant_tables.id')
            ->select(
                'orders.*',
                DB::raw("COALESCE(orders.customer_name, customers.name, 'Tamu Meja') as customer_name"),
                'customers.phone_normalized as customer_phone',
                DB::raw("COALESCE(orders.table_number, restaurant_tables.table_number, 'Meja -') as table_number"),
                'table_sessions.session_code'
            )
            ->orderBy('orders.id', 'desc')
            ->limit(50)
            ->get()
            ->map(function ($order) {
                $order->items = DB::table('order_items')
                    ->where('order_id', $order->id)
                    ->get();
                $order->payment = DB::table('payments')
                    ->where('order_id', $order->id)
                    ->first();
                $order->rating = DB::table('order_ratings')
                    ->where('order_id', $order->id)
                    ->first();
                return $order;
            });

        // 3. Menus with categories & images
        $menus = DB::table('menus')
            ->join('categories', 'menus.category_id', '=', 'categories.id')
            ->leftJoin('menu_images', function ($join) {
                $join->on('menus.id', '=', 'menu_images.menu_id')
                    ->where('menu_images.is_primary', true);
            })
            ->whereNull('menus.deleted_at')
            ->select(
                'menus.*',
                'categories.name as category_name',
                'menu_images.image_path'
            )
            ->orderBy('categories.name', 'asc')
            ->get();

        // 4. Restaurant Tables & Active Sessions
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

        // 5. Reservations
        $reservations = DB::table('reservations')
            ->leftJoin('customers', 'reservations.customer_id', '=', 'customers.id')
            ->leftJoin('dining_experiences', 'reservations.experience_id', '=', 'dining_experiences.id')
            ->select(
                'reservations.*',
                'customers.name as customer_name',
                'customers.phone_normalized as customer_phone',
                'dining_experiences.name as experience_name'
            )
            ->orderBy('reservations.reservation_datetime', 'asc')
            ->get();

        // 6. Recent Audit Logs
        $auditLogs = DB::table('audit_logs')
            ->leftJoin('users', 'audit_logs.user_id', '=', 'users.id')
            ->select(
                'audit_logs.*',
                'users.name as user_name'
            )
            ->orderBy('audit_logs.id', 'desc')
            ->limit(20)
            ->get();

        $settings = DB::table('restaurant_settings')->first();

        return Inertia::render('Admin/Dashboard', [
            'metrics' => [
                'todayRevenue' => (float) $todayRevenue,
                'monthlyRevenue' => (float) $monthlyRevenue,
                'totalOrders' => $totalOrdersCount,
                'activeOrders' => $activeOrdersCount,
                'occupiedTables' => $occupiedTablesCount,
                'totalTables' => $totalTablesCount,
                'pendingReservations' => $pendingReservationsCount,
            ],
            'orders' => $orders,
            'menus' => $menus,
            'tables' => $tables,
            'reservations' => $reservations,
            'auditLogs' => $auditLogs,
            'settings' => $settings,
            'adminUser' => $user,
        ]);
    }

    public function updateOrderStatus(Request $request, $orderId)
    {
        $user = Auth::user();
        $request->validate([
            'order_status' => 'required|in:Awaiting Payment,Paid,Confirmed,Preparing,Ready,Served,Picked Up,Cancelled',
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

        // Track order status history (PRD Section 5.1 & ERD)
        DB::table('order_status_histories')->insert([
            'order_id' => $orderId,
            'changed_by' => $user->id,
            'previous_status' => $prevStatus,
            'new_status' => $newStatus,
            'notes' => $request->notes ?? "Diperbarui oleh Admin {$user->name}",
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Audit log
        DB::table('audit_logs')->insert([
            'user_id' => $user->id,
            'action' => 'UPDATE_ORDER_STATUS',
            'entity_type' => 'orders',
            'entity_id' => $orderId,
            'description' => "Status pesanan {$order->order_code} diubah dari {$prevStatus} menjadi {$newStatus}",
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return redirect()->back()->with('success', "Status pesanan #{$order->order_code} berhasil diubah ke {$newStatus}!");
    }

    public function updateMenuStock(Request $request, $menuId)
    {
        $user = Auth::user();
        $request->validate([
            'stock_quantity' => 'required|integer|min:0',
            'is_available' => 'required|boolean',
        ]);

        $menu = DB::table('menus')->where('id', $menuId)->first();
        if (!$menu) {
            return redirect()->back()->with('error', 'Menu tidak ditemukan.');
        }

        DB::table('menus')->where('id', $menuId)->update([
            'stock_quantity' => $request->stock_quantity,
            'is_available' => $request->is_available,
            'updated_at' => now(),
        ]);

        DB::table('audit_logs')->insert([
            'user_id' => $user->id,
            'action' => 'UPDATE_MENU_STOCK',
            'entity_type' => 'menus',
            'entity_id' => $menuId,
            'description' => "Stok menu {$menu->name} diperbarui menjadi {$request->stock_quantity} (Tersedia: " . ($request->is_available ? 'Ya' : 'Tidak') . ")",
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return redirect()->back()->with('success', "Stok menu {$menu->name} berhasil diperbarui!");
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
            'action' => 'UPDATE_TABLE_STATUS',
            'entity_type' => 'restaurant_tables',
            'entity_id' => $tableId,
            'description' => "Status {$table->table_number} diubah dari {$table->status} menjadi {$request->status}",
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return redirect()->back()->with('success', "Status {$table->table_number} berhasil diubah ke {$request->status}!");
    }

    public function updateReservationStatus(Request $request, $reservationId)
    {
        $user = Auth::user();
        $request->validate([
            'status' => 'required|in:Pending,Confirmed,Rejected,Cancelled,Completed,No Show',
        ]);

        $reservation = DB::table('reservations')->where('id', $reservationId)->first();
        if (!$reservation) {
            return redirect()->back()->with('error', 'Reservasi tidak ditemukan.');
        }

        $prevStatus = $reservation->status;
        $newStatus = $request->status;

        DB::table('reservations')->where('id', $reservationId)->update([
            'status' => $newStatus,
            'confirmed_by' => in_array($newStatus, ['Confirmed', 'Rejected']) ? $user->id : $reservation->confirmed_by,
            'updated_at' => now(),
        ]);

        DB::table('reservation_status_histories')->insert([
            'reservation_id' => $reservationId,
            'changed_by' => $user->id,
            'previous_status' => $prevStatus,
            'new_status' => $newStatus,
            'notes' => "Status reservasi diperbarui oleh {$user->name}",
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('audit_logs')->insert([
            'user_id' => $user->id,
            'action' => 'UPDATE_RESERVATION_STATUS',
            'entity_type' => 'reservations',
            'entity_id' => $reservationId,
            'description' => "Status reservasi {$reservation->reservation_code} diubah menjadi {$newStatus}",
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return redirect()->back()->with('success', "Status reservasi #{$reservation->reservation_code} berhasil diubah ke {$newStatus}!");
    }
}
