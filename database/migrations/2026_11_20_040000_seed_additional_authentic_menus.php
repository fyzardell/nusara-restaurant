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
        $categories = DB::table('categories')->pluck('id', 'slug')->toArray();

        $additionalMenus = [
            [
                'category_slug' => 'main-course',
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
                'category_slug' => 'main-course',
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
                'category_slug' => 'main-course',
                'name' => 'Ayam Tangkap Rempah Daun Kari Aceh',
                'slug' => 'ayam-tangkap-rempah-daun-kari-aceh',
                'description' => 'Ayam kampung muda dimarinasi 14 rempah tanah Rencong, digoreng renyah bertabur limpahan daun kari segar, daun pandan wangi, dan cabai hijau renyah gurih aromatik.',
                'price' => 128000,
                'stock_quantity' => 18,
                'is_available' => true,
                'is_featured' => false,
                'image_path' => 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
                'is_best_seller' => false,
            ],
            [
                'category_slug' => 'grill-satay',
                'name' => 'Sate Lilit Ikan Tenggiri Batang Serai Bali',
                'slug' => 'sate-lilit-ikan-tenggiri-batang-serai',
                'description' => 'Cincangan daging ikan tenggiri segar dipadukan kelapa parut bakar dan bumbu base genep Bali, dililitkan pada batang serai wangi alami lalu dipanggang bara api kelapa.',
                'price' => 110000,
                'stock_quantity' => 22,
                'is_available' => true,
                'is_featured' => true,
                'image_path' => 'https://images.unsplash.com/photo-1529563021893-cc83c914d73e?auto=format&fit=crop&w=800&q=80',
                'is_best_seller' => false,
            ],
            [
                'category_slug' => 'grill-satay',
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
            [
                'category_slug' => 'appetizer',
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
                'category_slug' => 'appetizer',
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
            [
                'category_slug' => 'dessert',
                'name' => 'Klappertaart Panggang Kenari Kayu Manis',
                'slug' => 'klappertaart-panggang-kenari-kayu-manis',
                'description' => 'Kudapan manis klasik perpaduan kelapa muda lembut, kismis anggur, kenari panggang gurih, dan taburan kayu manis harum beralas custard susu vanila lembut.',
                'price' => 68000,
                'stock_quantity' => 24,
                'is_available' => true,
                'is_featured' => false,
                'image_path' => 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
                'is_best_seller' => false,
            ],
            [
                'category_slug' => 'dessert',
                'name' => 'Ketan Hitam Mangga Arumanis Santan Kental',
                'slug' => 'ketan-hitam-mangga-arumanis-santan',
                'description' => 'Ketan hitam organik pulen gurih disajikan bersama potongan mangga Arumanis manis ranum, kuah santan kelapa tua gurih beraroma pandan, dan biji wijen sangrai.',
                'price' => 58000,
                'stock_quantity' => 28,
                'is_available' => true,
                'is_featured' => true,
                'image_path' => 'https://images.unsplash.com/photo-1621236378699-8597fee6a1ce?auto=format&fit=crop&w=800&q=80',
                'is_best_seller' => false,
            ],
            [
                'category_slug' => 'beverage',
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
                'category_slug' => 'beverage',
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
        ];

        foreach ($additionalMenus as $m) {
            $catId = $categories[$m['category_slug']] ?? null;
            if (!$catId) continue;

            $existing = DB::table('menus')->where('slug', $m['slug'])->first();
            if ($existing) continue;

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

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $slugs = [
            'sop-buntut-bakar-rempah-pala',
            'nasi-ulam-komplit-bunga-telang',
            'ayam-tangkap-rempah-daun-kari-aceh',
            'sate-lilit-ikan-tenggiri-batang-serai',
            'iga-sapi-bakar-madu-hutan-sumbawa',
            'lumpia-basah-semarang-rebung-udang',
            'gado-gado-siram-senopati-cashew',
            'klappertaart-panggang-kenari-kayu-manis',
            'ketan-hitam-mangga-arumanis-santan',
            'wedang-uwuh-imogiri-rempah-wangi',
            'kopi-tubruk-robusta-dampit-aren-bakar',
        ];

        $menuIds = DB::table('menus')->whereIn('slug', $slugs)->pluck('id');
        DB::table('menu_images')->whereIn('menu_id', $menuIds)->delete();
        DB::table('menus')->whereIn('id', $menuIds)->delete();
    }
};
