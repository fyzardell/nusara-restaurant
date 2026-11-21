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
            ->leftJoin('reservation_tables', 'reservations.id', '=', 'reservation_tables.reservation_id')
            ->leftJoin('restaurant_tables', 'reservation_tables.table_id', '=', 'restaurant_tables.id')
            ->select(
                'reservations.*',
                'dining_experiences.name as experience_name',
                'restaurant_tables.table_number'
            )
            ->orderByDesc('reservations.created_at')
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
     * Store new customer reservation with 3-hour WIB rule and table collision prevention.
     */
    public function store(Request $request)
    {
        if (!Auth::check()) {
            return redirect()->guest(route('login', ['redirect' => '/reservation']));
        }

        $request->validate([
            'date' => 'required|date_format:Y-m-d|after_or_equal:today',
            'time' => 'required|date_format:H:i',
            'guest_count' => 'required|integer|min:1|max:10',
            'table_id' => 'required|exists:restaurant_tables,id',
            'experience_id' => 'nullable|exists:dining_experiences,id',
            'special_request' => 'nullable|string|max:500',
            'customer_name' => 'required|string|max:100',
            'customer_phone' => 'required|string|max:25',
        ], [
            'date.required' => 'Pilih tanggal reservasi terlebih dahulu.',
            'date.after_or_equal' => 'Tanggal reservasi tidak boleh di masa lalu.',
            'time.required' => 'Pilih jam kedatangan reservasi.',
            'table_id.required' => 'Pilih salah satu meja yang masih tersedia.',
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
                return back()->withErrors([
                    'time' => 'Reservasi hari ini wajib dilakukan minimal 3 jam sebelumnya (WIB) untuk persiapan jamuan istimewa Anda.'
                ])->withInput();
            }
        } elseif ($resDateTime->isPast()) {
            return back()->withErrors([
                'date' => 'Waktu reservasi yang dipilih sudah lewat.'
            ])->withInput();
        }

        // Table Collision Detection (± 105 menit rentang waktu makan)
        $durationMinutes = 120;
        $startWindow = $resDateTime->copy()->subMinutes($durationMinutes - 15);
        $endWindow = $resDateTime->copy()->addMinutes($durationMinutes - 15);

        $conflict = DB::table('reservations')
            ->join('reservation_tables', 'reservations.id', '=', 'reservation_tables.reservation_id')
            ->where('reservation_tables.table_id', $request->table_id)
            ->whereIn('reservations.status', ['Pending', 'Confirmed'])
            ->whereBetween('reservations.reservation_datetime', [$startWindow, $endWindow])
            ->exists();

        if ($conflict) {
            return back()->withErrors([
                'table_id' => 'Meja yang dipilih sudah terpesan oleh tamu lain pada rentang jam tersebut. Silakan pilih meja lain atau sesuaikan jam kedatangan.'
            ])->withInput();
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

        $reservationId = DB::table('reservations')->insertGetId([
            'reservation_code' => $code,
            'customer_id' => $customerId,
            'experience_id' => $request->experience_id ?: null,
            'reservation_datetime' => $resDateTime->format('Y-m-d H:i:s'),
            'guest_count' => $request->guest_count,
            'duration_minutes' => $durationMinutes,
            'status' => 'Pending',
            'special_request' => $request->special_request,
            'source' => 'website',
            'created_by' => $user->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Attach pivot table
        DB::table('reservation_tables')->insert([
            'reservation_id' => $reservationId,
            'table_id' => $request->table_id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Audit Log
        DB::table('audit_logs')->insert([
            'user_id' => $user->id,
            'action' => 'reservation.create',
            'entity_type' => 'Reservation',
            'entity_id' => $reservationId,
            'description' => "Reservasi online dibuat dengan kode {$code} untuk {$request->guest_count} tamu pada {$request->date} {$request->time} WIB.",
            'created_at' => now(),
        ]);

        $tableName = DB::table('restaurant_tables')->where('id', $request->table_id)->value('table_number') ?? 'Meja';

        session()->flash('success', "Reservasi {$code} berhasil dibuat untuk {$tableName}! Tim reservasi NUSARA akan segera mengonfirmasi melalui kontak Anda.");

        return redirect()->route('reservation');
    }
}
