<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Inertia\Inertia;

class ReservationController extends Controller
{
    /**
     * Display the dedicated luxury Reservation Page (Light App Shell 4).
     */
    public function index(Request $request)
    {
        // Enforce Login before accessing reservation page as requested
        if (!Auth::check()) {
            return redirect()->guest(route('login', ['redirect' => '/reservation']));
        }

        $user = Auth::user();

        // Retrieve or create customer profile
        $customer = DB::table('customers')->where('user_id', $user->id)->first();
        if (!$customer) {
            $normalizedPhone = '+62' . rand(81200000000, 81299999999);
            $customerId = DB::table('customers')->insertGetId([
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone_normalized' => $normalizedPhone,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $customer = DB::table('customers')->where('id', $customerId)->first();
        }

        // 10 Restaurant Tables
        $tables = DB::table('restaurant_tables')
            ->where('is_active', true)
            ->orderBy('id')
            ->get();

        // Ensure Buyout Packages exist in Dining Experiences
        $buyoutExperiences = [
            [
                'name' => 'Sewa 1 Resto (50 Orang · 2 Jam)',
                'slug' => 'sewa-resto-50-pax-2-jam',
                'description' => 'Penutupan eksklusif seluruh area restoran Senopati Flagship (10 meja, kapasitas hingga 50 tamu) selama 2 jam. Termasuk pelayanan staf privat penuh, hidangan prasmanan pusaka, dan tata suara audio.',
                'duration_minutes' => 120,
                'price_per_person' => 300000,
                'image_url' => 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
                'is_available' => true,
            ],
            [
                'name' => 'Sewa 1 Resto (50 Orang · 3 Jam)',
                'slug' => 'sewa-resto-50-pax-3-jam',
                'description' => 'Penutupan eksklusif seluruh restoran selama 3 jam untuk perhelatan akbar, gala dinner, atau resepsi intim 50 tamu dengan full course banquet, panggung kehormatan, dan layanan konsierge VIP.',
                'duration_minutes' => 180,
                'price_per_person' => 400000,
                'image_url' => 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80',
                'is_available' => true,
            ],
            [
                'name' => 'Sewa 1 Resto Privat Berdua Saja (Romantic Buyout)',
                'slug' => 'sewa-resto-privat-berdua',
                'description' => 'Kemewahan tertinggi: seluruh restoran NUSARA ditutup khusus hanya untuk Anda berdua. Candlelight dinner dengan ribuan lilin, alunan biola/akustik privat, dan sajian langsung dari Executive Chef.',
                'duration_minutes' => 150,
                'price_per_person' => 3750000,
                'image_url' => 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
                'is_available' => true,
            ]
        ];

        foreach ($buyoutExperiences as $bExp) {
            $exists = DB::table('dining_experiences')->where('slug', $bExp['slug'])->exists();
            if (!$exists) {
                DB::table('dining_experiences')->insert(array_merge($bExp, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }
        }

        // Dining Experiences
        $experiences = DB::table('dining_experiences')
            ->where('is_available', true)
            ->orderBy('id')
            ->get();

        // Operating Hours
        $operatingHours = DB::table('operating_hours')
            ->orderByRaw("CASE WHEN day_of_week = 0 THEN 7 ELSE day_of_week END")
            ->get();

        // Restaurant Settings
        $settings = DB::table('restaurant_settings')->first();
        if ($settings && isset($settings->social_links)) {
            $settings->social_links = json_decode($settings->social_links, true);
        }

        // Active and Future Reservations (for checking table availability per slot)
        $reservations = DB::table('reservations')
            ->join('reservation_tables', 'reservations.id', '=', 'reservation_tables.reservation_id')
            ->whereIn('reservations.status', ['Pending', 'Confirmed'])
            ->whereDate('reservations.reservation_datetime', '>=', now('Asia/Jakarta')->toDateString())
            ->select(
                'reservations.id',
                'reservations.reservation_code',
                'reservations.reservation_datetime',
                'reservations.duration_minutes',
                'reservations.status',
                'reservations.guest_count',
                'reservation_tables.table_id'
            )
            ->get();

        // Current Customer's reservation history
        $customerReservations = DB::table('reservations')
            ->where('customer_id', $customer->id)
            ->leftJoin('dining_experiences', 'reservations.experience_id', '=', 'dining_experiences.id')
            ->select(
                'reservations.*',
                'dining_experiences.name as experience_name'
            )
            ->orderByDesc('reservations.created_at')
            ->get()
            ->map(function ($r) {
                $tables = DB::table('reservation_tables')
                    ->join('restaurant_tables', 'reservation_tables.table_id', '=', 'restaurant_tables.id')
                    ->where('reservation_tables.reservation_id', $r->id)
                    ->pluck('restaurant_tables.table_number')
                    ->toArray();

                $r->table_number = count($tables) > 0 ? implode(', ', $tables) : 'Dipersiapkan Staf';
                return $r;
            });

        // Categories
        $categories = DB::table('categories')
            ->where('is_active', true)
            ->orderByRaw("FIELD(slug, 'hidangan-pembuka', 'hidangan-utama', 'hidangan-penutup', 'minuman', 'khas-aceh', 'khas-sunda', 'khas-jawa')")
            ->get();

        // Restaurant Menus (for optional menu pre-order preview)
        $menus = DB::table('menus')
            ->join('categories', 'menus.category_id', '=', 'categories.id')
            ->leftJoin('menu_images', function ($join) {
                $join->on('menus.id', '=', 'menu_images.menu_id')
                    ->where('menu_images.is_primary', true);
            })
            ->where('menus.is_available', true)
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
                'menus.is_featured',
                'menu_images.image_path'
            )
            ->get();

        // Jakarta Current Time
        $nowJakarta = Carbon::now('Asia/Jakarta');

        return Inertia::render('Customer/Reservation', [
            'auth' => [
                'user' => $user,
            ],
            'customer' => $customer,
            'tables' => $tables,
            'experiences' => $experiences,
            'categories' => $categories,
            'menus' => $menus,
            'operatingHours' => $operatingHours,
            'settings' => $settings,
            'reservations' => $reservations,
            'customerReservations' => $customerReservations,
            'nowJakarta' => [
                'iso' => $nowJakarta->toIso8601String(),
                'date' => $nowJakarta->toDateString(),
                'time' => $nowJakarta->format('H:i'),
                'hour' => (int) $nowJakarta->format('H'),
                'minute' => (int) $nowJakarta->format('i'),
            ],
            'preselectedExperience' => $request->query('exp'),
        ]);
    }

    /**
     * Store new customer reservation with 3-hour WIB rule, dynamic table allocation, and DP validation.
     */
    public function store(Request $request)
    {
        if (!Auth::check()) {
            if ($request->expectsJson() || $request->isJson() || $request->wantsJson()) {
                return response()->json(['success' => false, 'message' => 'Silakan masuk ke akun terlebih dahulu.'], 401);
            }
            return redirect()->guest(route('login', ['redirect' => '/reservation']));
        }

        $request->validate([
            'date' => 'required|date_format:Y-m-d|after_or_equal:today',
            'time' => 'required|date_format:H:i',
            'guest_count' => 'required|integer|min:1|max:50',
            'table_id' => 'nullable|exists:restaurant_tables,id',
            'table_ids' => 'nullable|array',
            'table_ids.*' => 'exists:restaurant_tables,id',
            'experience_id' => 'nullable|exists:dining_experiences,id',
            'special_request' => 'nullable|string|max:500',
            'customer_name' => 'required|string|max:100',
            'customer_phone' => 'required|string|max:25',
            'payment_type' => 'nullable|string|in:full,dp',
            'dp_amount' => 'nullable|numeric|min:0',
            'remaining_balance' => 'nullable|numeric|min:0',
            'dp_payment_method' => 'nullable|string|max:50',
        ], [
            'date.required' => 'Pilih tanggal reservasi terlebih dahulu.',
            'date.after_or_equal' => 'Tanggal reservasi tidak boleh di masa lalu.',
            'time.required' => 'Pilih jam kedatangan reservasi.',
            'guest_count.required' => 'Tentukan jumlah tamu reservasi.',
            'customer_phone.required' => 'Nomor kontak WhatsApp/telepon wajib diisi untuk konfirmasi.',
        ]);

        $nowWib = Carbon::now('Asia/Jakarta');
        $resDateTime = Carbon::createFromFormat('Y-m-d H:i', "{$request->date} {$request->time}", 'Asia/Jakarta');

        // 3-Hour Buffer Rule:
        // Jika reservasi dibuat untuk hari ini, wajib minimal 3 jam sebelumnya
        if ($resDateTime->isToday()) {
            $diffMinutes = $nowWib->diffInMinutes($resDateTime, false);
            if ($diffMinutes < 180) { // kurang dari 3 jam (180 menit)
                if ($request->expectsJson() || $request->isJson() || $request->wantsJson()) {
                    return response()->json(['success' => false, 'message' => 'Reservasi hari ini wajib dilakukan minimal 3 jam sebelumnya (WIB) untuk persiapan jamuan istimewa Anda.'], 422);
                }
                return back()->withErrors([
                    'time' => 'Reservasi hari ini wajib dilakukan minimal 3 jam sebelumnya (WIB) untuk persiapan jamuan istimewa Anda.'
                ])->withInput();
            }
        } elseif ($resDateTime->isPast()) {
            if ($request->expectsJson() || $request->isJson() || $request->wantsJson()) {
                return response()->json(['success' => false, 'message' => 'Waktu reservasi yang dipilih sudah lewat.'], 422);
            }
            return back()->withErrors([
                'date' => 'Waktu reservasi yang dipilih sudah lewat.'
            ])->withInput();
        }

        // Resolusi Meja yang dipilih:
        $selectedTableIds = [];
        if ($request->has('table_ids') && is_array($request->table_ids) && count($request->table_ids) > 0) {
            $selectedTableIds = array_map('intval', $request->table_ids);
        } elseif ($request->filled('table_id')) {
            $selectedTableIds = [intval($request->table_id)];
        }

        // Ketentuan: Maksimal 1 meja = 5 orang.
        // Jika 6 s/d 10 orang -> minimal 2 meja wajib dipilih.
        // Jika > 10 orang (Paket Sewa 1 Resto) -> otomatis alokasikan seluruh 10 meja jika belum dipilih
        if ($request->guest_count > 10) {
            if (empty($selectedTableIds)) {
                $selectedTableIds = DB::table('restaurant_tables')->where('is_active', true)->pluck('id')->toArray();
            }
        } elseif ($request->guest_count > 5) {
            if (count($selectedTableIds) < 2) {
                if ($request->expectsJson() || $request->isJson() || $request->wantsJson()) {
                    return response()->json(['success' => false, 'message' => 'Kapasitas maksimal 1 meja adalah 5 orang. Untuk ' . $request->guest_count . ' tamu, Anda wajib memilih minimal 2 meja.'], 422);
                }
                return back()->withErrors([
                    'table_ids' => 'Kapasitas maksimal 1 meja adalah 5 orang. Untuk ' . $request->guest_count . ' tamu, Anda wajib memilih minimal 2 meja.'
                ])->withInput();
            }
        } else {
            if (count($selectedTableIds) < 1) {
                if ($request->expectsJson() || $request->isJson() || $request->wantsJson()) {
                    return response()->json(['success' => false, 'message' => 'Silakan pilih meja yang tersedia.'], 422);
                }
                return back()->withErrors([
                    'table_id' => 'Silakan pilih meja yang tersedia.'
                ])->withInput();
            }
        }

        // Experience Duration
        $durationMinutes = 120;
        if ($request->filled('experience_id')) {
            $exp = DB::table('dining_experiences')->where('id', $request->experience_id)->first();
            if ($exp && $exp->duration_minutes) {
                $durationMinutes = $exp->duration_minutes;
            }
        }

        // Table Collision Detection (± durasi makan)
        $startWindow = $resDateTime->copy()->subMinutes($durationMinutes - 15);
        $endWindow = $resDateTime->copy()->addMinutes($durationMinutes - 15);

        foreach ($selectedTableIds as $tId) {
            $conflict = DB::table('reservations')
                ->join('reservation_tables', 'reservations.id', '=', 'reservation_tables.reservation_id')
                ->where('reservation_tables.table_id', $tId)
                ->whereIn('reservations.status', ['Pending', 'Confirmed'])
                ->whereBetween('reservations.reservation_datetime', [$startWindow, $endWindow])
                ->exists();

            if ($conflict) {
                $tableName = DB::table('restaurant_tables')->where('id', $tId)->value('table_number') ?? "Meja #{$tId}";
                if ($request->expectsJson() || $request->isJson() || $request->wantsJson()) {
                    return response()->json(['success' => false, 'message' => "{$tableName} sudah terpesan oleh tamu lain pada rentang jam tersebut. Silakan pilih meja lain atau sesuaikan jam kedatangan."], 422);
                }
                return back()->withErrors([
                    'table_id' => "{$tableName} sudah terpesan oleh tamu lain pada rentang jam tersebut. Silakan pilih meja lain atau sesuaikan jam kedatangan."
                ])->withInput();
            }
        }

        // Resolve customer
        $user = Auth::user();
        $customer = DB::table('customers')->where('user_id', $user->id)->first();
        if (!$customer) {
            $customerId = DB::table('customers')->insertGetId([
                'user_id' => $user->id,
                'name' => $request->customer_name,
                'email' => $user->email,
                'phone_normalized' => $request->customer_phone,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $customerId = $customer->id;
            DB::table('customers')->where('id', $customerId)->update([
                'name' => $request->customer_name,
                'phone_normalized' => $request->customer_phone,
                'updated_at' => now(),
            ]);
        }

        $code = 'RSV-' . strtoupper(Str::random(6));

        // Format Special Request dengan info Pembayaran (LUNAS 100% atau DP)
        $paymentType = $request->input('payment_type', 'full');
        $specialRequest = $request->special_request ?? '';
        if ($request->filled('dp_amount') && floatval($request->dp_amount) > 0) {
            $payFmt = number_format(floatval($request->dp_amount), 0, ',', '.');
            $method = strtoupper($request->dp_payment_method ?? 'QRIS');
            if ($paymentType === 'full') {
                $specialRequest = "[Pembayaran: LUNAS 100% Rp {$payFmt} via {$method} - Bebas Tagihan] " . $specialRequest;
            } else {
                $rem = floatval($request->input('remaining_balance', 0));
                $remFmt = number_format($rem, 0, ',', '.');
                $specialRequest = "[Pembayaran: DP Jaminan Meja Rp {$payFmt} (Sisa Kasir: Rp {$remFmt}) via {$method}] " . $specialRequest;
            }
        }

        $reservationId = DB::table('reservations')->insertGetId([
            'reservation_code' => $code,
            'customer_id' => $customerId,
            'experience_id' => $request->experience_id ?: null,
            'reservation_datetime' => $resDateTime->format('Y-m-d H:i:s'),
            'guest_count' => $request->guest_count,
            'duration_minutes' => $durationMinutes,
            'status' => 'Pending',
            'special_request' => $specialRequest,
            'source' => 'website',
            'created_by' => $user->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Attach all selected tables to pivot table
        foreach ($selectedTableIds as $tId) {
            DB::table('reservation_tables')->insert([
                'reservation_id' => $reservationId,
                'table_id' => $tId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Generate Midtrans Snap Token for Reservation (Lunas 100% atau DP)
        $snapToken = null;
        $midtransError = null;
        if ($request->filled('dp_amount') && floatval($request->dp_amount) > 0) {
            try {
                $midtrans = app(\App\Services\MidtransService::class);
                $dpVal = (int) round(floatval($request->dp_amount));
                $isFullPay = ($paymentType === 'full');
                $itemLabel = ($isFullPay ? "Pelunasan Reservasi 100%" : "DP Reservasi") . " {$code} ({$request->guest_count} Tamu)";
                $snapToken = $midtrans->createSnapToken(
                    orderCode: $code,
                    grossAmount: $dpVal,
                    items: [
                        [
                            'menu_id' => ($isFullPay ? 'FULL-' : 'DP-') . $code,
                            'unit_price_snapshot' => $dpVal,
                            'quantity' => 1,
                            'menu_name_snapshot' => $itemLabel,
                        ]
                    ],
                    taxAmount: 0,
                    customerName: $request->customer_name,
                    customerEmail: $user?->email,
                    customerPhone: $request->customer_phone,
                    paymentMethod: $request->dp_payment_method ?? 'all'
                );
            } catch (\Exception $ex) {
                $midtransError = $ex->getMessage();
                \Illuminate\Support\Facades\Log::error("Midtrans Snap Reservation Error: " . $ex->getMessage());
            }
        }

        // Audit Log
        DB::table('audit_logs')->insert([
            'user_id' => $user->id,
            'action' => 'reservation.create',
            'entity_type' => 'Reservation',
            'entity_id' => $reservationId,
            'description' => "Reservasi online dibuat dengan kode {$code} untuk {$request->guest_count} tamu pada {$request->date} {$request->time} WIB (DP Non-Tunai).",
            'created_at' => now(),
        ]);

        $tableNames = DB::table('restaurant_tables')
            ->whereIn('id', $selectedTableIds)
            ->pluck('table_number')
            ->implode(', ');

        if ($request->expectsJson() || $request->isJson() || $request->wantsJson()) {
            return response()->json([
                'success' => true,
                'reservation_id' => $reservationId,
                'reservation_code' => $code,
                'snap_token' => $snapToken,
                'midtrans_error' => $midtransError,
                'table_names' => $tableNames,
                'message' => "Reservasi {$code} ({$tableNames}) berhasil diajukan!",
            ]);
        }

        session()->flash('success', "Reservasi {$code} ({$tableNames}) berhasil diajukan! Meja Anda otomatis terkonfirmasi setelah DP diverifikasi. Meja disiapkan 1 jam sebelum jadwal kunjungan.");

        return redirect()->route('reservation');
    }

    /**
     * Generate Midtrans Snap token for an existing pending reservation DP
     */
    public function getPayToken(Request $request, $id)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Silakan masuk ke akun terlebih dahulu.'
            ], 401);
        }

        $customer = DB::table('customers')->where('user_id', $user->id)->first();
        $customerId = $customer ? $customer->id : -1;

        $reservation = DB::table('reservations')
            ->where('id', $id)
            ->where(function ($q) use ($user, $customerId) {
                $q->where('created_by', $user->id)
                  ->orWhere('customer_id', $customerId);
            })
            ->first();

        if (!$reservation) {
            return response()->json([
                'success' => false,
                'message' => 'Reservasi tidak ditemukan atau tidak memiliki akses.'
            ], 404);
        }

        if ($reservation->status !== 'Pending') {
            return response()->json([
                'success' => false,
                'message' => 'Reservasi ini telah berstatus ' . $reservation->status . ' dan tidak memerlukan pembayaran DP lagi.'
            ], 400);
        }

        // Ekstrak nominal dari special_request atau default 150000
        $dpVal = 150000;
        $isFullPay = str_contains($reservation->special_request ?? '', 'LUNAS 100%');
        if (preg_match('/\[Pembayaran:\s*(?:LUNAS 100%|DP Jaminan Meja)\s*Rp\s*([0-9\.]+)/i', $reservation->special_request ?? '', $matches)) {
            $cleaned = str_replace('.', '', $matches[1]);
            if (is_numeric($cleaned) && intval($cleaned) > 0) {
                $dpVal = intval($cleaned);
            }
        } elseif (preg_match('/\[DP Jaminan Meja: Rp\s*([0-9\.]+)/i', $reservation->special_request ?? '', $matches)) {
            $cleaned = str_replace('.', '', $matches[1]);
            if (is_numeric($cleaned) && intval($cleaned) > 0) {
                $dpVal = intval($cleaned);
            }
        }

        // Ambil metode pembayaran jika ada
        $paymentMethod = 'all';
        if ($request->filled('dp_payment_method')) {
            $paymentMethod = $request->dp_payment_method;
        } elseif (preg_match('/via ([A-Z0-9_\-]+)\]/i', $reservation->special_request ?? '', $pMatches)) {
            $paymentMethod = strtolower($pMatches[1]);
        }

        try {
            $midtrans = app(\App\Services\MidtransService::class);
            $customerName = $customer ? $customer->name : ($user->name ?? 'Tamu NUSARA');
            $customerPhone = $customer ? $customer->phone_normalized : ($user->phone ?? null);

            // Gunakan suffix timestamp unik agar Midtrans tidak menolak token ulang (duplicate order_id)
            $orderCode = $reservation->reservation_code . '-' . time();
            $itemLabel = ($isFullPay ? "Pelunasan Reservasi 100%" : "DP Reservasi") . " {$reservation->reservation_code} ({$reservation->guest_count} Tamu)";

            $snapToken = $midtrans->createSnapToken(
                orderCode: $orderCode,
                grossAmount: $dpVal,
                items: [
                    [
                        'menu_id' => ($isFullPay ? 'FULL-' : 'DP-') . $reservation->reservation_code,
                        'unit_price_snapshot' => $dpVal,
                        'quantity' => 1,
                        'menu_name_snapshot' => $itemLabel,
                    ]
                ],
                taxAmount: 0,
                customerName: $customerName,
                customerEmail: $user->email,
                customerPhone: $customerPhone,
                paymentMethod: $paymentMethod
            );

            return response()->json([
                'success' => true,
                'snap_token' => $snapToken,
                'reservation_code' => $reservation->reservation_code,
                'dp_amount' => $dpVal,
                'message' => 'Token pembayaran berhasil dibuat.',
            ]);
        } catch (\Exception $ex) {
            \Illuminate\Support\Facades\Log::error("Midtrans Snap Retry Error: " . $ex->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghubungkan ke Midtrans: ' . $ex->getMessage(),
            ], 500);
        }
    }

    /**
     * Request refund / cancellation for a paid DP reservation.
     */
    public function requestRefund(Request $request, $id)
    {
        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'message' => 'Silakan masuk ke akun terlebih dahulu.'
            ], 401);
        }

        $request->validate([
            'bank_or_wallet' => 'required|string|max:50',
            'account_number' => 'required|string|max:50',
            'account_holder' => 'required|string|max:100',
            'reason' => 'required|string|max:500',
        ], [
            'bank_or_wallet.required' => 'Pilih bank atau e-wallet tujuan pengembalian dana.',
            'account_number.required' => 'Nomor rekening atau nomor e-wallet tujuan wajib diisi.',
            'account_holder.required' => 'Nama pemilik rekening/akun wajib diisi.',
            'reason.required' => 'Mohon sertakan alasan pembatalan & pengajuan refund.',
        ]);

        $user = Auth::user();
        $customer = DB::table('customers')->where('user_id', $user->id)->first();

        $reservation = DB::table('reservations')->where('id', $id)->first();
        if (!$reservation) {
            return response()->json([
                'success' => false,
                'message' => 'Data reservasi tidak ditemukan.'
            ], 404);
        }

        // Check ownership
        $isOwner = false;
        if ($customer && $reservation->customer_id == $customer->id) {
            $isOwner = true;
        } elseif ($reservation->created_by == $user->id) {
            $isOwner = true;
        }

        if (!$isOwner) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki hak otorisasi untuk mengajukan refund pada reservasi ini.'
            ], 403);
        }

        if (in_array($reservation->status, ['Refund Requested', 'Refunded', 'Cancelled', 'Rejected'])) {
            return response()->json([
                'success' => false,
                'message' => 'Reservasi ini telah dibatalkan atau sudah dalam proses pengembalian dana sebelumnya.'
            ], 422);
        }

        $refundNote = "[Pengajuan Refund DP: {$request->bank_or_wallet} {$request->account_number} a/n {$request->account_holder} - Alasan: {$request->reason}]";
        $updatedSpecialRequest = trim(($reservation->special_request ?? '') . "\n" . $refundNote);

        // Update reservation status to Refund Requested
        DB::table('reservations')->where('id', $id)->update([
            'status' => 'Refund Requested',
            'special_request' => $updatedSpecialRequest,
            'updated_at' => now(),
        ]);

        // Record status change in reservation_status_histories
        DB::table('reservation_status_histories')->insert([
            'reservation_id' => $id,
            'changed_by' => $user->id,
            'previous_status' => $reservation->status,
            'new_status' => 'Refund Requested',
            'notes' => $refundNote,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Record in audit_logs
        DB::table('audit_logs')->insert([
            'user_id' => $user->id,
            'action' => 'reservation.refund_request',
            'entity_type' => 'Reservation',
            'entity_id' => $id,
            'description' => "Pengajuan refund diajukan oleh tamu untuk reservasi {$reservation->reservation_code} ({$request->bank_or_wallet} {$request->account_number}).",
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Pengajuan pengembalian dana (refund) untuk reservasi #{$reservation->reservation_code} berhasil diajukan. Tim Konsierge & Keuangan NUSARA akan memverifikasi dan mentransfer ke {$request->bank_or_wallet} {$request->account_number} (1x24 jam kerja).",
        ]);
    }

    /**
     * Konfirmasi pembayaran online secara instan saat Midtrans Snap menyelesaikan transaksi (onSuccess).
     */
    public function confirmOnlinePayment(Request $request, $id)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Silakan masuk ke akun terlebih dahulu.'], 401);
        }

        $customer = DB::table('customers')->where('user_id', $user->id)->first();
        $customerId = $customer ? $customer->id : -1;

        $reservation = DB::table('reservations')
            ->where('id', $id)
            ->where(function ($q) use ($user, $customerId) {
                $q->where('created_by', $user->id)
                  ->orWhere('customer_id', $customerId);
            })
            ->first();

        if (!$reservation) {
            return response()->json(['success' => false, 'message' => 'Reservasi tidak ditemukan.'], 404);
        }

        $paymentType = $request->input('payment_type', 'qris');
        $isBalancePayment = $request->boolean('is_balance', false);
        $grossAmount = floatval($request->input('gross_amount', 0));
        $isFull = str_contains($reservation->special_request ?? '', 'LUNAS 100%') || $isBalancePayment;

        if ($grossAmount <= 0) {
            if ($isBalancePayment && preg_match('/\(Sisa Kasir:\s*Rp\s*([0-9\.]+)\)/i', $reservation->special_request ?? '', $remMatches)) {
                $grossAmount = floatval(str_replace('.', '', $remMatches[1]));
            } elseif (preg_match('/\[Pembayaran:\s*(?:LUNAS 100%|DP Jaminan Meja)\s*Rp\s*([0-9\.]+)/i', $reservation->special_request ?? '', $m)) {
                $grossAmount = floatval(str_replace('.', '', $m[1]));
            }
        }

        $amtFmt = number_format($grossAmount, 0, ',', '.');
        $existingNotes = $reservation->special_request ?? '';

        if ($isBalancePayment) {
            // Sisa tagihan telah dilunasi
            $noteTag = "[LUNAS 100% SISA TERBAYAR MIDTRANS Rp {$amtFmt} ({$paymentType}) - BEBAS TAGIHAN RESTO] ";
            // Hilangkan tulisan sisa kasir
            $cleaned = preg_replace('/\(Sisa Kasir:\s*Rp\s*[0-9\.]+\)/i', '(Sisa Kasir: LUNAS Rp 0)', $existingNotes);
            $updatedNotes = $noteTag . $cleaned;
        } else {
            $noteTag = $isFull
                ? "[LUNAS 100% TERBAYAR MIDTRANS Rp {$amtFmt} ({$paymentType}) - BEBAS TAGIHAN RESTO] "
                : "[DP TERBAYAR MIDTRANS Rp {$amtFmt} ({$paymentType}) - VALIDASI SUKSES] ";
            $updatedNotes = $noteTag . $existingNotes;
        }

        DB::table('reservations')->where('id', $id)->update([
            'status' => 'Confirmed',
            'special_request' => $updatedNotes,
            'updated_at' => now(),
        ]);

        // Kunci meja menjadi Reserved
        $resTableIds = DB::table('reservation_tables')->where('reservation_id', $id)->pluck('table_id')->toArray();
        if (!empty($resTableIds)) {
            DB::table('restaurant_tables')->whereIn('id', $resTableIds)->where('status', 'Available')->update([
                'status' => 'Reserved',
                'updated_at' => now(),
            ]);
        }

        DB::table('reservation_status_histories')->insert([
            'reservation_id' => $id,
            'changed_by' => $user->id,
            'previous_status' => $reservation->status,
            'new_status' => 'Confirmed',
            'notes' => "Pembayaran online terverifikasi instan via Snap ({$paymentType})",
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('audit_logs')->insert([
            'user_id' => $user->id,
            'action' => 'reservation.confirm_online',
            'entity_type' => 'Reservation',
            'entity_id' => $id,
            'description' => "Pembayaran online reservasi #{$reservation->reservation_code} terverifikasi via Midtrans Snap. Status menjadi Confirmed.",
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'status' => 'Confirmed',
            'special_request' => $updatedNotes,
            'message' => 'Pembayaran berhasil dikonfirmasi. Reservasi resmi berstatus Confirmed!',
        ]);
    }

    /**
     * Lunasi sisa pembayaran reservasi yang sebelumnya hanya bayar DP
     */
    public function payBalance(Request $request, $id)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Silakan masuk ke akun terlebih dahulu.'], 401);
        }

        $customer = DB::table('customers')->where('user_id', $user->id)->first();
        $customerId = $customer ? $customer->id : -1;

        $reservation = DB::table('reservations')
            ->where('id', $id)
            ->where(function ($q) use ($user, $customerId) {
                $q->where('created_by', $user->id)
                  ->orWhere('customer_id', $customerId);
            })
            ->first();

        if (!$reservation) {
            return response()->json(['success' => false, 'message' => 'Reservasi tidak ditemukan.'], 404);
        }

        // Cek sisa tagihan dari special_request
        $remainingAmount = 0;
        if (preg_match('/\(Sisa Kasir:\s*Rp\s*([0-9\.]+)\)/i', $reservation->special_request ?? '', $remMatches)) {
            $remainingAmount = intval(str_replace('.', '', $remMatches[1]));
        }

        if ($remainingAmount <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Reservasi ini tidak memiliki sisa tagihan (sudah Lunas 100%).',
            ], 400);
        }

        try {
            $midtrans = app(\App\Services\MidtransService::class);
            $customerName = $customer ? $customer->name : ($user->name ?? 'Tamu NUSARA');
            $customerPhone = $customer ? $customer->phone_normalized : ($user->phone ?? null);

            $orderCode = $reservation->reservation_code . '-BAL-' . time();
            $itemLabel = "Pelunasan Sisa Reservasi {$reservation->reservation_code} ({$reservation->guest_count} Tamu)";

            $snapToken = $midtrans->createSnapToken(
                orderCode: $orderCode,
                grossAmount: $remainingAmount,
                items: [
                    [
                        'menu_id' => 'BAL-' . $reservation->reservation_code,
                        'unit_price_snapshot' => $remainingAmount,
                        'quantity' => 1,
                        'menu_name_snapshot' => $itemLabel,
                    ]
                ],
                taxAmount: 0,
                customerName: $customerName,
                customerEmail: $user->email,
                customerPhone: $customerPhone,
                paymentMethod: 'all'
            );

            return response()->json([
                'success' => true,
                'snap_token' => $snapToken,
                'reservation_code' => $reservation->reservation_code,
                'balance_amount' => $remainingAmount,
                'message' => 'Token pelunasan berhasil dibuat.',
            ]);
        } catch (\Exception $ex) {
            \Illuminate\Support\Facades\Log::error("Midtrans Snap Balance Error: " . $ex->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghubungkan ke Midtrans: ' . $ex->getMessage(),
            ], 500);
        }
    }
}
