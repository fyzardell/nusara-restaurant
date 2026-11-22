<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Perbarui Kategori Inti yang sudah ada
        // Hidangan Pembuka
        DB::table('categories')
            ->where('slug', 'appetizer')
            ->orWhere('name', 'like', '%Appetizer%')
            ->update([
                'name' => 'Hidangan Pembuka',
                'slug' => 'hidangan-pembuka',
                'description' => 'Pembuka selera dengan racikan rempah segar khas pesisir dan pedalaman Nusantara.',
                'is_active' => true,
                'updated_at' => now(),
            ]);

        // Hidangan Utama
        DB::table('categories')
            ->where('slug', 'main-course')
            ->orWhere('name', 'Hidangan Utama')
            ->update([
                'name' => 'Hidangan Utama',
                'slug' => 'hidangan-utama',
                'description' => 'Pusaka rasa Indonesia yang dimasak perlahan dengan bahan baku kualitas premium.',
                'is_active' => true,
                'updated_at' => now(),
            ]);

        // Hidangan Penutup
        DB::table('categories')
            ->where('slug', 'dessert')
            ->orWhere('name', 'like', '%Dessert%')
            ->update([
                'name' => 'Hidangan Penutup',
                'slug' => 'hidangan-penutup',
                'description' => 'Sajian manis warisan leluhur dengan sentuhan tekstur pastry kontemporer.',
                'is_active' => true,
                'updated_at' => now(),
            ]);

        // Minuman
        DB::table('categories')
            ->where('slug', 'beverage')
            ->orWhere('name', 'like', '%Minuman%')
            ->update([
                'name' => 'Minuman',
                'slug' => 'minuman',
                'description' => 'Jamu keraton, infused tea rempah, dan kopi single origin Nusantara.',
                'is_active' => true,
                'updated_at' => now(),
            ]);

        // 2. Tambahkan Kategori Baru: Khas Aceh, Khas Sunda, Khas Jawa
        $regionalCategories = [
            [
                'name' => 'Khas Aceh',
                'slug' => 'khas-aceh',
                'description' => 'Kekayaan rempah Serambi Mekkah dengan limpahan kari beraroma kapulaga, jintan, dan daun temurui segar.',
            ],
            [
                'name' => 'Khas Sunda',
                'slug' => 'khas-sunda',
                'description' => 'Kesegaran lalapan bumi Tatar Parahyangan, nasi liwet kastrol gurih, serta sambal oncom bakar aromatik.',
            ],
            [
                'name' => 'Khas Jawa',
                'slug' => 'khas-jawa',
                'description' => 'Cita rasa manis gurih legendaris pusaka keraton Jawa dari nangka muda gudeg hingga kuah kluwek hitam.',
            ],
        ];

        foreach ($regionalCategories as $rc) {
            $existing = DB::table('categories')->where('slug', $rc['slug'])->first();
            if (!$existing) {
                DB::table('categories')->insert([
                    'name' => $rc['name'],
                    'slug' => $rc['slug'],
                    'description' => $rc['description'],
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                DB::table('categories')->where('id', $existing->id)->update([
                    'name' => $rc['name'],
                    'description' => $rc['description'],
                    'is_active' => true,
                    'updated_at' => now(),
                ]);
            }
        }

        // Ambil ID Kategori
        $catIds = DB::table('categories')->pluck('id', 'slug')->toArray();

        // 3. Alihkan menu dari Warisan Bakaran ke kategori yang sesuai sebelum menonaktifkan kategorinya
        $bakaranCat = DB::table('categories')->where('slug', 'grill-satay')->first();
        if ($bakaranCat) {
            // Sate Maranggi -> Khas Sunda
            if (isset($catIds['khas-sunda'])) {
                DB::table('menus')->where('slug', 'sate-maranggi-wagyu-sambal-oncom')->update([
                    'category_id' => $catIds['khas-sunda'],
                ]);
            }

            // Sate Lilit, Iga Sapi Bakar Sumbawa, Gurame Terbang -> Hidangan Utama
            if (isset($catIds['hidangan-utama'])) {
                DB::table('menus')
                    ->whereIn('slug', [
                        'sate-lilit-ikan-tenggiri-batang-serai',
                        'iga-sapi-bakar-madu-hutan-sumbawa',
                        'gurame-terbang-sambal-kecombrang'
                    ])
                    ->update([
                        'category_id' => $catIds['hidangan-utama'],
                    ]);
            }

            // Nonaktifkan kategori Warisan Bakaran agar hanya 7 kategori utama yang aktif
            DB::table('categories')->where('id', $bakaranCat->id)->update([
                'is_active' => false,
            ]);
        }

        // Bersihkan menu versi lama yang duplikat konsep dengan 3 menu regional baru
        DB::table('menus')->whereIn('slug', [
            'ayam-tangkap-rempah-daun-kari-aceh',
            'sate-maranggi-wagyu-sambal-oncom',
            'rawon-iga-bakar-kluwek-hitam'
        ])->delete();

        // 4. Pastikan 3 Menu Khas Aceh, 3 Menu Khas Sunda, dan 3 Menu Khas Jawa Lengkap
        $menusToAddOrUpdate = [
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
            ],
        ];

        foreach ($menusToAddOrUpdate as $menuData) {
            $catId = $catIds[$menuData['category_slug']] ?? null;
            if (!$catId) continue;

            $existingMenu = DB::table('menus')->where('slug', $menuData['slug'])->first();

            if ($existingMenu) {
                DB::table('menus')->where('id', $existingMenu->id)->update([
                    'category_id' => $catId,
                    'name' => $menuData['name'],
                    'description' => $menuData['description'],
                    'price' => $menuData['price'],
                    'stock_quantity' => $menuData['stock_quantity'],
                    'is_available' => $menuData['is_available'],
                    'is_featured' => $menuData['is_featured'],
                    'updated_at' => now(),
                ]);
                $menuId = $existingMenu->id;
            } else {
                $menuId = DB::table('menus')->insertGetId([
                    'category_id' => $catId,
                    'name' => $menuData['name'],
                    'slug' => $menuData['slug'],
                    'description' => $menuData['description'],
                    'price' => $menuData['price'],
                    'stock_quantity' => $menuData['stock_quantity'],
                    'is_available' => $menuData['is_available'],
                    'is_featured' => $menuData['is_featured'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Pastikan gambar primer ada di menu_images
            $existingImg = DB::table('menu_images')
                ->where('menu_id', $menuId)
                ->where('is_primary', true)
                ->first();

            if ($existingImg) {
                DB::table('menu_images')->where('id', $existingImg->id)->update([
                    'image_path' => $menuData['image_path'],
                    'updated_at' => now(),
                ]);
            } else {
                DB::table('menu_images')->insert([
                    'menu_id' => $menuId,
                    'image_path' => $menuData['image_path'],
                    'is_primary' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reversible jika diperlukan
    }
};
