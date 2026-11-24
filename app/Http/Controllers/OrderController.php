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

        $todayWib = now('Asia/Jakarta')->toDateString();

        // 4.1 Validasi Ketersediaan Meja jika dipindai via QR (Tamu maupun Member)
        $tableAvailabilityError = null;
        if ($initialTable) {
            $scannedTable = DB::table('restaurant_tables')->where('table_number', $initialTable)->first();
            
            // Cek apakah tamu/member saat ini memiliki pesanan aktif di meja ini hari ini
            $hasMyActiveOrderOnTable = false;
            if ($user && $customer) {
                $hasMyActiveOrderOnTable = DB::table('orders')
                    ->where('table_number', $initialTable)
                    ->where('customer_id', $customer->id)
                    ->whereDate('created_at', $todayWib)
                    ->whereNotIn('order_status', ['Completed', 'Cancelled'])
                    ->exists();
            }
            $guestOrderIds = session('guest_order_ids', []);
            if (!$hasMyActiveOrderOnTable && !empty($guestOrderIds)) {
                $hasMyActiveOrderOnTable = DB::table('orders')
                    ->where('table_number', $initialTable)
                    ->whereIn('id', $guestOrderIds)
                    ->whereDate('created_at', $todayWib)
                    ->whereNotIn('order_status', ['Completed', 'Cancelled'])
                    ->exists();
            }

            if (!$hasMyActiveOrderOnTable) {
                if (!$scannedTable) {
                    $tableAvailabilityError = [
                        'table_number' => $initialTable,
                        'status' => 'not_found',
                        'title' => 'Meja Tidak Terdaftar',
                        'message' => "Nomor meja {$initialTable} tidak ditemukan di sistem perjamuan NUSARA.",
                        'can_choose_other' => true,
                    ];
                    $initialTable = null;
                } elseif (!$scannedTable->is_active || in_array($scannedTable->status, ['Inactive', 'Maintenance'])) {
                    $tableAvailabilityError = [
                        'table_number' => $initialTable,
                        'status' => 'inactive',
                        'title' => 'Meja Tidak Beroperasi',
                        'message' => "Mohon maaf, {$initialTable} saat ini sedang tidak beroperasi untuk perjamuan.",
                        'can_choose_other' => true,
                    ];
                    $initialTable = null;
                } elseif ($scannedTable->status === 'Cleaning') {
                    $tableAvailabilityError = [
                        'table_number' => $initialTable,
                        'status' => 'cleaning',
                        'title' => 'Meja Sedang Dibersihkan',
                        'message' => "Pramusaji kami sedang membersihkan dan menata kembali {$initialTable} agar higienis dan siap menyambut Anda. Silakan pilih meja lain yang tersedia.",
                        'can_choose_other' => true,
                    ];
                    $initialTable = null;
                } elseif ($scannedTable->status === 'Reserved') {
                    $tableAvailabilityError = [
                        'table_number' => $initialTable,
                        'status' => 'reserved',
                        'title' => 'Meja Telah Direservasi',
                        'message' => "Mohon maaf, {$initialTable} telah dipesan terlebih dahulu untuk tamu reservasi perjamuan lain. Silakan pilih meja lain yang tersedia.",
                        'can_choose_other' => true,
                    ];
                    $initialTable = null;
                } elseif ($scannedTable->status === 'Occupied') {
                    $tableAvailabilityError = [
                        'table_number' => $initialTable,
                        'status' => 'occupied',
                        'title' => 'Meja Sedang Digunakan',
                        'message' => "Mohon maaf, {$initialTable} saat ini sedang ditempati oleh tamu lain yang sedang menikmati hidangan. Silakan pilih meja lain yang tersedia.",
                        'can_choose_other' => true,
                    ];
                    $initialTable = null;
                } else {
                    // Cek apakah ada pesanan aktif hari ini di database untuk meja ini
                    $activeOccupantOrder = DB::table('orders')
                        ->where('table_number', $initialTable)
                        ->whereDate('created_at', $todayWib)
                        ->whereIn('order_status', ['Pending', 'Awaiting Payment', 'Paid', 'Confirmed', 'Preparing', 'Ready', 'Served'])
                        ->exists();

                    if ($activeOccupantOrder) {
                        $tableAvailabilityError = [
                            'table_number' => $initialTable,
                            'status' => 'occupied',
                            'title' => 'Meja Sedang Digunakan',
                            'message' => "Mohon maaf, {$initialTable} saat ini sedang digunakan oleh tamu lain. Silakan pilih meja santap lain yang tersedia.",
                            'can_choose_other' => true,
                        ];
                        $initialTable = null;
                    }
                }
            }
        }

        // 5. Order History & Live Tracking
        $ordersQuery = DB::table('orders')->orderBy('id', 'desc');

        $todayWib = now('Asia/Jakarta')->toDateString();

        if ($user && $customer) {
            $ordersQuery->where(function ($q) use ($customer, $initialTable, $todayWib) {
                $q->where('customer_id', $customer->id);
                if ($initialTable) {
                    $q->orWhere(function ($sub) use ($initialTable, $todayWib) {
                        $sub->where('table_number', $initialTable)
                            ->whereDate('created_at', $todayWib);
                    });
                }
            });
        } else {
            // Tamu meja dapat melihat pesanan sesi saat ini atau pesanan aktif meja ini hari ini
            $guestOrderIds = session('guest_order_ids', []);
            $ordersQuery->where(function ($q) use ($guestOrderIds, $initialTable, $todayWib) {
                if (!empty($guestOrderIds)) {
                    $q->whereIn('id', $guestOrderIds);
                }
                if ($initialTable) {
                    $q->orWhere(function ($sub) use ($initialTable, $todayWib) {
                        $sub->where('table_number', $initialTable)
                            ->whereDate('created_at', $todayWib);
                    });
                }
                if (empty($guestOrderIds) && !$initialTable) {
                    $q->whereRaw('1 = 0');
                }
            });
        }

        $todayWib = now('Asia/Jakarta')->toDateString();
        // Antrean pesanan aktif hari ini (Urutan pertama datang pertama dilayani)
        $activeQueueOrderIds = DB::table('orders')
            ->whereIn('order_status', ['Pending', 'Awaiting Payment', 'Paid', 'Confirmed', 'Preparing'])
            ->whereDate('created_at', $todayWib)
            ->orderBy('id', 'asc')
            ->pluck('id')
            ->toArray();
        $totalActiveQueue = count($activeQueueOrderIds);

        $orders = $ordersQuery->get()->map(function ($order) use ($activeQueueOrderIds, $totalActiveQueue) {
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

            // Hitung posisi nomor antrean hari ini
            $pos = array_search($order->id, $activeQueueOrderIds);
            $order->queue_number = ($pos !== false) ? ($pos + 1) : null;
            $order->total_queue = $totalActiveQueue;

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

        // 6. 10 Meja Dine-in dengan Status Real-time & Jadwal (Tersedia, Sedang Makan, Dibooking, Disewa Privat)
        $todayDate = now('Asia/Jakarta')->toDateString();

        // Cari pesanan aktif hari ini per meja
        $activeOrdersByTable = DB::table('orders')
            ->whereNotNull('table_number')
            ->whereIn('order_status', ['Pending', 'Awaiting Payment', 'Paid', 'Confirmed', 'Preparing', 'Ready', 'Served'])
            ->whereDate('created_at', $todayDate)
            ->get()
            ->keyBy('table_number');

        // Cari reservasi aktif hari ini per meja
        $activeReservations = DB::table('reservations')
            ->join('reservation_tables', 'reservations.id', '=', 'reservation_tables.reservation_id')
            ->whereDate('reservations.reservation_datetime', $todayDate)
            ->whereIn('reservations.status', ['Confirmed', 'Pending'])
            ->select('reservations.*', 'reservation_tables.table_id')
            ->get()
            ->keyBy('table_id');

        // 6. 10 Meja Dine-in dengan Status Real-time Berbasis Database Riil
        $rawTables = DB::table('restaurant_tables')
            ->where('is_active', true)
            ->orderBy('id', 'asc')
            ->get();

        $tables = $rawTables->map(function ($table) use ($activeOrdersByTable, $activeReservations) {
            $tableNum = $table->table_number;
            $activeOrder = $activeOrdersByTable->get($tableNum);
            $activeRes = $activeReservations->get($table->id);

            $status = 'available';
            $statusLabel = 'Tersedia';
            $until = null;
            $desc = 'Tersedia • Siap Ditempati';
            $isSelectable = true;

            if (!$table->is_active || in_array($table->status, ['Inactive', 'Maintenance'])) {
                $status = 'inactive';
                $statusLabel = 'Tidak Beroperasi';
                $desc = 'Meja sedang tidak beroperasi';
                $isSelectable = false;
            } elseif ($table->status === 'Cleaning') {
                $status = 'cleaning';
                $statusLabel = 'Sedang Dibersihkan';
                $desc = 'Sedang dibersihkan & disanitasi';
                $isSelectable = false;
            } elseif ($activeOrder || $table->status === 'Occupied') {
                $status = 'occupied';
                $statusLabel = 'Sedang Makan';
                if ($activeOrder) {
                    $until = \Carbon\Carbon::parse($activeOrder->created_at)->addMinutes(90)->setTimezone('Asia/Jakarta')->format('H:i') . ' WIB';
                    $desc = 'Sedang makan s/d ' . $until;
                } else {
                    $desc = 'Sedang digunakan tamu lain';
                }
                $isSelectable = false;
            } elseif ($activeRes || $table->status === 'Reserved') {
                $status = 'reserved';
                $statusLabel = 'Dibooking';
                if ($activeRes) {
                    $duration = $activeRes->duration_minutes ?: 120;
                    $until = \Carbon\Carbon::parse($activeRes->reservation_datetime)->addMinutes($duration)->setTimezone('Asia/Jakarta')->format('H:i') . ' WIB';
                    $desc = 'Dibooking reservasi s/d ' . $until;
                } else {
                    $desc = 'Dibooking reservasi perjamuan';
                }
                $isSelectable = false;
            }

            $table->current_status = $status;
            $table->status_label = $statusLabel;
            $table->occupied_until = ($status === 'occupied') ? $until : null;
            $table->reserved_until = ($status === 'reserved') ? $until : null;
            $table->private_until = ($status === 'private') ? $until : null;
            $table->status_schedule = $until;
            $table->status_description = $desc;
            $table->is_selectable = $isSelectable;

            return $table;
        });

        // 7. Dining Experiences untuk Reservation Modal
        $experiences = DB::table('dining_experiences')
            ->where('is_available', true)
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
            'experiences' => $experiences,
            'settings' => $settings,
            'customer' => $customer,
            'initialTable' => $initialTable,
            'tableAvailabilityError' => $tableAvailabilityError,
            'initialType' => $initialType,
            'initialMenuId' => $initialMenuId,
            'isGuest' => !$user,
            'midtransClientKey' => config('midtrans.client_key') ?: env('MIDTRANS_CLIENT_KEY', 'SB-Mid-client-vRlZ-ZTbkviZQkzo'),
            'midtransIsConfigured' => !empty(config('midtrans.server_key')),
        ]);
    }

    public function checkout(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'order_type' => 'required|in:dine_in,takeaway',
            'table_number' => 'nullable|string',
            'customer_name' => 'required|string|min:2|max:100',
            'customer_notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.menu_id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.item_notes' => 'nullable|string',
            'payment_method' => 'required|in:cash,qris,gopay,shopeepay,dana,ovo,bca_va,mandiri_va,bni_va,bri_va,permata_va,bank_transfer',
        ]);

        // Proteksi Takeaway: Wajib Login
        if ($request->order_type === 'takeaway' && !$user) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan Bawa Pulang (Takeaway) mewajibkan Anda masuk ke Akun Customer agar staf kami dapat menghubungi Anda saat pesanan siap diambil.',
                'requires_login' => true,
            ], 401);
        }

        // Proteksi Dine In: Wajib pilih / input nomor meja
        if ($request->order_type === 'dine_in' && !$request->table_number) {
            return response()->json([
                'success' => false,
                'message' => 'Silakan pilih atau tentukan nomor meja yang sedang Anda tempati.',
            ], 422);
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

        if ($request->order_type === 'dine_in') {
            $checkTableNum = trim($request->table_number);
            $checkTable = DB::table('restaurant_tables')->where('table_number', $checkTableNum)->first();
            if (!$checkTable || !$checkTable->is_active || in_array($checkTable->status, ['Inactive', 'Maintenance'])) {
                return response()->json([
                    'success' => false,
                    'message' => "Meja {$checkTableNum} tidak valid atau sedang tidak beroperasi untuk perjamuan.",
                ], 422);
            }
            if ($checkTable->status === 'Cleaning') {
                return response()->json([
                    'success' => false,
                    'message' => "Meja {$checkTableNum} sedang dibersihkan dan disanitasi oleh pramusaji. Silakan pilih meja santap lain yang tersedia.",
                ], 422);
            }
            if ($checkTable->status === 'Reserved') {
                return response()->json([
                    'success' => false,
                    'message' => "Meja {$checkTableNum} telah direservasi untuk tamu lain. Silakan pilih meja santap lain yang tersedia.",
                ], 422);
            }
            if ($checkTable->status === 'Occupied') {
                $todayDate = now('Asia/Jakarta')->toDateString();
                $isMyTable = false;
                $customerObj = $user ? DB::table('customers')->where('user_id', $user->id)->first() : null;
                if ($user && $customerObj) {
                    $isMyTable = DB::table('orders')
                        ->where('table_number', $checkTableNum)
                        ->where('customer_id', $customerObj->id)
                        ->whereDate('created_at', $todayDate)
                        ->whereNotIn('order_status', ['Completed', 'Cancelled'])
                        ->exists();
                }
                $guestOrderIds = session('guest_order_ids', []);
                if (!$isMyTable && !empty($guestOrderIds)) {
                    $isMyTable = DB::table('orders')
                        ->where('table_number', $checkTableNum)
                        ->whereIn('id', $guestOrderIds)
                        ->whereDate('created_at', $todayDate)
                        ->whereNotIn('order_status', ['Completed', 'Cancelled'])
                        ->exists();
                }

                // Cek apakah ada pesanan aktif milik orang lain di meja ini hari ini
                $hasActiveOrders = DB::table('orders')
                    ->where('table_number', $checkTableNum)
                    ->whereDate('created_at', $todayDate)
                    ->whereNotIn('order_status', ['Completed', 'Cancelled'])
                    ->exists();

                if (!$isMyTable && $hasActiveOrders) {
                    return response()->json([
                        'success' => false,
                        'message' => "Meja {$checkTableNum} sedang digunakan oleh tamu lain. Silakan pilih meja santap lain yang tersedia.",
                    ], 422);
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

                    // Instantly lock and mark table as Occupied so floor plan turns Red
                    DB::table('restaurant_tables')->where('id', $table->id)->update([
                        'status' => 'Occupied',
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
            $midtransError = null;
            if ($request->payment_method !== 'cash') {
                $serverKey = config('midtrans.server_key');
                if (empty($serverKey)) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'Layanan pembayaran online Midtrans belum aktif karena MIDTRANS_SERVER_KEY belum diisi di sistem (.env). Silakan pilih metode pembayaran Kasir (Cash) atau masukkan API key Midtrans Anda.',
                    ], 422);
                }

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
                    DB::rollBack();
                    $midtransError = $midtransEx->getMessage();
                    \Illuminate\Support\Facades\Log::error('Midtrans Snap Error: ' . $midtransError);
                    return response()->json([
                        'success' => false,
                        'message' => 'Gagal membuka sesi pembayaran Midtrans: ' . $midtransError . '. Silakan coba beberapa saat lagi atau pilih metode pembayaran Tunai di Kasir.',
                    ], 422);
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
                    'midtrans_error' => $midtransError,
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

        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'nullable|string',
        ]);

        $order = DB::table('orders')->where('id', $orderId)->first();
        if (!$order) {
            if ($request->expectsJson() || $request->isJson() || $request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pesanan tidak ditemukan.',
                ], 404);
            }
            return redirect()->back()->with('error', 'Pesanan tidak ditemukan.');
        }

        $userId = $user?->id;
        if (!$userId && $order->customer_id) {
            $userId = DB::table('customers')->where('id', $order->customer_id)->value('user_id');
        }
        if (!$userId) {
            $userId = DB::table('users')->orderBy('id', 'asc')->value('id') ?? 1;
        }

        DB::table('order_ratings')->updateOrInsert(
            [
                'order_id' => $orderId,
            ],
            [
                'user_id' => $userId,
                'rating' => $request->rating,
                'review' => $request->review,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        if ($request->expectsJson() || $request->isJson() || $request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Rating & ulasan bintang berhasil dikirim! Terima kasih atas ulasan Anda.',
                'rating' => (int) $request->rating,
            ]);
        }

        return redirect()->back()->with('success', 'Rating & ulasan bintang berhasil dikirim! Terima kasih atas ulasan Anda.');
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

    /**
     * Request refund / cancellation for an Order (Only permitted while status is Pending / in queue / before cooking)
     */
    public function requestRefund(Request $request, $id)
    {
        $request->validate([
            'bank_or_wallet' => 'required|string|max:50',
            'account_number' => 'required|string|max:50',
            'account_holder' => 'required|string|max:100',
            'reason' => 'required|string|max:500',
        ], [
            'bank_or_wallet.required' => 'Pilih bank atau e-wallet tujuan pengembalian dana.',
            'account_number.required' => 'Nomor rekening atau nomor e-wallet wajib diisi.',
            'account_holder.required' => 'Nama pemilik rekening/akun wajib diisi.',
            'reason.required' => 'Mohon sertakan alasan pembatalan & pengajuan refund.',
        ]);

        $order = DB::table('orders')->where('id', $id)->first();
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Pesanan tidak ditemukan.'], 404);
        }

        // Strict PRD verification: Refund is ONLY permitted when order is still in queue / awaiting cashier (order_status == 'Pending')
        if ($order->order_status !== 'Pending') {
            if (in_array($order->order_status, ['Preparing', 'Ready', 'Served', 'Delivered', 'Completed'])) {
                return response()->json([
                    'success' => false,
                    'message' => "Pesanan #{$order->order_code} sudah dalam proses memasak di dapur atau siap saji, sehingga tidak dapat dibatalkan atau direfund sesuai ketentuan restoran."
                ], 422);
            }
            if (in_array($order->order_status, ['Refund Requested', 'Refunded', 'Cancelled'])) {
                return response()->json([
                    'success' => false,
                    'message' => "Pesanan #{$order->order_code} sudah dibatalkan atau dalam proses pengembalian dana sebelumnya."
                ], 422);
            }
            return response()->json([
                'success' => false,
                'message' => "Pengajuan refund hanya dapat dilakukan saat pesanan masih dalam antrian kasir / sebelum diproses dapur."
            ], 422);
        }

        $refundNote = "[Pengajuan Refund Order: {$request->bank_or_wallet} {$request->account_number} a/n {$request->account_holder} - Alasan: {$request->reason}]";
        $updatedNotes = trim(($order->customer_notes ?? '') . "\n" . $refundNote);

        // Update order status to Refund Requested
        DB::table('orders')->where('id', $id)->update([
            'order_status' => 'Refund Requested',
            'customer_notes' => $updatedNotes,
            'updated_at' => now(),
        ]);

        // If table has no other active orders, release table
        if ($order->table_number) {
            $otherActive = DB::table('orders')
                ->where('table_number', $order->table_number)
                ->where('id', '!=', $id)
                ->whereIn('order_status', ['Pending', 'Preparing', 'Ready', 'Delivered'])
                ->exists();
            if (!$otherActive) {
                DB::table('restaurant_tables')->where('table_number', $order->table_number)->update([
                    'status' => 'Available',
                    'updated_at' => now(),
                ]);
            }
        }

        // Record status history
        DB::table('order_status_histories')->insert([
            'order_id' => $id,
            'changed_by' => Auth::id() ?? null,
            'previous_status' => $order->order_status,
            'new_status' => 'Refund Requested',
            'notes' => $refundNote,
            'created_at' => now(),
        ]);

        // Record Audit log
        DB::table('audit_logs')->insert([
            'user_id' => Auth::id() ?? null,
            'action' => 'order.refund_request',
            'entity_type' => 'Order',
            'entity_id' => $id,
            'description' => "Pengajuan refund diajukan pelanggan untuk pesanan {$order->order_code} ({$request->bank_or_wallet} {$request->account_number}).",
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Pengajuan pembatalan & pengembalian dana untuk pesanan #{$order->order_code} berhasil dikirim. Tim Kasir & Administrasi akan memproses pengembalian dana ke {$request->bank_or_wallet} ({$request->account_number}).",
        ]);
    }

    /**
     * Konfirmasi pembayaran online (Midtrans QRIS / Virtual Account) secara instan.
     * Mengubah payment_status menjadi 'Paid' dan langsung menaikkan status pesanan ke 'Preparing' (memasak).
     */
    public function confirmOnlinePayment(Request $request, $orderId)
    {
        $order = DB::table('orders')->where('id', $orderId)->first();
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Pesanan tidak ditemukan.'], 404);
        }

        $payment = DB::table('payments')->where('order_id', $orderId)->first();
        if (!$payment) {
            return response()->json(['success' => false, 'message' => 'Data pembayaran tidak ditemukan.'], 404);
        }

        // Jika sudah lunas sebelumnya
        if ($payment->payment_status === 'Paid') {
            return response()->json([
                'success' => true,
                'payment_status' => 'Paid',
                'order_status' => $order->order_status,
                'message' => 'Pembayaran pesanan ini sudah diverifikasi sebelumnya.',
            ]);
        }

        $isVerified = false;

        // Cek status resmi ke Midtrans jika terkonfigurasi
        $serverKey = config('midtrans.server_key') ?: env('MIDTRANS_SERVER_KEY');
        if (!empty($serverKey)) {
            try {
                \Midtrans\Config::$serverKey = $serverKey;
                \Midtrans\Config::$isProduction = config('midtrans.is_production', false);

                try {
                    $status = \Midtrans\Transaction::status($order->order_code);
                    $trxStatus = $status->transaction_status ?? null;
                    $fraud = $status->fraud_status ?? null;

                    if (in_array($trxStatus, ['capture', 'settlement'])) {
                        if ($trxStatus === 'capture' && $fraud === 'challenge') {
                            $isVerified = false;
                        } else {
                            $isVerified = true;
                        }
                    }
                } catch (\Exception $apiEx) {
                    \Illuminate\Support\Facades\Log::warning("Midtrans Transaction::status notice for {$order->order_code}: " . $apiEx->getMessage());
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Midtrans status check error: " . $e->getMessage());
            }
        }

        // Dukungan callback Snap di frontend (onSuccess mengirimkan status code 200/201 atau status settlement)
        $clientStatus = $request->input('transaction_status') ?? $request->input('status_code');
        $resultStatus = $request->input('result_status');
        if ($isVerified || in_array($clientStatus, ['settlement', 'capture', '200', '201']) || $resultStatus === 'success') {
            $isVerified = true;
        }

        if ($isVerified) {
            DB::table('payments')->where('id', $payment->id)->update([
                'payment_status' => 'Paid',
                'paid_at' => now(),
                'updated_at' => now(),
            ]);

            // Non-cash pembayaran berhasil: langsung masuk ke antrean dapur 'Preparing' (memasak)
            DB::table('orders')->where('id', $order->id)->update([
                'order_status' => 'Preparing',
                'updated_at' => now(),
            ]);

            DB::table('payment_transactions')->where('payment_id', $payment->id)->update([
                'transaction_status' => 'settlement',
                'updated_at' => now(),
            ]);

            // Riwayat status order
            DB::table('order_status_histories')->insert([
                'order_id' => $order->id,
                'changed_by' => Auth::id() ?? null,
                'previous_status' => $order->order_status,
                'new_status' => 'Preparing',
                'notes' => 'Pembayaran online Midtrans terverifikasi. Pesanan langsung diteruskan ke koki dapur untuk dimasak.',
                'created_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'payment_status' => 'Paid',
                'order_status' => 'Preparing',
                'message' => 'Pembayaran Midtrans berhasil diverifikasi! Pesanan Anda langsung masuk ke tahap 2/4 - Sedang Dimasak di Dapur.',
            ]);
        }

        return response()->json([
            'success' => false,
            'payment_status' => $payment->payment_status,
            'order_status' => $order->order_status,
            'message' => 'Pembayaran belum dapat dikonfirmasi oleh Midtrans. Pastikan transaksi QRIS / VA Anda telah selesai.',
        ], 422);
    }
}
