<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class NusaraDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Roles
        $roles = [
            ['name' => 'admin', 'description' => 'Administrator dengan hak penuh atas sistem restoran'],
            ['name' => 'cashier', 'description' => 'Kasir yang mengelola pesanan, konfirmasi pembayaran, dan reservasi'],
            ['name' => 'waiter', 'description' => 'Pelayan yang memvalidasi meja, mengantarkan pesanan, dan membersihkan meja'],
            ['name' => 'customer', 'description' => 'Pelanggan terdaftar yang dapat menyimpan favorit dan melihat riwayat pesanan'],
        ];

        $roleIds = [];
        foreach ($roles as $role) {
            $id = DB::table('roles')->insertGetId([
                'name' => $role['name'],
                'description' => $role['description'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $roleIds[$role['name']] = $id;
        }

        // 2. Users
        $password = Hash::make('password123');

        $adminId = DB::table('users')->insertGetId([
            'role_id' => $roleIds['admin'],
            'name' => 'Raden Mas Haryo (Admin)',
            'email' => 'admin@nusara.id',
            'password' => $password,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $cashierId = DB::table('users')->insertGetId([
            'role_id' => $roleIds['cashier'],
            'name' => 'Dewi Anggraini (Kasir)',
            'email' => 'cashier@nusara.id',
            'password' => $password,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $waiterId = DB::table('users')->insertGetId([
            'role_id' => $roleIds['waiter'],
            'name' => 'Bagus Wicaksono (Waiter)',
            'email' => 'waiter@nusara.id',
            'password' => $password,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $customerId = DB::table('users')->insertGetId([
            'role_id' => $roleIds['customer'],
            'name' => 'Anindya Laksmi',
            'email' => 'pelanggan@nusara.id',
            'password' => $password,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Customer profile
        DB::table('customers')->insert([
            'user_id' => $customerId,
            'name' => 'Anindya Laksmi',
            'phone_normalized' => '+6281234567890',
            'email' => 'pelanggan@nusara.id',
            'phone_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 3. Restaurant Settings
        DB::table('restaurant_settings')->insert([
            'restaurant_name' => 'NUSARA — Indonesian Dining Experience',
            'address' => 'Jl. Senopati No. 88, Kebayoran Baru, Jakarta Selatan 12190',
            'phone' => '+62 21 5567 8900',
            'email' => 'concierge@nusara.id',
            'social_links' => json_encode([
                'instagram' => 'https://instagram.com/nusara.dining',
                'facebook' => 'https://facebook.com/nusara.dining',
                'tiktok' => 'https://tiktok.com/@nusara.dining',
            ]),
            'tax_percentage' => 11.00,
            'reservation_policy' => 'Reservasi disarankan 24 jam sebelumnya. Meja disimpan selama 15 menit dari jam yang dijadwalkan.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 4. Operating Hours
        $days = [
            ['day' => 1, 'name' => 'Senin', 'open' => '11:00', 'close' => '22:30', 'closed' => false],
            ['day' => 2, 'name' => 'Selasa', 'open' => '11:00', 'close' => '22:30', 'closed' => false],
            ['day' => 3, 'name' => 'Rabu', 'open' => '11:00', 'close' => '22:30', 'closed' => false],
            ['day' => 4, 'name' => 'Kamis', 'open' => '11:00', 'close' => '22:30', 'closed' => false],
            ['day' => 5, 'name' => 'Jumat', 'open' => '11:00', 'close' => '23:00', 'closed' => false],
            ['day' => 6, 'name' => 'Sabtu', 'open' => '10:30', 'close' => '23:30', 'closed' => false],
            ['day' => 0, 'name' => 'Minggu', 'open' => '10:30', 'close' => '22:30', 'closed' => false],
        ];

        foreach ($days as $d) {
            DB::table('operating_hours')->insert([
                'day_of_week' => $d['day'],
                'day_name' => $d['name'],
                'open_time' => $d['open'],
                'close_time' => $d['close'],
                'is_closed' => $d['closed'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 5. Dining Experiences
        $experiences = [
            [
                'name' => 'Royal Rijsttafel Nusantara',
                'slug' => 'royal-rijsttafel-nusantara',
                'description' => 'Perjamuan agung 12 ragam mahakarya kuliner kesultanan Nusantara tempo doeloe yang disajikan serentak dalam piring tembaga berukir dengan pendampingan pelayan berbusana wastra.',
                'duration_minutes' => 120,
                'price_per_person' => 485000,
                'image_url' => 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
                'is_available' => true,
            ],
            [
                'name' => 'Archipelago Chef’s Table',
                'slug' => 'archipelago-chefs-table',
                'description' => 'Sesi multi-course eksklusif 8 hidangan terkurasi langsung di hadapan Executive Chef kami. Saksikan teknik pengasapan kayu jati dan racikan rempah langka Nusantara.',
                'duration_minutes' => 150,
                'price_per_person' => 750000,
                'image_url' => 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80',
                'is_available' => true,
            ],
            [
                'name' => 'Intimate Heritage Dining',
                'slug' => 'intimate-heritage-dining',
                'description' => 'Suasana santap malam privat yang hangat di ruang berkursi rotan antik dan beraroma melati segar, cocok untuk perayaan ulang tahun, jamuan bisnis, maupun momen istimewa.',
                'duration_minutes' => 120,
                'price_per_person' => 350000,
                'image_url' => 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
                'is_available' => true,
            ],
        ];

        foreach ($experiences as $exp) {
            DB::table('dining_experiences')->insert(array_merge($exp, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // 6. Categories
        $categories = [
            ['name' => 'Tanda Rasa (Appetizer)', 'slug' => 'appetizer', 'description' => 'Pembuka selera dengan racikan rempah segar khas pesisir dan pedalaman Nusantara.'],
            ['name' => 'Hidangan Utama', 'slug' => 'main-course', 'description' => 'Pusaka rasa Indonesia yang dimasak perlahan dengan bahan baku kualitas premium.'],
            ['name' => 'Warisan Bakaran', 'slug' => 'grill-satay', 'description' => 'Daging pilihan dibakar di atas arang batok kelapa dan kayu rambutan aromatik.'],
            ['name' => 'Pemanis Tradisi (Dessert)', 'slug' => 'dessert', 'description' => 'Sajian manis warisan leluhur dengan sentuhan tekstur pastry kontemporer.'],
            ['name' => 'Racikan Minuman', 'slug' => 'beverage', 'description' => 'Jamu keraton, infused tea rempah, dan kopi single origin Nusantara.'],
        ];

        $categoryIds = [];
        foreach ($categories as $cat) {
            $id = DB::table('categories')->insertGetId([
                'name' => $cat['name'],
                'slug' => $cat['slug'],
                'description' => $cat['description'],
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $categoryIds[$cat['slug']] = $id;
        }

        // 7. Menus
        $menus = [
            [
                'category_slug' => 'main-course',
                'name' => 'Rendang Wagyu Tokusen 48 Jam',
                'slug' => 'rendang-wagyu-tokusen-48-jam',
                'description' => 'Daging Wagyu marbling 7 dimasak slow-cooked selama 48 jam dengan santan kelapa tua tanah Minang dan 18 rempah pusaka hingga empuk lumer berkaramel hitam pekat.',
                'price' => 245000,
                'stock_quantity' => 25,
                'is_available' => true,
                'is_featured' => true,
                'image_path' => 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
                'is_best_seller' => true,
            ],
            [
                'category_slug' => 'main-course',
                'name' => 'Bebek Betutu Gianyar Asap Bambu',
                'slug' => 'bebek-betutu-gianyar-asap-bambu',
                'description' => 'Bebek muda utuh dibalut bumbu base genep lengkap, dibungkus pelepah pinang dan diasap dalam bilah bambu selama 12 jam. Disajikan dengan plecing kangkung & sambal matah.',
                'price' => 185000,
                'stock_quantity' => 18,
                'is_available' => true,
                'is_featured' => true,
                'image_path' => 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80',
                'is_best_seller' => true,
            ],
            [
                'category_slug' => 'main-course',
                'name' => 'Rawon Iga Bakar Kluwek Hitam Jawa Timur',
                'slug' => 'rawon-iga-bakar-kluwek-hitam',
                'description' => 'Short ribs Australia dimarinasi kluwek fermentasi kuno, dibakar harum karamel lalu disiram kuah rawon kental pekat bertabur taoge pendek, sambal terasi, & telur asin Masir.',
                'price' => 165000,
                'stock_quantity' => 30,
                'is_available' => true,
                'is_featured' => true,
                'image_path' => 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80',
                'is_best_seller' => true,
            ],
            [
                'category_slug' => 'grill-satay',
                'name' => 'Sate Maranggi Wagyu Sambal Oncom',
                'slug' => 'sate-maranggi-wagyu-sambal-oncom',
                'description' => 'Tusukan sirloin wagyu lembut direndam sari ketumbar sangrai, kecap manis nira aren, dan cuka lahang. Dipanggang medium-well dengan sambal oncom bakar khas Purwakarta.',
                'price' => 140000,
                'stock_quantity' => 20,
                'is_available' => true,
                'is_featured' => true,
                'image_path' => 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
                'is_best_seller' => false,
            ],
            [
                'category_slug' => 'grill-satay',
                'name' => 'Gurame Terbang Sambal Kecombrang',
                'slug' => 'gurame-terbang-sambal-kecombrang',
                'description' => 'Ikan gurame segar goreng garing terbang bertahtakan kelopak bunga kecombrang harum, irisan serai wangi, cabai rawit merah, dan perasan jeruk limau segar.',
                'price' => 155000,
                'stock_quantity' => 15,
                'is_available' => true,
                'is_featured' => false,
                'image_path' => 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
                'is_best_seller' => false,
            ],
            [
                'category_slug' => 'appetizer',
                'name' => 'Kerak Telor Bebek Foie Gras Signature',
                'slug' => 'kerak-telor-bebek-foie-gras',
                'description' => 'Interpretasi modern kuliner Betawi. Ketan putih pulen dan telur bebek omega-3 disangrai wajan cekung tanah liat, dipadukan seared foie gras Prancis dan serundeng ebi aromatik.',
                'price' => 125000,
                'stock_quantity' => 12,
                'is_available' => true,
                'is_featured' => true,
                'image_path' => 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
                'is_best_seller' => false,
            ],
            [
                'category_slug' => 'dessert',
                'name' => 'Cendol Nangka Gelato Madu Hutan',
                'slug' => 'cendol-nangka-gelato-madu-hutan',
                'description' => 'Butiran cendol pandan suji alami disajikan dengan gelato santan panggang, potongan nangka wangi, sirup gula kelapa kristal, dan tuile kelapa renyah bersepuh serbuk emas.',
                'price' => 65000,
                'stock_quantity' => 40,
                'is_available' => true,
                'is_featured' => true,
                'image_path' => 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80',
                'is_best_seller' => true,
            ],
            [
                'category_slug' => 'beverage',
                'name' => 'Es Bir Pletok Keraton Royale',
                'slug' => 'es-bir-pletok-keraton-royale',
                'description' => 'Minuman herbal rempah bangsawan Betawi tanpa alkohol. Rebusan kayu secang merah delima, jahe merah, kapulaga, dan kayu manis disajikan dingin berbusa segar dengan sirup sereh.',
                'price' => 55000,
                'stock_quantity' => 50,
                'is_available' => true,
                'is_featured' => true,
                'image_path' => 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
                'is_best_seller' => true,
            ],
            [
                'category_slug' => 'main-course',
                'name' => 'Gulai Kepala Kakap Merah Belanga',
                'slug' => 'gulai-kepala-kakap-merah-belanga',
                'description' => 'Kepala ikan kakap laut dalam segar dimasak kuah gulai asam pedas khas pesisir Sumatera Barat dengan daun ruku-ruku dan asam kandis yang menyegarkan.',
                'price' => 195000,
                'stock_quantity' => 0, // Habis untuk demonstrasi PRD Section 3.2: Menu habis tetap terlihat tapi redup/disabled
                'is_available' => false,
                'is_featured' => false,
                'image_path' => 'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=800&q=80',
                'is_best_seller' => false,
            ],
        ];

        foreach ($menus as $m) {
            $catId = $categoryIds[$m['category_slug']];
            $menuId = DB::table('menus')->insertGetId([
                'category_id' => $catId,
                'name' => $m['name'],
                'slug' => $m['slug'],
                'description' => $m['description'],
                'price' => $m['price'],
                'stock_quantity' => $m['stock_quantity'],
                'is_available' => $m['is_available'],
                'is_featured' => $m['is_featured'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('menu_images')->insert([
                'menu_id' => $menuId,
                'image_path' => $m['image_path'],
                'is_primary' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 8. Restaurant Tables
        for ($i = 1; $i <= 8; $i++) {
            $tableNum = sprintf('%02d', $i);
            $tableId = DB::table('restaurant_tables')->insertGetId([
                'table_number' => 'Meja ' . $tableNum,
                'capacity' => ($i <= 4) ? 4 : (($i <= 6) ? 2 : 8),
                'location' => ($i <= 6) ? 'Main Dining Hall' : 'VIP Private Room',
                'status' => 'Available',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('table_qr_codes')->insert([
                'table_id' => $tableId,
                'token_hash' => hash('sha256', 'nusara-table-' . $tableNum . '-' . Str::random(16)),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
