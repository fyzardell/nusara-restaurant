<?php

namespace App\Services;

class TwoFactorService
{
    private const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    /**
     * Generate a 16-character Base32 secret for TOTP.
     */
    public static function generateSecret(int $length = 16): string
    {
        $secret = '';
        $chars = self::BASE32_CHARS;
        $max = strlen($chars) - 1;

        for ($i = 0; $i < $length; $i++) {
            $secret .= $chars[random_int(0, $max)];
        }

        return $secret;
    }

    /**
     * Generate an otpauth:// URL for authenticator apps.
     */
    public static function getOtpAuthUrl(string $name, string $secret, string $issuer = 'NUSARA'): string
    {
        $encodedIssuer = rawurlencode($issuer);
        $encodedName = rawurlencode($name);
        return "otpauth://totp/{$encodedIssuer}:{$encodedName}?secret={$secret}&issuer={$encodedIssuer}&algorithm=SHA1&digits=6&period=30";
    }

    /**
     * Get a QR code image URL (using reliable SVG/PNG generation).
     */
    public static function getQrCodeImageUrl(string $name, string $secret, string $issuer = 'NUSARA'): string
    {
        $otpUrl = self::getOtpAuthUrl($name, $secret, $issuer);
        return 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=' . rawurlencode($otpUrl);
    }

    /**
     * Verify a 6-digit TOTP code against a secret with window tolerance.
     */
    public static function verifyCode(string $secret, string $code, int $window = 1): bool
    {
        $code = trim($code);
        if (strlen($code) !== 6 || !ctype_digit($code)) {
            return false;
        }

        $timeSlice = (int) floor(time() / 30);
        $secret = strtoupper(trim($secret));

        for ($offset = -$window; $offset <= $window; $offset++) {
            if (self::calculateCode($secret, $timeSlice + $offset) === $code) {
                return true;
            }
        }

        return false;
    }

    /**
     * Calculate 6-digit TOTP code for a specific time slice.
     */
    private static function calculateCode(string $secret, int $timeSlice): string
    {
        $binaryKey = self::base32Decode($secret);
        if ($binaryKey === '') {
            return '';
        }

        // Pack time slice as 64-bit big-endian binary
        $timeBytes = pack('N*', 0) . pack('N*', $timeSlice);

        // HMAC-SHA1
        $hash = hash_hmac('sha1', $timeBytes, $binaryKey, true);

        // Dynamic truncation (RFC 4226)
        $offset = ord(substr($hash, -1)) & 0x0F;
        $binary = (
            ((ord($hash[$offset]) & 0x7F) << 24) |
            ((ord($hash[$offset + 1]) & 0xFF) << 16) |
            ((ord($hash[$offset + 2]) & 0xFF) << 8) |
            (ord($hash[$offset + 3]) & 0xFF)
        );

        $otp = $binary % 1000000;
        return str_pad((string) $otp, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Helper to decode Base32 string to binary.
     */
    private static function base32Decode(string $b32): string
    {
        $b32 = strtoupper(preg_replace('/[^A-Z2-7]/', '', $b32));
        if ($b32 === '') {
            return '';
        }

        $lookup = array_flip(str_split(self::BASE32_CHARS));
        $buffer = 0;
        $bitsLeft = 0;
        $binary = '';

        for ($i = 0, $len = strlen($b32); $i < $len; $i++) {
            $char = $b32[$i];
            if (!isset($lookup[$char])) {
                continue;
            }

            $buffer = ($buffer << 5) | $lookup[$char];
            $bitsLeft += 5;

            if ($bitsLeft >= 8) {
                $bitsLeft -= 8;
                $binary .= chr(($buffer >> $bitsLeft) & 0xFF);
            }
        }

        return $binary;
    }
}
