<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return redirect()->route('login');
        }

        $customer = DB::table('customers')->where('user_id', $user->id)->first();

        // 1. Categories
        $categories = DB::table('categories')
            ->where('is_active', true)
            ->get();

        // 2. Menus with primary image
        $menus = DB::table('menus')
            ->join('categories', 'menus.category_id', '=', 'categories.id')
            ->leftJoin('menu_images', function ($join) {
                $join->on('menus.id', '=', 'menu_images.menu_id')
                    ->where('menu_images.is_primary', true);
            })
            ->whereNull('menus.deleted_at')
            ->select(
                'menus.id',
                'menus.category_id',
                'categories.slug as category_slug',
                'categories.name as category_name',
                'menus.name',
                'menus.slug',
                'menus.description',
                'menus.price',
                'menus.stock_quantity',
                'menus.is_available',
                'menus.is_featured',
                'menu_images.image_path'
            )
            ->get()
            ->map(function ($menu) {
                $menu->is_best_seller = in_array($menu->slug, [
                    'rendang-wagyu-tokusen-48-jam',
                    'bebek-betutu-gianyar-asap-bambu',
                    'rawon-iga-bakar-kluwek-hitam',
                    'cendol-nangka-gelato-madu-hutan',
                    'es-bir-pletok-keraton-royale'
                ]);
                return $menu;
            });

        // 3. User Favorites
        $favorites = DB::table('favorites')
            ->where('user_id', $user->id)
            ->pluck('menu_id')
            ->toArray();

        // 4. User Order History
        $ordersQuery = DB::table('orders')
            ->orderBy('id', 'desc');

        if ($customer) {
            $ordersQuery->where('customer_id', $customer->id);
        } else {
            // fallback if customer record is being created
            $ordersQuery->whereRaw('1 = 0');
        }

        $orders = $ordersQuery->get()->map(function ($order) {
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

        // 5. Chat History
        $chatMessages = DB::table('chat_messages')
            ->where('user_id', $user->id)
            ->orderBy('id', 'asc')
            ->get();

        // 6. Available Tables for Dine-in
        $tables = DB::table('restaurant_tables')
            ->where('is_active', true)
            ->get();

        $settings = DB::table('restaurant_settings')->first();

        return Inertia::render('Customer/OrderApp', [
            'categories' => $categories,
            'menus' => $menus,
            'favorites' => $favorites,
            'orders' => $orders,
            'chatMessages' => $chatMessages,
            'tables' => $tables,
            'settings' => $settings,
            'customer' => $customer,
        ]);
    }

    public function checkout(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return redirect()->route('login');
        }

        $request->validate([
            'order_type' => 'required|in:dine_in,takeaway',
            'table_number' => 'nullable|string',
            'customer_notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.menu_id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.item_notes' => 'nullable|string',
            'payment_method' => 'required|in:qris,bank_transfer,cash',
        ]);

        $customer = DB::table('customers')->where('user_id', $user->id)->first();
        if (!$customer) {
            $customerId = DB::table('customers')->insertGetId([
                'user_id' => $user->id,
                'name' => $user->name,
                'phone_normalized' => '+62812' . rand(1000000, 9999999),
                'email' => $user->email,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $customerId = $customer->id;
        }

        DB::beginTransaction();
        try {
            $subtotal = 0;
            $itemsData = [];

            foreach ($request->items as $item) {
                $menu = DB::table('menus')->where('id', $item['menu_id'])->first();
                if (!$menu || !$menu->is_available || $menu->stock_quantity <= 0) {
                    throw new \Exception("Menu {$menu->name} sedang tidak tersedia.");
                }

                $itemSubtotal = $menu->price * $item['quantity'];
                $subtotal += $itemSubtotal;

                $itemsData[] = [
                    'menu_id' => $menu->id,
                    'menu_name_snapshot' => $menu->name,
                    'unit_price_snapshot' => $menu->price,
                    'quantity' => $item['quantity'],
                    'subtotal' => $itemSubtotal,
                    'item_notes' => $item['item_notes'] ?? null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            $tax = round($subtotal * 0.11);
            $total = $subtotal + $tax;
            $orderCode = 'ORD-' . date('Ymd') . '-' . strtoupper(Str::random(4));

            // Table session if dine_in
            $tableSessionId = null;
            if ($request->order_type === 'dine_in' && $request->table_number) {
                $table = DB::table('restaurant_tables')->where('table_number', $request->table_number)->first();
                if ($table) {
                    $tableSessionId = DB::table('table_sessions')->insertGetId([
                        'table_id' => $table->id,
                        'session_code' => 'SES-' . $table->id . '-' . rand(1000, 9999),
                        'status' => 'Open',
                        'started_at' => now(),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            $orderId = DB::table('orders')->insertGetId([
                'order_code' => $orderCode,
                'access_token_hash' => hash('sha256', Str::random(32)),
                'customer_id' => $customerId,
                'table_session_id' => $tableSessionId,
                'order_type' => $request->order_type,
                'order_status' => 'Preparing', // simulated order confirmation
                'subtotal' => $subtotal,
                'tax' => $tax,
                'discount' => 0,
                'total' => $total,
                'customer_notes' => $request->customer_notes,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($itemsData as &$itemData) {
                $itemData['order_id'] = $orderId;
            }
            DB::table('order_items')->insert($itemsData);

            DB::table('payments')->insert([
                'order_id' => $orderId,
                'payment_method' => $request->payment_method,
                'payment_status' => 'Paid',
                'amount' => $total,
                'paid_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::commit();

            return redirect()->back()->with('success', "Pesanan #{$orderCode} berhasil dibuat dan diteruskan ke dapur!");
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function submitRating(Request $request, $orderId)
    {
        $user = Auth::user();
        if (!$user) {
            return redirect()->route('login');
        }

        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'nullable|string',
        ]);

        $order = DB::table('orders')->where('id', $orderId)->first();
        if (!$order) {
            return redirect()->back()->with('error', 'Pesanan tidak ditemukan.');
        }

        DB::table('order_ratings')->updateOrInsert(
            [
                'order_id' => $orderId,
                'user_id' => $user->id,
            ],
            [
                'rating' => $request->rating,
                'review' => $request->review,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        return redirect()->back()->with('success', 'Terima kasih atas ulasan dan rating bintang 5 Anda!');
    }

    public function sendMessage(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return redirect()->route('login');
        }

        $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        // Customer message
        DB::table('chat_messages')->insert([
            'user_id' => $user->id,
            'sender_type' => 'customer',
            'message' => $request->message,
            'is_read' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Automated smart concierge response
        $reply = "Terima kasih telah menghubungi Konsierge NUSARA! Pesan Anda: \"{$request->message}\" telah kami sampaikan ke tim kasir & kapten restoran. Kami siap melayani pesanan Anda dengan sepenuh hati.";

        DB::table('chat_messages')->insert([
            'user_id' => $user->id,
            'sender_type' => 'admin',
            'message' => $reply,
            'is_read' => true,
            'created_at' => now()->addSeconds(1),
            'updated_at' => now()->addSeconds(1),
        ]);

        return redirect()->back()->with('success', 'Pesan terkirim ke admin concierge!');
    }

    public function toggleFavorite(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return redirect()->route('login');
        }

        $request->validate([
            'menu_id' => 'required|integer',
        ]);

        $exists = DB::table('favorites')
            ->where('user_id', $user->id)
            ->where('menu_id', $request->menu_id)
            ->first();

        if ($exists) {
            DB::table('favorites')
                ->where('user_id', $user->id)
                ->where('menu_id', $request->menu_id)
                ->delete();
            $isFavorited = false;
            $msg = 'Menu dihapus dari daftar favorit.';
        } else {
            DB::table('favorites')->insert([
                'user_id' => $user->id,
                'menu_id' => $request->menu_id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $isFavorited = true;
            $msg = 'Menu berhasil disimpan ke favorit!';
        }

        return redirect()->back()->with('success', $msg);
    }
}
