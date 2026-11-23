<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function showLogin(Request $request)
    {
        if (Auth::check()) {
            return redirect()->route('home');
        }

        // Demo accounts for instant test preview
        $demoAccounts = [
            [
                'role' => 'admin',
                'title' => 'Master Demo (Semua Role)',
                'email' => 'allrole@nusara.id',
                'phone' => '+6281299990000',
                'password' => 'password123',
                'badge' => 'Semua Role (Master Demo)',
                'desc' => '1 Akun akses penuh ke SEMUA modul: Admin HQ, Kasir POS, Waiter, Order & Reservasi',
                'redirect' => '/admin',
            ],
            [
                'role' => 'customer',
                'title' => 'Pelanggan / Member',
                'email' => 'pelanggan@nusara.id',
                'phone' => '+6281234567890',
                'password' => 'password123',
                'badge' => 'Customer',
                'desc' => 'Dapat menyimpan menu favorit & melihat riwayat pesanan',
            ],
            [
                'role' => 'customer',
                'title' => 'Tamu Dine-in (Meja 01)',
                'email' => 'meja01@nusara.id',
                'phone' => '+6281200000001',
                'password' => 'password123',
                'badge' => 'Tamu Meja 01',
                'desc' => 'Makan di tempat via QR Meja & live chat atas nama Meja 01',
                'redirect' => '/order?type=dine_in&table=01',
            ],
            [
                'role' => 'admin',
                'title' => 'Executive Administrator',
                'email' => 'admin@nusara.id',
                'password' => 'password123',
                'badge' => 'Staff Admin',
                'desc' => 'Kelola seluruh menu, staf, meja, QR, dan laporan',
            ],
            [
                'role' => 'cashier',
                'title' => 'Kasir Operasional',
                'email' => 'cashier@nusara.id',
                'password' => 'password123',
                'badge' => 'Staff Cashier',
                'desc' => 'Kelola antrean order, verifikasi bayar, update status dapur',
            ],
            [
                'role' => 'waiter',
                'title' => 'Pelayan Restoran (Waiter)',
                'email' => 'waiter@nusara.id',
                'password' => 'password123',
                'badge' => 'Staff Waiter',
                'desc' => 'Validasi meja terisi, antar makanan ready, bersihkan meja',
            ],
        ];

        $initialMode = $request->query('tab') === 'register' || $request->is('register*') ? 'register' : 'login';

        return Inertia::render('Auth/Login', [
            'demoAccounts' => $demoAccounts,
            'defaultRole' => $request->query('role', 'customer'),
            'status' => session('status'),
            'initialMode' => $initialMode,
        ]);
    }

    public function login(Request $request)
    {
        $request->validate([
            'login_id' => 'required|string',
            'password' => 'required|string',
            'portal_type' => 'nullable|string', // 'customer' or 'staff'
        ]);

        $loginId = trim($request->input('login_id'));
        $password = $request->input('password');
        $remember = $request->boolean('remember');

        // Check if login is email or phone number
        $isEmail = filter_var($loginId, FILTER_VALIDATE_EMAIL);

        $user = null;
        if ($isEmail) {
            $user = DB::table('users')->where('email', $loginId)->first();
        } else {
            // Find by customer phone normalized
            $customer = DB::table('customers')->where('phone_normalized', $loginId)->first();
            if ($customer && $customer->user_id) {
                $user = DB::table('users')->where('id', $customer->user_id)->first();
            }
        }

        if (!$user) {
            // Auto-provision akun demo All Role jika belum di-seed
            if (in_array(strtolower($loginId), ['allrole@nusara.id', '+6281299990000'])) {
                $adminRoleId = DB::table('roles')->where('name', 'admin')->value('id') ?? 1;
                $newUserId = DB::table('users')->insertGetId([
                    'role_id' => $adminRoleId,
                    'name' => 'Bhakti Nusantara (Master Demo)',
                    'email' => 'allrole@nusara.id',
                    'password' => Hash::make('password123'),
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                DB::table('customers')->insert([
                    'user_id' => $newUserId,
                    'name' => 'Bhakti Nusantara (Master Demo)',
                    'phone_normalized' => '+6281299990000',
                    'email' => 'allrole@nusara.id',
                    'phone_verified_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $user = DB::table('users')->where('id', $newUserId)->first();
            }
            // Auto-provision akun demo Meja 01 jika belum di-seed
            elseif (in_array(strtolower($loginId), ['meja01@nusara.id', '+6281200000001'])) {
                $customerRoleId = DB::table('roles')->where('name', 'customer')->value('id') ?? 4;
                $newUserId = DB::table('users')->insertGetId([
                    'role_id' => $customerRoleId,
                    'name' => 'Tamu Meja 01',
                    'email' => 'meja01@nusara.id',
                    'password' => Hash::make('password123'),
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                DB::table('customers')->insert([
                    'user_id' => $newUserId,
                    'name' => 'Tamu Meja 01',
                    'phone_normalized' => '+6281200000001',
                    'email' => 'meja01@nusara.id',
                    'phone_verified_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $user = DB::table('users')->where('id', $newUserId)->first();
            } else {
                throw ValidationException::withMessages([
                    'login_id' => ['Akun dengan identitas tersebut tidak ditemukan.'],
                ]);
            }
        }

        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'login_id' => ['Akun Anda sedang dinonaktifkan. Hubungi manajemen NUSARA.'],
            ]);
        }

        if (!Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['Kata sandi yang Anda masukkan tidak sesuai.'],
            ]);
        }

        // Cek 2FA jika aktif
        if (!empty($user->two_factor_secret) && !empty($user->two_factor_confirmed_at)) {
            $twoFactorCode = trim($request->input('two_factor_code', ''));
            if (empty($twoFactorCode)) {
                if ($request->wantsJson()) {
                    return response()->json([
                        'requires_2fa' => true,
                        'message' => 'Akun Anda diproteksi oleh Google Authenticator (2FA). Silakan masukkan 6 digit kode.',
                    ]);
                }
                return back()->with('requires_2fa', true)->with('email', $user->email);
            }

            if (!\App\Services\TwoFactorService::verifyCode($user->two_factor_secret, $twoFactorCode)) {
                throw ValidationException::withMessages([
                    'two_factor_code' => ['Kode 6-digit Google Authenticator tidak cocok atau kadaluarsa.'],
                ]);
            }
        }

        Auth::loginUsingId($user->id, $remember);

        $request->session()->regenerate();

        // Get role name
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        $roleName = $role ? strtolower($role->name) : 'customer';

        // Bersihkan nama dari role yang berulang (misal "Raden Mas Haryo (Admin)")
        $cleanName = trim(preg_replace('/\s*\([^)]*\)/', '', $user->name));
        $roleLabel = ucfirst($roleName);
        session()->flash('success', "Selamat datang kembali, {$cleanName} ({$roleLabel})!");

        $redirectUrl = $request->input('redirect');
        if ($redirectUrl && is_string($redirectUrl) && str_starts_with($redirectUrl, '/')) {
            $target = $redirectUrl;
        } elseif ($roleName === 'admin') {
            $target = route('admin.dashboard');
        } elseif ($roleName === 'cashier') {
            $target = route('cashier.dashboard');
        } elseif ($roleName === 'waiter') {
            $target = route('waiter.dashboard');
        } elseif ($roleName === 'customer') {
            $target = route('order.app');
        } else {
            $target = route('home');
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'redirect' => $target,
                'message' => "Selamat datang kembali, {$cleanName} ({$roleLabel})!",
            ]);
        }

        return redirect()->intended($target);
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email|max:150',
            'phone' => 'required|string|max:20',
            'password' => 'required|string|min:8|confirmed',
            'agree_terms' => 'accepted',
        ], [
            'name.required' => 'Nama lengkap wajib diisi.',
            'email.required' => 'Alamat email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email ini sudah terdaftar sebagai akun NUSARA.',
            'phone.required' => 'Nomor WhatsApp / telepon wajib diisi.',
            'password.required' => 'Kata sandi wajib diisi.',
            'password.min' => 'Kata sandi minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
            'agree_terms.accepted' => 'Anda harus menyetujui syarat & kebijakan privasi NUSARA.',
        ]);

        $phone = trim($request->input('phone'));
        $digits = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($digits, '0')) {
            $normalizedPhone = '+62' . substr($digits, 1);
        } elseif (str_starts_with($digits, '62')) {
            $normalizedPhone = '+' . $digits;
        } else {
            $normalizedPhone = '+' . $digits;
        }

        // Cek nomor telepon unik di tabel customers
        $existingCustomer = DB::table('customers')->where('phone_normalized', $normalizedPhone)->first();
        if ($existingCustomer) {
            throw ValidationException::withMessages([
                'phone' => ['Nomor telepon ini sudah terdaftar sebagai anggota NUSARA.'],
            ]);
        }

        $customerRole = DB::table('roles')->where('name', 'customer')->first();
        $customerRoleId = $customerRole ? $customerRole->id : 1;

        $userId = DB::table('users')->insertGetId([
            'role_id' => $customerRoleId,
            'name' => $request->input('name'),
            'email' => strtolower($request->input('email')),
            'password' => Hash::make($request->input('password')),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('customers')->insert([
            'user_id' => $userId,
            'name' => $request->input('name'),
            'phone_normalized' => $normalizedPhone,
            'email' => strtolower($request->input('email')),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $user = \App\Models\User::find($userId);
        Auth::login($user);
        $request->session()->regenerate();

        session()->flash('success', "Selamat datang di NUSARA, {$user->name}! Akun anggota eksklusif Anda telah aktif.");

        $redirectUrl = $request->input('redirect');
        if ($redirectUrl && is_string($redirectUrl) && str_starts_with($redirectUrl, '/')) {
            return redirect($redirectUrl);
        }

        return redirect()->intended(route('order.app'));
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'redirect' => route('home'),
                'message' => 'Sesi telah berhasil diakhiri.',
            ]);
        }

        return redirect()->route('home');
    }

    /**
     * Redirect pengguna ke halaman otentikasi Google OAuth 2.0.
     */
    public function redirectToGoogle(Request $request)
    {
        $clientId = config('services.google.client_id') ?: env('GOOGLE_CLIENT_ID');
        $redirectUri = config('services.google.redirect') ?: env('GOOGLE_REDIRECT_URI', 'http://127.0.0.1:8000/auth/google/callback');

        if (empty($clientId)) {
            return redirect()->route('login')->with('error', 'Login Google belum dikonfigurasi. Silakan tambahkan GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET di file .env Anda.');
        }

        $state = \Illuminate\Support\Str::random(40);
        session(['google_oauth_state' => $state]);

        $query = http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => 'openid profile email',
            'access_type' => 'offline',
            'prompt' => 'select_account',
            'state' => $state,
        ]);

        return redirect('https://accounts.google.com/o/oauth2/v2/auth?' . $query);
    }

    /**
     * Handle callback dari Google OAuth 2.0.
     */
    public function handleGoogleCallback(Request $request)
    {
        if ($request->has('error')) {
            return redirect()->route('login')->with('error', 'Otorisasi Google dibatalkan: ' . $request->input('error'));
        }

        $code = $request->input('code');
        if (!$code) {
            return redirect()->route('login')->with('error', 'Kode otorisasi Google tidak ditemukan.');
        }

        $clientId = config('services.google.client_id') ?: env('GOOGLE_CLIENT_ID');
        $clientSecret = config('services.google.client_secret') ?: env('GOOGLE_CLIENT_SECRET');
        $redirectUri = config('services.google.redirect') ?: env('GOOGLE_REDIRECT_URI', 'http://127.0.0.1:8000/auth/google/callback');

        try {
            $tokenResponse = \Illuminate\Support\Facades\Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'code' => $code,
                'grant_type' => 'authorization_code',
                'redirect_uri' => $redirectUri,
            ]);

            if (!$tokenResponse->successful()) {
                \Illuminate\Support\Facades\Log::error('Google Token Error: ' . $tokenResponse->body());
                return redirect()->route('login')->with('error', 'Gagal menukarkan token dengan Google: ' . $tokenResponse->body());
            }

            $accessToken = $tokenResponse->json('access_token');

            $userResponse = \Illuminate\Support\Facades\Http::withToken($accessToken)->get('https://www.googleapis.com/oauth2/v3/userinfo');
            if (!$userResponse->successful()) {
                return redirect()->route('login')->with('error', 'Gagal mengambil data profil pengguna dari Google.');
            }

            $googleData = $userResponse->json();
            $googleId = $googleData['sub'] ?? null;
            $email = strtolower($googleData['email'] ?? '');
            $name = $googleData['name'] ?? 'Pelanggan Google';
            $avatar = $googleData['picture'] ?? null;

            if (!$email) {
                return redirect()->route('login')->with('error', 'Akun Google Anda tidak menyediakan alamat email yang valid.');
            }

            // Cari atau buat user baru
            $user = \App\Models\User::where('google_id', $googleId)
                ->orWhere('email', $email)
                ->first();

            if ($user) {
                $user->update([
                    'google_id' => $googleId,
                    'avatar' => $user->avatar ?: $avatar,
                ]);
            } else {
                $customerRole = DB::table('roles')->where('name', 'customer')->first();
                $customerRoleId = $customerRole ? $customerRole->id : 4;

                $user = \App\Models\User::create([
                    'name' => $name,
                    'email' => $email,
                    'google_id' => $googleId,
                    'avatar' => $avatar,
                    'role_id' => $customerRoleId,
                    'is_active' => true,
                ]);

                DB::table('customers')->insert([
                    'user_id' => $user->id,
                    'name' => $name,
                    'email' => $email,
                    'phone_normalized' => '+62' . time(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            Auth::login($user, true);
            $request->session()->regenerate();

            session()->flash('success', "Selamat datang di NUSARA, {$user->name}!");
            return redirect()->intended(route('order.app'));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Google OAuth Exception: ' . $e->getMessage());
            return redirect()->route('login')->with('error', 'Terjadi kesalahan otentikasi Google: ' . $e->getMessage());
        }
    }
}
