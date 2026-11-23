<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Midtrans\Config;
use Midtrans\Snap;

class MidtransService
{
    public function __construct()
    {
        Config::$serverKey = config('midtrans.server_key');
        Config::$isProduction = config('midtrans.is_production', false);
        Config::$isSanitized = config('midtrans.is_sanitized', true);
        Config::$is3ds = config('midtrans.is_3ds', true);

        // Otomatis arahkan webhook notifikasi ke domain produksi nusara.my.id
        Config::$appendNotifUrl = 'https://nusara.my.id/api/midtrans/webhook';
    }

    /**
     * Generate Snap Token specifically constrained to QRIS & Bank Transfer (Virtual Account)
     */
    public function createSnapToken(
        string $orderCode,
        int $grossAmount,
        array $items,
        int $taxAmount,
        string $customerName,
        ?string $customerEmail = null,
        ?string $customerPhone = null,
        string $paymentMethod = 'all'
    ): string {
        $itemDetails = [];
        foreach ($items as $item) {
            $itemDetails[] = [
                'id' => (string) ($item['menu_id'] ?? 'ITEM-' . rand(100, 999)),
                'price' => (int) round($item['unit_price_snapshot']),
                'quantity' => (int) $item['quantity'],
                'name' => mb_substr($item['menu_name_snapshot'], 0, 50),
            ];
        }

        if ($taxAmount > 0) {
            $itemDetails[] = [
                'id' => 'TAX-PB1',
                'price' => (int) round($taxAmount),
                'quantity' => 1,
                'name' => 'Pajak PB1 Restoran (11%)',
            ];
        }

        // Specific payment channels for NUSARA (QRIS, E-Wallets & Virtual Accounts)
        $enabledPayments = match ($paymentMethod) {
            'qris' => ['qris', 'gopay', 'shopeepay'],
            'gopay' => ['gopay', 'qris'],
            'shopeepay' => ['shopeepay', 'qris'],
            'dana', 'ovo', 'ewallet' => ['qris', 'gopay', 'shopeepay'],
            'bca_va', 'bca' => ['bca_va'],
            'mandiri_va', 'mandiri', 'echannel' => ['echannel'],
            'bni_va', 'bni' => ['bni_va'],
            'bri_va', 'bri' => ['bri_va'],
            'permata_va', 'permata' => ['permata_va'],
            'bank_transfer' => ['bca_va', 'bni_va', 'bri_va', 'echannel', 'permata_va'],
            default => ['qris', 'gopay', 'shopeepay', 'bca_va', 'bni_va', 'bri_va', 'echannel', 'permata_va'],
        };

        $params = [
            'transaction_details' => [
                'order_id' => $orderCode,
                'gross_amount' => (int) round($grossAmount),
            ],
            'item_details' => $itemDetails,
            'customer_details' => [
                'first_name' => $customerName,
                'email' => $customerEmail ?: 'tamu@nusara.my.id',
                'phone' => $customerPhone ?: '+6281234567890',
            ],
            'enabled_payments' => $enabledPayments,
        ];

        return Snap::getSnapToken($params);
    }

    /**
     * Process incoming Webhook notification from Midtrans
     */
    public function processNotification(array $payload): array
    {
        $orderId = $payload['order_id'] ?? null;
        $statusCode = $payload['status_code'] ?? null;
        $grossAmount = $payload['gross_amount'] ?? null;
        $serverKey = config('midtrans.server_key');
        $signatureKey = $payload['signature_key'] ?? '';

        if (!$orderId || !$statusCode || !$grossAmount) {
            throw new Exception('Payload notifikasi Midtrans tidak lengkap.');
        }

        // Signature validation
        $calculatedSignature = hash('sha512', $orderId . $statusCode . $grossAmount . $serverKey);
        if ($calculatedSignature !== $signatureKey) {
            Log::warning("Midtrans Webhook: Signature tidak cocok untuk order {$orderId}");
            throw new Exception('Signature key Midtrans tidak valid.');
        }

        $transactionStatus = $payload['transaction_status'] ?? '';
        $fraudStatus = $payload['fraud_status'] ?? 'accept';
        $paymentType = $payload['payment_type'] ?? 'unknown';
        $transactionId = $payload['transaction_id'] ?? null;

        $cleanOrderId = preg_replace('/-[0-9]+$/', '', $orderId);

        $order = DB::table('orders')->where('order_code', $orderId)->orWhere('order_code', $cleanOrderId)->first();
        if (!$order) {
            // Cek apakah notifikasi untuk Reservasi Meja (RSV-XXXXXX)
            $reservation = DB::table('reservations')->where('reservation_code', $orderId)->orWhere('reservation_code', $cleanOrderId)->first();
            if ($reservation) {
                return $this->processReservationNotification($reservation, $payload);
            }
            throw new Exception("Order atau Reservasi dengan kode {$orderId} tidak ditemukan.");
        }

        $payment = DB::table('payments')->where('order_id', $order->id)->first();

        $isPaid = false;
        $newOrderStatus = $order->order_status;
        $newPaymentStatus = $payment ? $payment->payment_status : 'Pending';

        if ($transactionStatus === 'capture') {
            if ($fraudStatus === 'accept') {
                $isPaid = true;
                $newPaymentStatus = 'Paid';
                if ($order->order_status === 'Pending') {
                    $newOrderStatus = 'Preparing';
                }
            }
        } elseif ($transactionStatus === 'settlement') {
            $isPaid = true;
            $newPaymentStatus = 'Paid';
            if ($order->order_status === 'Pending') {
                $newOrderStatus = 'Preparing';
            }
        } elseif (in_array($transactionStatus, ['cancel', 'deny', 'expire'])) {
            $newPaymentStatus = ($transactionStatus === 'expire') ? 'Expired' : 'Failed';
            if ($order->order_status === 'Pending') {
                $newOrderStatus = 'Cancelled';
            }
        } elseif ($transactionStatus === 'pending') {
            $newPaymentStatus = 'Pending';
        }

        // Update database in transaction
        DB::transaction(function () use (
            $order,
            $payment,
            $newOrderStatus,
            $newPaymentStatus,
            $isPaid,
            $transactionId,
            $transactionStatus,
            $paymentType,
            $payload
        ) {
            // Update orders
            if ($newOrderStatus !== $order->order_status) {
                DB::table('orders')->where('id', $order->id)->update([
                    'order_status' => $newOrderStatus,
                    'updated_at' => now(),
                ]);

                DB::table('order_status_histories')->insert([
                    'order_id' => $order->id,
                    'old_status' => $order->order_status,
                    'new_status' => $newOrderStatus,
                    'notes' => "Webhook Midtrans: {$transactionStatus} ({$paymentType})",
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Update payments
            if ($payment) {
                DB::table('payments')->where('id', $payment->id)->update([
                    'payment_status' => $newPaymentStatus,
                    'paid_at' => $isPaid ? now() : $payment->paid_at,
                    'updated_at' => now(),
                ]);

                // Update or insert payment_transactions
                DB::table('payment_transactions')->updateOrInsert(
                    ['payment_id' => $payment->id],
                    [
                        'provider' => 'midtrans',
                        'provider_transaction_id' => $transactionId,
                        'transaction_status' => $transactionStatus,
                        'response_data' => json_encode($payload),
                        'updated_at' => now(),
                    ]
                );
            }
        });

        return [
            'status' => 'success',
            'order_code' => $orderId,
            'payment_status' => $newPaymentStatus,
            'order_status' => $newOrderStatus,
        ];
    }

    /**
     * Process incoming Webhook notification for Reservation DP
     */
    private function processReservationNotification(object $reservation, array $payload): array
    {
        $transactionStatus = $payload['transaction_status'] ?? '';
        $fraudStatus = $payload['fraud_status'] ?? 'accept';
        $paymentType = $payload['payment_type'] ?? 'unknown';
        $grossAmount = $payload['gross_amount'] ?? 0;

        $isPaid = false;
        $newStatus = $reservation->status;

        if ($transactionStatus === 'capture' || $transactionStatus === 'settlement') {
            if ($fraudStatus === 'accept') {
                $isPaid = true;
                $newStatus = 'Confirmed';
            }
        } elseif (in_array($transactionStatus, ['cancel', 'deny', 'expire'])) {
            $newStatus = 'Cancelled';
        }

        DB::transaction(function () use ($reservation, $newStatus, $isPaid, $transactionStatus, $paymentType, $grossAmount) {
            $updateData = [
                'status' => $newStatus,
                'updated_at' => now(),
            ];

            if ($isPaid) {
                $dpFmt = number_format(floatval($grossAmount), 0, ',', '.');
                $updateData['special_request'] = "[DP TERBAYAR MIDTRANS Rp {$dpFmt} ({$paymentType}) - VALIDASI SUKSES] " . ($reservation->special_request ?? '');
            }

            DB::table('reservations')->where('id', $reservation->id)->update($updateData);

            DB::table('audit_logs')->insert([
                'user_id' => $reservation->created_by ?: 1,
                'action' => 'reservation.payment_midtrans',
                'entity_type' => 'Reservation',
                'entity_id' => $reservation->id,
                'description' => "Webhook Midtrans: Pembayaran DP Reservasi {$reservation->reservation_code} berstatus {$transactionStatus} ({$paymentType}). Status reservasi diperbarui menjadi {$newStatus}.",
                'created_at' => now(),
            ]);
        });

        return [
            'status' => 'success',
            'reservation_code' => $reservation->reservation_code,
            'reservation_status' => $newStatus,
            'is_paid' => $isPaid,
        ];
    }
}
