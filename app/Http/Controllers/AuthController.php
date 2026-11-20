<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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
                'role' => 'customer',
                'title' => 'Pelanggan / Member',
                'email' => 'pelanggan@nusara.id',
                'phone' => '+6281234567890',
                'password' => 'password123',
                'badge' => 'Customer',
                'desc' => 'Dapat menyimpan menu favorit & melihat riwayat pesanan',
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

        return Inertia::render('Auth/Login', [
            'demoAccounts' => $demoAccounts,
            'defaultRole' => $request->query('role', 'customer'),
            'status' => session('status'),
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
            throw ValidationException::withMessages([
                'login_id' => ['Akun dengan identitas tersebut tidak ditemukan.'],
            ]);
        }

        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'login_id' => ['Akun Anda sedang dinonaktifkan. Hubungi manajemen NUSARA.'],
            ]);
        }

        // Attempt authentication using standard Auth::attempt
        $credentials = [
            'email' => $user->email,
            'password' => $password,
        ];

        if (!Auth::attempt($credentials, $remember)) {
            throw ValidationException::withMessages([
                'password' => ['Kata sandi yang Anda masukkan tidak sesuai.'],
            ]);
        }

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
            return redirect($redirectUrl);
        }

        if ($roleName === 'admin') {
            return redirect()->intended(route('admin.dashboard'));
        }

        if ($roleName === 'cashier') {
            return redirect()->intended(route('cashier.dashboard'));
        }

        if ($roleName === 'customer') {
            return redirect()->intended(route('order.app'));
        }

        return redirect()->intended(route('home'));
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home');
    }
}
