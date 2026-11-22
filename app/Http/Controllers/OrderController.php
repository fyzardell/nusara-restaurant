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
        $customer = $user ? DB::table('customers')->where('user_id', $user->id)->first() : null;

        // 1. Categories
        $categories = DB::table('categories')
            ->where('is_active', true)
            ->orderByRaw("FIELD(slug, 'hidangan-pembuka', 'hidangan-utama', 'hidangan-penutup', 'minuman', 'khas-aceh', 'khas-sunda', 'khas-jawa')")
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
                    'rawon-iga-sapi-bakar-kluwek-hitam-jawa',
                    'cendol-nangka-gelato-madu-hutan',
                    'es-bir-pletok-keraton-royale',
                    'sop-buntut-bakar-rempah-pala',
                    'iga-sapi-bakar-madu-hutan-sumbawa',
                    'mie-aceh-wagyu-kepiting-soka',
                    'nasi-liwet-kastrol-parahyangan-gurih',
                    'gudeg-yu-djogja-keraton-krecek'
                ]);
                return $menu;
            });

        // 3. User Favorites (Hanya untuk member terdaftar)
        $favorites = [];
        if ($user) {
            $favorites = DB::table('favorites')
                ->where('user_id', $user->id)
                ->pluck('menu_id')
                ->toArray();
        }

        // 4. Deteksi QR Meja otomatis dari query param (misal: ?table=3 atau ?table=03 atau ?table=Meja 03)
        $rawTable = $request->query('table');
        $initialTable = null;
        if ($rawTable) {
            if (is_numeric($rawTable)) {
                $initialTable = 'Meja ' . sprintf('%02d', (int)$rawTable);
            } else {
                $clean = trim($rawTable);
                if (preg_match('/(\d+)/', $clean, $matches)) {
                    $initialTable = 'Meja ' . sprintf('%02d', (int)$matches[1]);
                } else {
                    $initialTable = $clean;
                }
            }
        }

        // 5. Order History
        $ordersQuery = DB::table('orders')->orderBy('id', 'desc');

        if ($user && $customer) {
            $ordersQuery->where('customer_id', $customer->id);
        } else {
            // Tamu meja hanya bisa melihat pesanan sesi saat ini atau pesanan aktif meja ini
            $guestOrderIds = session('guest_order_ids', []);
            if (!empty($guestOrderIds)) {
                $ordersQuery->whereIn('id', $guestOrderIds);
            } elseif ($initialTable) {
                $ordersQuery->where('table_number', $initialTable)
                    ->whereIn('order_status', ['Pending', 'Preparing', 'Ready', 'Served']);
            } else {
                $ordersQuery->whereRaw('1 = 0');
            }
        }

        $orders = $ordersQuery->get()->map(function ($order) {
            $order->items = DB::table('order_items')
                ->where('order_id', $order->id)
                ->get();
            $order->payment = DB::table('payments')
                ->where('order_id', $order->id)
                ->first();
            $order->transaction = $order->payment ? DB::table('payment_transactions')
                ->where('payment_id', $order->payment->id)
                ->first() : null;
            $order->rating = DB::table('order_ratings')
                ->where('order_id', $order->id)
                ->first();
            return $order;
        });

        // 5. Chat History
        $chatMessages = [];
        if ($user) {
            $chatMessages = DB::table('chat_messages')
                ->where('user_id', $user->id)
                ->orderBy('id', 'asc')
                ->get();
        }

        // 6. 10 Meja Dine-in (Kapasitas masing-masing 5 orang)
        $tables = DB::table('restaurant_tables')
            ->where('is_active', true)
            ->orderBy('id', 'asc')
            ->get();

        $settings = DB::table('restaurant_settings')->first();

        $rawType = $request->query('type');
        $initialType = ($rawType === 'takeaway') ? 'takeaway' : 'dine_in';
        $initialMenuId = $request->query('menu_id') ? (int)$request->query('menu_id') : null;

        return Inertia::render('Customer/OrderApp', [
            'categories' => $categories,
            'menus' => $menus,
            'favorites' => $favorites,
            'orders' => $orders,
            'chatMessages' => $chatMessages,
            'tables' => $tables,
            'settings' => $settings,
            'customer' => $customer,
            'initialTable' => $initialTable,
            'initialType' => $initialType,
            'initialMenuId' => $initialMenuId,
            'isGuest' => !$user,
        ]);
    }

    public function checkout(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'order_type' => 'required|in:dine_in,takeaway',
            'table_number' => 'nullable|string',
            'customer_name' => 'required|string|max:100',
            'customer_notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.menu_id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.item_notes' => 'nullable|string',
            'payment_method' => 'required|in:qris,bank_transfer,cash',
        ]);

        // Proteksi Takeaway: Wajib Login
        if ($request->order_type === 'takeaway' && !$user) {
            return redirect()->route('login')->with('error', 'Pesanan Bawa Pulang (Takeaway) mewajibkan Anda masuk ke Akun Customer agar staf kami dapat menghubungi Anda saat pesanan siap diambil.');
        }

        // Proteksi Dine In: Wajib pilih / input nomor meja
        if ($request->order_type === 'dine_in' && !$request->table_number) {
            return redirect()->back()->with('error', 'Silakan pilih atau ketik nomor meja yang sedang Anda tempati.');
        }

        $customerName = trim($request->customer_name);
        $customerId = null;

        if ($user) {
            $customer = DB::table('customers')->where('user_id', $user->id)->first();
            if (!$customer) {
                $customerId = DB::table('customers')->insertGetId([
                    'user_id' => $user->id,
                    'name' => $customerName ?: $user->name,
                    'phone_normalized' => '+62812' . rand(1000000, 9999999),
                    'email' => $user->email,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                $customerId = $customer->id;
                if ($customerName && $customerName !== $customer->name) {
                    DB::table('customers')->where('id', $customer->id)->update([
                        'name' => $customerName,
                        'updated_at' => now(),
                    ]);
                }
            }
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
            $finalTableNumber = $request->table_number ? trim($request->table_number) : null;
            if ($request->order_type === 'dine_in' && $finalTableNumber) {
                $table = DB::table('restaurant_tables')->where('table_number', $finalTableNumber)->first();
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
                'customer_name' => $customerName,
                'table_session_id' => $tableSessionId,
                'table_number' => $finalTableNumber,
                'order_type' => $request->order_type,
                'order_status' => 'Pending',
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

            $paymentStatus = 'Pending';

            $paymentId = DB::table('payments')->insertGetId([
                'order_id' => $orderId,
                'payment_method' => $request->payment_method,
                'payment_status' => $paymentStatus,
                'amount' => $total,
                'paid_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $snapToken = null;
            if (in_array($request->payment_method, ['qris', 'bank_transfer'])) {
                try {
                    $midtrans = app(\App\Services\MidtransService::class);
                    $snapToken = $midtrans->createSnapToken(
                        orderCode: $orderCode,
                        grossAmount: (int) $total,
                        items: $itemsData,
                        taxAmount: (int) $tax,
                        customerName: $customerName,
                        customerEmail: $user?->email,
                        customerPhone: null,
                        paymentMethod: $request->payment_method
                    );

                    DB::table('payment_transactions')->insert([
                        'payment_id' => $paymentId,
                        'provider' => 'midtrans',
                        'provider_transaction_id' => null,
                        'transaction_status' => 'pending',
                        'payment_url' => $snapToken,
                        'expires_at' => now()->addHours(24),
                        'response_data' => json_encode(['snap_token' => $snapToken]),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } catch (\Exception $midtransEx) {
                    \Illuminate\Support\Facades\Log::error('Midtrans Snap Error: ' . $midtransEx->getMessage());
                }
            }

            DB::commit();

            // Simpan ke session untuk tracking tamu meja
            if (!$user) {
                $guestOrderIds = session('guest_order_ids', []);
                $guestOrderIds[] = $orderId;
                session(['guest_order_ids' => $guestOrderIds]);
            }

            if ($request->expectsJson() || $request->isJson() || $request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'order_code' => $orderCode,
                    'order_id' => $orderId,
                    'snap_token' => $snapToken,
                    'payment_method' => $request->payment_method,
                    'total' => $total,
                    'message' => "Pesanan #{$orderCode} berhasil dibuat!",
                ]);
            }

            return redirect()->back()->with('success', "Pesanan #{$orderCode} untuk {$customerName} ({$finalTableNumber}) berhasil dibuat dan diteruskan ke dapur!");
        } catch (\Exception $e) {
            DB::rollBack();
            if ($request->expectsJson() || $request->isJson() || $request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                ], 422);
            }
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function handleWebhook(Request $request, \App\Services\MidtransService $midtransService)
    {
        try {
            $result = $midtransService->processNotification($request->all());
            return response()->json($result);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Midtrans Webhook Error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 400);
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

        $roleName = DB::table('roles')->where('id', $user->role_id)->value('name') ?? 'customer';

        // Message record
        DB::table('chat_messages')->insert([
            'user_id' => $user->id,
            'sender_type' => $roleName,
            'message' => $request->message,
            'is_read' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Automated response only for customer orders if first contact
        if ($roleName === 'customer') {
            $hasReplied = DB::table('chat_messages')
                ->where('user_id', $user->id)
                ->where('sender_type', 'admin')
                ->exists();

            if (!$hasReplied) {
                $reply = "Terima kasih telah menghubungi Konsierge NUSARA! Pesan Anda: \"{$request->message}\" telah kami terima dan diteruskan ke Admin & Tim Restoran. Kami siap melayani Anda.";
                DB::table('chat_messages')->insert([
                    'user_id' => $user->id,
                    'sender_type' => 'admin',
                    'message' => $reply,
                    'is_read' => false,
                    'created_at' => now()->addSeconds(1),
                    'updated_at' => now()->addSeconds(1),
                ]);
            }
        }

        return redirect()->back()->with('success', 'Pesan berhasil terkirim ke Admin.');
    }

    public function markAsRead()
    {
        $user = Auth::user();
        if ($user) {
            DB::table('chat_messages')
                ->where('user_id', $user->id)
                ->where('sender_type', 'admin')
                ->where('is_read', false)
                ->update(['is_read' => true]);
        }

        return response()->json(['success' => true]);
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
