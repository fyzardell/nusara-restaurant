<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SampleOrderSeeder extends Seeder
{
    public function run(): void
    {
        $customerUser = DB::table('users')->where('email', 'pelanggan@nusara.id')->first();
        if (!$customerUser) return;

        $customer = DB::table('customers')->where('user_id', $customerUser->id)->first();
        $rendang = DB::table('menus')->where('slug', 'rendang-wagyu-tokusen-48-jam')->first();
        $cendol = DB::table('menus')->where('slug', 'cendol-nangka-gelato-madu-hutan')->first();
        $bebek = DB::table('menus')->where('slug', 'bebek-betutu-gianyar-asap-bambu')->first();

        // Seed initial favorites
        if ($rendang) {
            DB::table('favorites')->updateOrInsert(
                ['user_id' => $customerUser->id, 'menu_id' => $rendang->id],
                ['created_at' => now(), 'updated_at' => now()]
            );
        }
        if ($bebek) {
            DB::table('favorites')->updateOrInsert(
                ['user_id' => $customerUser->id, 'menu_id' => $bebek->id],
                ['created_at' => now(), 'updated_at' => now()]
            );
        }

        // Seed past completed order
        $existingOrder = DB::table('orders')->where('order_code', 'ORD-NUSARA-8821')->first();
        if (!$existingOrder && $rendang && $cendol) {
            $orderId = DB::table('orders')->insertGetId([
                'order_code' => 'ORD-NUSARA-8821',
                'customer_id' => $customer ? $customer->id : null,
                'order_type' => 'dine_in',
                'order_status' => 'Served',
                'subtotal' => 310000,
                'tax' => 34100,
                'discount' => 0,
                'total' => 344100,
                'customer_notes' => 'Tolong disajikan hangat, dekat jendela.',
                'created_at' => now()->subHours(2),
                'updated_at' => now()->subHours(1),
            ]);

            DB::table('order_items')->insert([
                [
                    'order_id' => $orderId,
                    'menu_id' => $rendang->id,
                    'menu_name_snapshot' => $rendang->name,
                    'unit_price_snapshot' => $rendang->price,
                    'quantity' => 1,
                    'subtotal' => $rendang->price,
                    'item_notes' => 'Tingkat kepedasan sedang',
                    'created_at' => now()->subHours(2),
                    'updated_at' => now()->subHours(2),
                ],
                [
                    'order_id' => $orderId,
                    'menu_id' => $cendol->id,
                    'menu_name_snapshot' => $cendol->name,
                    'unit_price_snapshot' => $cendol->price,
                    'quantity' => 1,
                    'subtotal' => $cendol->price,
                    'item_notes' => 'Madu hutan dipisah',
                    'created_at' => now()->subHours(2),
                    'updated_at' => now()->subHours(2),
                ]
            ]);

            DB::table('payments')->insert([
                'order_id' => $orderId,
                'payment_method' => 'qris',
                'payment_status' => 'Paid',
                'amount' => 344100,
                'paid_at' => now()->subHours(2),
                'created_at' => now()->subHours(2),
                'updated_at' => now()->subHours(2),
            ]);
        }

        // Seed initial concierge chat
        DB::table('chat_messages')->insertOrIgnore([
            [
                'id' => 1,
                'user_id' => $customerUser->id,
                'sender_type' => 'admin',
                'message' => 'Selamat datang di NUSARA Concierge! Ada yang bisa kami bantu seputar menu, tingkat kepedasan, atau permintaan meja khusus Anda hari ini?',
                'is_read' => true,
                'created_at' => now()->subMinutes(30),
                'updated_at' => now()->subMinutes(30),
            ]
        ]);
    }
}
