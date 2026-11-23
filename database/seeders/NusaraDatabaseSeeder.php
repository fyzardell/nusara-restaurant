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
            $existing = DB::table('roles')->where('name', $role['name'])->first();
            if ($existing) {
                $roleIds[$role['name']] = $existing->id;
            } else {
                $id = DB::table('roles')->insertGetId([
                    'name' => $role['name'],
                    'description' => $role['description'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $roleIds[$role['name']] = $id;
            }
        }

        // 2. Users
        $password = Hash::make('password123');

        $admin = DB::table('users')->where('email', 'admin@nusara.id')->first();
        $adminId = $admin ? $admin->id : DB::table('users')->insertGetId([
            'role_id' => $roleIds['admin'],
            'name' => 'Raden Mas Haryo (Admin)',
            'email' => 'admin@nusara.id',
            'password' => $password,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $cashier = DB::table('users')->where('email', 'cashier@nusara.id')->first();
        $cashierId = $cashier ? $cashier->id : DB::table('users')->insertGetId([
            'role_id' => $roleIds['cashier'],
            'name' => 'Dewi Anggraini (Kasir)',
            'email' => 'cashier@nusara.id',
            'password' => $password,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $waiter = DB::table('users')->where('email', 'waiter@nusara.id')->first();
        $waiterId = $waiter ? $waiter->id : DB::table('users')->insertGetId([
            'role_id' => $roleIds['waiter'],
            'name' => 'Bagus Wicaksono (Waiter)',
            'email' => 'waiter@nusara.id',
            'password' => $password,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $customer = DB::table('users')->where('email', 'pelanggan@nusara.id')->first();
        $customerId = $customer ? $customer->id : DB::table('users')->insertGetId([
            'role_id' => $roleIds['customer'],
            'name' => 'Anindya Laksmi',
            'email' => 'pelanggan@nusara.id',
            'password' => $password,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Customer profile
        $custProfile = DB::table('customers')->where('user_id', $customerId)->first();
        if (!$custProfile) {
            DB::table('customers')->insert([
                'user_id' => $customerId,
                'name' => 'Anindya Laksmi',
                'phone_normalized' => '+6281234567890',
                'email' => 'pelanggan@nusara.id',
                'phone_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 3. Restaurant Settings
        $settingExists = DB::table('restaurant_settings')->first();
        if (!$settingExists) {
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
        }

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

        // Deduplicate operating_hours: keep the first ID for each day_of_week, delete the rest
        $allOh = DB::table('operating_hours')->orderBy('id', 'asc')->get();
        $keptDays = [];
        foreach ($allOh as $oh) {
            if (in_array($oh->day_of_week, $keptDays)) {
                DB::table('operating_hours')->where('id', $oh->id)->delete();
            } else {
                $keptDays[] = $oh->day_of_week;
            }
        }

        foreach ($days as $d) {
            $existing = DB::table('operating_hours')->where('day_of_week', $d['day'])->first();
            if ($existing) {
                DB::table('operating_hours')->where('id', $existing->id)->update([
                    'day_name' => $d['name'],
                    'open_time' => $d['open'],
                    'close_time' => $d['close'],
                    'is_closed' => $d['closed'],
                    'updated_at' => now(),
                ]);
            } else {
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
            DB::table('dining_experiences')->updateOrInsert(
                ['slug' => $exp['slug']],
                array_merge($exp, [
                    'updated_at' => now(),
                ])
            );
        }

        // 6. Categories
        $categories = [
            ['name' => 'Hidangan Pembuka', 'slug' => 'hidangan-pembuka', 'description' => 'Pembuka selera dengan racikan rempah segar khas pesisir dan pedalaman Nusantara.'],
            ['name' => 'Hidangan Utama', 'slug' => 'hidangan-utama', 'description' => 'Pusaka rasa Indonesia yang dimasak perlahan dengan bahan baku kualitas premium.'],
            ['name' => 'Hidangan Penutup', 'slug' => 'hidangan-penutup', 'description' => 'Sajian manis warisan leluhur dengan sentuhan tekstur pastry kontemporer.'],
            ['name' => 'Minuman', 'slug' => 'minuman', 'description' => 'Jamu keraton, infused tea rempah, dan kopi single origin Nusantara.'],
            ['name' => 'Khas Aceh', 'slug' => 'khas-aceh', 'description' => 'Kekayaan rempah Serambi Mekkah dengan limpahan kari beraroma kapulaga, jintan, dan daun temurui segar.'],
            ['name' => 'Khas Sunda', 'slug' => 'khas-sunda', 'description' => 'Kesegaran lalapan bumi Tatar Parahyangan, nasi liwet kastrol gurih, serta sambal oncom bakar aromatik.'],
            ['name' => 'Khas Jawa', 'slug' => 'khas-jawa', 'description' => 'Cita rasa manis gurih legendaris pusaka keraton Jawa dari nangka muda gudeg hingga kuah kluwek hitam.'],
        ];

        $categoryIds = [];
        foreach ($categories as $cat) {
            $existing = DB::table('categories')->where('slug', $cat['slug'])->first();
            if ($existing) {
                DB::table('categories')->where('id', $existing->id)->update([
                    'name' => $cat['name'],
                    'description' => $cat['description'],
                    'is_active' => true,
                    'updated_at' => now(),
                ]);
                $categoryIds[$cat['slug']] = $existing->id;
            } else {
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
        }

        // 7. Menus
        $menus = [
            // HIDANGAN PEMBUKA
            [
                'category_slug' => 'hidangan-pembuka',
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
                'category_slug' => 'hidangan-pembuka',
                'name' => 'Lumpia Basah Semarang Rebung Udang Galah',
                'slug' => 'lumpia-basah-semarang-rebung-udang',
                'description' => 'Kulit lumpia lembut buatan tangan membungkus tumisan rebung muda renyah, udang galah cincang, telur orak-arik, dan saus gula aren kental bertabur daun kucai segar.',
                'price' => 75000,
                'stock_quantity' => 30,
                'is_available' => true,
                'is_featured' => false,
                'image_path' => 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
                'is_best_seller' => false,
            ],
            [
                'category_slug' => 'hidangan-pembuka',
                'name' => 'Gado-Gado Siram Senopati Cashew Emulsion',
                'slug' => 'gado-gado-siram-senopati-cashew',
                'description' => 'Sayuran organik segar kukus (kacang panjang, bayam, labu siam) dipadu tahu tempe bacem, lontong daun pisang, dan siraman saus kacang mede panggang bertekstur beludru.',
                'price' => 85000,
                'stock_quantity' => 20,
                'is_available' => true,
                'is_featured' => true,
                'image_path' => 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
                'is_best_seller' => false,
            ],

            // HIDANGAN UTAMA
            [
                'category_slug' => 'hidangan-utama',
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
                'category_slug' => 'hidangan-utama',
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
                'category_slug' => 'hidangan-utama',
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
                'category_slug' => 'hidangan-utama',
                'name' => 'Gulai Kepala Kakap Merah Belanga',
                'slug' => 'gulai-kepala-kakap-merah-belanga',
                'description' => 'Kepala ikan kakap laut dalam segar dimasak kuah gulai asam pedas khas pesisir Sumatera Barat dengan daun ruku-ruku dan asam kandis yang menyegarkan.',
                'price' => 195000,
                'stock_quantity' => 0,
                'is_available' => false,
                'is_featured' => false,
                'image_path' => 'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=800&q=80',
                'is_best_seller' => false,
            ],
            [
                'category_slug' => 'hidangan-utama',
                'name' => 'Sop Buntut Bakar Rempah Pala',
                'slug' => 'sop-buntut-bakar-rempah-pala',
                'description' => 'Buntut sapi impor pilihan direbus perlahan bersama pala Banda dan cengkih Ambon, lalu dibakar di atas bara arang kayu kopi. Disajikan bersama kuah kaldu rempah bening gurih bertabur daun bawang dan emping Melinjo.',
                'price' => 175000,
                'stock_quantity' => 20,
                'is_available' => true,
                'is_featured' => true,
                'image_path' => 'https://images.unsplash.com/photo-1547928576-a4a33237cbc3?auto=format&fit=crop&w=800&q=80',
                'is_best_seller' => true,
            ],
            [
                'category_slug' => 'hidangan-utama',
                'name' => 'Nasi Ulam Komplit Bunga Telang & Dendeng Batokok',
                'slug' => 'nasi-ulam-komplit-bunga-telang',
                'description' => 'Nasi pulen wangi dimasak dengan ekstrak bunga telang alami bergradasi indigo, disajikan dengan dendeng sapi batokok cabai hijau bakar, serundeng lengkuas, sambal terasi kecombrang, dan telur pindang herba.',
                'price' => 135000,
                'stock_quantity' => 25,
                'is_available' => true,
                'is_featured' => true,
                'image_path' => 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
                'is_best_seller' => false,
            ],
            [
                'category_slug' => 'hidangan-utama',
                'name' => 'Sate Lilit Ikan Tenggiri Batang Serai Bali',
                'slug' => 'sate-lilit-ikan-tenggiri-batang-serai',
                'description' => 'Cincangan daging ikan tenggiri segar dipadukan kelapa parut bakar dan bumbu base genep Bali, dililitkan pada batang serai wangi alami lalu dipanggang bara api kelapa.',
                'price' => 110000,
                'stock_quantity' => 22,
                'is_available' => true,
                'is_featured' => true,
                'image_path' => '/images/menus/sate-lilit.jpg',
                'is_best_seller' => false,
            ],
            [
                'category_slug' => 'hidangan-utama',
                'name' => 'Iga Sapi Bakar Madu Hutan Sumbawa',
                'slug' => 'iga-sapi-bakar-madu-hutan-sumbawa',
                'description' => 'Iga sapi premium ungkep bumbu ketumbar jintan, dipanggang karamel dengan olesan madu hutan Sumbawa murni dan perasan jeruk limau segar. Disajikan dengan sambal dabu-dabu segar.',
                'price' => 195000,
                'stock_quantity' => 15,
                'is_available' => true,
                'is_featured' => true,
                'image_path' => 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
                'is_best_seller' => true,
            ],

            // HIDANGAN PENUTUP
            [
                'category_slug' => 'hidangan-penutup',
                'name' => 'Cendol Nangka Gelato Madu Hutan',
                'slug' => 'cendol-nangka-gelato-madu-hutan',
                'description' => 'Butiran cendol pandan suji alami disajikan dengan gelato santan panggang, potongan nangka wangi, sirup gula kelapa kristal, dan tuile kelapa renyah bersepuh serbuk emas.',
                'price' => 65000,
                'stock_quantity' => 40,
                'is_available' => true,
                'is_featured' => true,
                'image_path' => '/images/menus/cendol-nangka.jpg',
                'is_best_seller' => true,
            ],
            [
                'category_slug' => 'hidangan-penutup',
                'name' => 'Klappertaart Panggang Kenari Kayu Manis',
                'slug' => 'klappertaart-panggang-kenari-kayu-manis',
                'description' => 'Kudapan manis klasik perpaduan kelapa muda lembut, kismis anggur, kenari panggang gurih, dan taburan kayu manis harum beralas custard susu vanila lembut.',
                'price' => 68000,
                'stock_quantity' => 24,
                'is_available' => true,
                'is_featured' => false,
                'image_path' => '/images/menus/klappertaart.jpg',
                'is_best_seller' => false,
            ],
            [
                'category_slug' => 'hidangan-penutup',
                'name' => 'Ketan Hitam Mangga Arumanis Santan Kental',
                'slug' => 'ketan-hitam-mangga-arumanis-santan',
                'description' => 'Ketan hitam organik pulen gurih disajikan bersama potongan mangga Arumanis manis ranum, kuah santan kelapa tua gurih beraroma pandan, dan biji wijen sangrai.',
                'price' => 58000,
                'stock_quantity' => 28,
                'is_available' => true,
                'is_featured' => true,
                'image_path' => '/images/menus/ketan-hitam.jpg',
                'is_best_seller' => false,
            ],

            // MINUMAN
            [
                'category_slug' => 'minuman',
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
                'category_slug' => 'minuman',
                'name' => 'Wedang Uwuh Imogiri Rempah Wangi',
                'slug' => 'wedang-uwuh-imogiri-rempah-wangi',
                'description' => 'Minuman seduhan hangat pusaka keraton Yogyakarta: kayu secang merah delima, cengkih, daun pala, jahe emprit bakar geprek, dan gula batu kristal tebu murni.',
                'price' => 45000,
                'stock_quantity' => 40,
                'is_available' => true,
                'is_featured' => false,
                'image_path' => 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
                'is_best_seller' => false,
            ],
            [
                'category_slug' => 'minuman',
                'name' => 'Kopi Tubruk Robusta Dampit Aren Bakar',
                'slug' => 'kopi-tubruk-robusta-dampit-aren-bakar',
                'description' => 'Kopi single origin Robusta lereng Semeru Dampit diseduh suhu 93°C dengan karakter tebal cokelat tanah, berpadu nira aren bakar harum dan krim kelapa gurih.',
                'price' => 48000,
                'stock_quantity' => 35,
                'is_available' => true,
                'is_featured' => true,
                'image_path' => 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
                'is_best_seller' => false,
            ],

            // KHAS ACEH (3 MENU)
            [
                'category_slug' => 'khas-aceh',
                'name' => 'Mie Aceh Wagyu Kepiting Soka Rempah',
                'slug' => 'mie-aceh-wagyu-kepiting-soka',
                'description' => 'Mie kuning tebal berpadu potongan Wagyu empuk dan kepiting soka renyah garing, ditumis dalam racikan 16 rempah kari pedas gurih pekat beraroma kapulaga dan jintan. Disajikan bersama emping Melinjo, acar bawang merah, dan irisan jeruk nipis segar.',
                'price' => 135000,
                'stock_quantity' => 25,
                'is_available' => true,
                'is_featured' => true,
                'image_path' => 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
                'is_best_seller' => true,
            ],
            [
                'category_slug' => 'khas-aceh',
                'name' => 'Ayam Tangkap Serambi Rempah Daun Temurui',
                'slug' => 'ayam-tangkap-serambi-rempah-daun-temurui',
                'description' => 'Ayam kampung muda dimarinasi 14 rempah rahasia Kesultanan Aceh, digoreng garing renyah berselimut limpahan daun kari (temurui), daun pandan wangi, bawang merah, dan cabai hijau renyah gurih aromatik.',
                'price' => 128000,
                'stock_quantity' => 20,
                'is_available' => true,
                'is_featured' => true,
                'image_path' => 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
                'is_best_seller' => false,
            ],
            [
                'category_slug' => 'khas-aceh',
                'name' => 'Kuah Beulangong Daging Sapi & Nangka Muda',
                'slug' => 'kuah-beulangong-daging-sapi-nangka',
                'description' => 'Gulai daging sapi empuk dan nangka muda pusaka tradisi kenduri Aceh Besar, dimasak perlahan dalam kuali belanga tembaga dengan kelapa gongseng sangrai, kelapa kukur, dan cabai kering aromatik berkarakter kuah gurih pekat kaya rasa.',
                'price' => 145000,
                'stock_quantity' => 18,
                'is_available' => true,
                'is_featured' => false,
                'image_path' => 'https://images.unsplash.com/photo-1547928576-a4a33237cbc3?auto=format&fit=crop&w=800&q=80',
                'is_best_seller' => false,
            ],

            // KHAS SUNDA (3 MENU)
            [
                'category_slug' => 'khas-sunda',
                'name' => 'Nasi Liwet Kastrol Parahyangan Gurih Komplit',
                'slug' => 'nasi-liwet-kastrol-parahyangan-gurih',
                'description' => 'Nasi liwet harum aromatik beras Cianjur dimasak kaldu teri medan, serai, daun salam, dan cabai rawit utuh di dalam kastrol tembaga. Dilengkapi ayam goreng lengkuas, tahu tempe bacem, lalapan segar, dan sambal dadak terasi bakar.',
                'price' => 130000,
                'stock_quantity' => 25,
                'is_available' => true,
                'is_featured' => true,
                'image_path' => 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
                'is_best_seller' => true,
            ],
            [
                'category_slug' => 'khas-sunda',
                'name' => 'Sate Maranggi Sirloin Sambal Oncom Purwakarta',
                'slug' => 'sate-maranggi-sirloin-sambal-oncom',
                'description' => 'Tusukan daging sirloin sapi empuk dimarinasi ketumbar sangrai, kecap manis nira aren, dan cuka lahang alami. Dipanggang arang batok kelapa disajikan dengan sambal oncom bakar khas Purwakarta, potongan tomat segar, dan ketan bakar gurih.',
                'price' => 140000,
                'stock_quantity' => 22,
                'is_available' => true,
                'is_featured' => true,
                'image_path' => 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
                'is_best_seller' => false,
            ],
            [
                'category_slug' => 'khas-sunda',
                'name' => 'Karedok Sayur Organik Saus Kacang Mede Sangrai',
                'slug' => 'karedok-sayur-organik-saus-kacang-mede',
                'description' => 'Irisan sayuran segar mentah renyah (kacang panjang, terong bulat ungu, mentimun, tauge, kol, daun kemangi) diulek dadakan dengan pasta kacang mede sangrai halus, kencur wangi Parahyangan, terasi bakar, dan gula aren semut.',
                'price' => 68000,
                'stock_quantity' => 30,
                'is_available' => true,
                'is_featured' => false,
                'image_path' => 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
                'is_best_seller' => false,
            ],

            // KHAS JAWA (3 MENU)
            [
                'category_slug' => 'khas-jawa',
                'name' => 'Gudeg Yu Djogja Keraton Telur Bebek & Krecek Mercon',
                'slug' => 'gudeg-yu-djogja-keraton-krecek',
                'description' => 'Nangka muda dimasak perlahan 24 jam dengan daun jati, gula kelapa Kulon Progo, dan santan kental gurih legit. Disajikan bersama suwiran ayam kampung opor, telur bebek pindang cokelat karamel, areh gurih, dan sambal krecek kulit sapi pedas gurih.',
                'price' => 125000,
                'stock_quantity' => 25,
                'is_available' => true,
                'is_featured' => true,
                'image_path' => 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
                'is_best_seller' => true,
            ],
            [
                'category_slug' => 'khas-jawa',
                'name' => 'Rawon Iga Sapi Bakar Kluwek Hitam Jawa Timur',
                'slug' => 'rawon-iga-sapi-bakar-kluwek-hitam-jawa',
                'description' => 'Short ribs Australia dimarinasi kluwek fermentasi kuno lereng Bromo, dibakar harum karamel lalu disiram kuah rawon kental pekat bertabur taoge pendek segar, sambal terasi teratai, telur asin masir Brebes, dan kerupuk udang.',
                'price' => 165000,
                'stock_quantity' => 28,
                'is_available' => true,
                'is_featured' => true,
                'image_path' => 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80',
                'is_best_seller' => true,
            ],
            [
                'category_slug' => 'khas-jawa',
                'name' => 'Tahu Gimbal Udang Galah Semarang Petis Kental',
                'slug' => 'tahu-gimbal-udang-galah-semarang',
                'description' => 'Tahu sutra goreng garing dipadukan gimbal bakwan udang galah renyah gurih, irisan kol putih segar, lontong daun pisang, dan telur mata sapi, disiram saus kacang petis udang khas pesisir utara Semarang yang manis gurih bertabur bawang merah goreng.',
                'price' => 85000,
                'stock_quantity' => 30,
                'is_available' => true,
                'is_featured' => false,
                'image_path' => 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
                'is_best_seller' => false,
            ],
        ];

        foreach ($menus as $m) {
            $catId = $categoryIds[$m['category_slug']];
            $existing = DB::table('menus')->where('slug', $m['slug'])->first();
            if ($existing) {
                $menuId = $existing->id;
                DB::table('menus')->where('id', $menuId)->update([
                    'category_id' => $catId,
                    'name' => $m['name'],
                    'description' => $m['description'],
                    'price' => $m['price'],
                    'stock_quantity' => $m['stock_quantity'],
                    'is_available' => $m['is_available'],
                    'is_featured' => $m['is_featured'],
                    'updated_at' => now(),
                ]);
            } else {
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
        }

        // 8. Restaurant Tables
        for ($i = 1; $i <= 8; $i++) {
            $tableNum = 'Meja ' . sprintf('%02d', $i);
            $existingTable = DB::table('restaurant_tables')->where('table_number', $tableNum)->first();
            if (!$existingTable) {
                $tableId = DB::table('restaurant_tables')->insertGetId([
                    'table_number' => $tableNum,
                    'capacity' => ($i <= 4) ? 4 : (($i <= 6) ? 2 : 8),
                    'location' => ($i <= 6) ? 'Main Dining Hall' : 'VIP Private Room',
                    'status' => 'Available',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                DB::table('table_qr_codes')->insert([
                    'table_id' => $tableId,
                    'token_hash' => hash('sha256', 'nusara-table-' . sprintf('%02d', $i) . '-' . Str::random(16)),
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
