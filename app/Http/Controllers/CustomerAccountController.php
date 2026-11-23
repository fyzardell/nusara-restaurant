<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\TwoFactorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class CustomerAccountController extends Controller
{
    /**
     * Get account details including 2FA status.
     */
    public function getProfile(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $customer = DB::table('customers')->where('user_id', $user->id)->first();

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $customer?->phone_normalized ?? '',
                'avatar' => $user->avatar,
                'has_password' => !empty($user->password),
                'two_factor_enabled' => $user->hasTwoFactorEnabled(),
                'google_linked' => !empty($user->google_id),
            ],
        ]);
    }

    /**
     * Update customer name and phone.
     */
    public function updateProfile(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $request->validate([
            'name' => 'required|string|max:100',
            'phone' => 'nullable|string|max:20',
        ], [
            'name.required' => 'Nama pengguna wajib diisi.',
            'name.max' => 'Nama tidak boleh melebihi 100 karakter.',
        ]);

        $name = trim($request->input('name'));
        $phone = trim($request->input('phone', ''));

        // Normalize phone if provided
        $normalizedPhone = null;
        if (!empty($phone)) {
            $digits = preg_replace('/[^0-9]/', '', $phone);
            if (str_starts_with($digits, '0')) {
                $normalizedPhone = '+62' . substr($digits, 1);
            } elseif (str_starts_with($digits, '62')) {
                $normalizedPhone = '+' . $digits;
            } else {
                $normalizedPhone = '+' . $digits;
            }

            // Check if phone used by someone else
            $exists = DB::table('customers')
                ->where('phone_normalized', $normalizedPhone)
                ->where('user_id', '!=', $user->id)
                ->exists();
            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nomor WhatsApp / telepon ini sudah digunakan oleh akun lain.',
                ], 422);
            }
        }

        DB::table('users')->where('id', $user->id)->update([
            'name' => $name,
            'updated_at' => now(),
        ]);

        $customer = DB::table('customers')->where('user_id', $user->id)->first();
        if ($customer) {
            $updateData = ['name' => $name, 'updated_at' => now()];
            if ($normalizedPhone) {
                $updateData['phone_normalized'] = $normalizedPhone;
            }
            DB::table('customers')->where('user_id', $user->id)->update($updateData);
        } else {
            DB::table('customers')->insert([
                'user_id' => $user->id,
                'name' => $name,
                'email' => $user->email,
                'phone_normalized' => $normalizedPhone ?? '+62' . time(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Profil dan nama akun berhasil diperbarui!',
            'user' => [
                'id' => $user->id,
                'name' => $name,
                'phone' => $normalizedPhone ?? ($customer?->phone_normalized ?? ''),
                'email' => $user->email,
            ],
        ]);
    }

    /**
     * Update customer password.
     */
    public function updatePassword(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        // If user already has a password, verify current_password
        $hasExistingPassword = !empty($user->password);

        $rules = [
            'password' => 'required|string|min:8|confirmed',
        ];

        if ($hasExistingPassword) {
            $rules['current_password'] = 'required|string';
        }

        $request->validate($rules, [
            'current_password.required' => 'Kata sandi saat ini wajib diisi.',
            'password.required' => 'Kata sandi baru wajib diisi.',
            'password.min' => 'Kata sandi baru minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi kata sandi baru tidak cocok.',
        ]);

        if ($hasExistingPassword && !Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Kata sandi lama yang Anda masukkan tidak sesuai.',
            ], 422);
        }

        DB::table('users')->where('id', $user->id)->update([
            'password' => Hash::make($request->password),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kata sandi akun Anda berhasil diperbarui!',
        ]);
    }

    /**
     * Setup 2FA: Generate fresh secret & QR code.
     */
    public function setup2fa(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $secret = TwoFactorService::generateSecret(16);

        // Temporarily store secret until confirmed
        DB::table('users')->where('id', $user->id)->update([
            'two_factor_secret' => $secret,
            'two_factor_confirmed_at' => null,
            'updated_at' => now(),
        ]);

        $qrCodeUrl = TwoFactorService::getQrCodeImageUrl($user->email, $secret, 'NUSARA Restaurant');
        $otpAuthUrl = TwoFactorService::getOtpAuthUrl($user->email, $secret, 'NUSARA Restaurant');

        return response()->json([
            'success' => true,
            'secret' => $secret,
            'qr_code_url' => $qrCodeUrl,
            'otpauth_url' => $otpAuthUrl,
            'message' => 'Pindai QR code ini di Google Authenticator Anda lalu masukkan 6 digit kode untuk konfirmasi.',
        ]);
    }

    /**
     * Confirm 2FA with 6-digit code.
     */
    public function confirm2fa(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $request->validate([
            'code' => 'required|string|size:6',
        ], [
            'code.required' => 'Kode verifikasi 6-digit wajib diisi.',
            'code.size' => 'Kode verifikasi harus 6 digit angka.',
        ]);

        $dbUser = DB::table('users')->where('id', $user->id)->first();
        if (empty($dbUser->two_factor_secret)) {
            return response()->json([
                'success' => false,
                'message' => 'Sesi setup 2FA belum dimulai. Silakan klik tombol Aktifkan 2FA terlebih dahulu.',
            ], 422);
        }

        $isValid = TwoFactorService::verifyCode($dbUser->two_factor_secret, $request->code);
        if (!$isValid) {
            return response()->json([
                'success' => false,
                'message' => 'Kode 6-digit tidak cocok atau sudah kadaluarsa. Pastikan jam di HP Anda sinkron.',
            ], 422);
        }

        DB::table('users')->where('id', $user->id)->update([
            'two_factor_confirmed_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Verifikasi Dua Langkah (Google Authenticator) berhasil diaktifkan untuk akun Anda!',
        ]);
    }

    /**
     * Disable 2FA.
     */
    public function disable2fa(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $request->validate([
            'code' => 'required|string',
        ], [
            'code.required' => 'Kode autentikator atau kata sandi wajib diisi untuk menonaktifkan 2FA.',
        ]);

        $dbUser = DB::table('users')->where('id', $user->id)->first();
        $code = trim($request->code);

        // Can verify with TOTP code OR password
        $isValidCode = !empty($dbUser->two_factor_secret) && TwoFactorService::verifyCode($dbUser->two_factor_secret, $code);
        $isValidPassword = !empty($dbUser->password) && Hash::check($code, $dbUser->password);

        if (!$isValidCode && !$isValidPassword) {
            return response()->json([
                'success' => false,
                'message' => 'Kode 6-digit atau kata sandi tidak sesuai.',
            ], 422);
        }

        DB::table('users')->where('id', $user->id)->update([
            'two_factor_secret' => null,
            'two_factor_confirmed_at' => null,
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Verifikasi Dua Langkah (2FA) berhasil dinonaktifkan.',
        ]);
    }
}
