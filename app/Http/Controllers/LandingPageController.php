<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LandingPageController extends Controller
{
    public function index(Request $request)
    {
        $settings = DB::table('restaurant_settings')->first();
        if ($settings && isset($settings->social_links)) {
            $settings->social_links = json_decode($settings->social_links, true);
        }

        $categories = DB::table('categories')
            ->where('is_active', true)
            ->orderByRaw("FIELD(slug, 'hidangan-pembuka', 'hidangan-utama', 'hidangan-penutup', 'minuman', 'khas-aceh', 'khas-sunda', 'khas-jawa')")
            ->get();

        $menus = DB::table('menus')
            ->join('categories', 'menus.category_id', '=', 'categories.id')
            ->leftJoin('menu_images', function ($join) {
                $join->on('menus.id', '=', 'menu_images.menu_id')
                    ->where('menu_images.is_primary', true);
            })
            ->whereNull('menus.deleted_at')
            ->select(
                'menus.id',
                'menus.category_id',
                'categories.slug as category_slug',
                'categories.name as category_name',
                'menus.name',
                'menus.slug',
                'menus.description',
                'menus.price',
                'menus.stock_quantity',
                'menus.is_available',
                'menus.is_featured',
                'menu_images.image_path'
            )
            ->get()
            ->map(function ($menu) {
                // Hardcoded best seller flag demonstration according to PRD section 3.2 & 9
                $menu->is_best_seller = in_array($menu->slug, [
                    'rendang-wagyu-tokusen-48-jam',
                    'bebek-betutu-gianyar-asap-bambu',
                    'rawon-iga-sapi-bakar-kluwek-hitam-jawa',
                    'cendol-nangka-gelato-madu-hutan',
                    'es-bir-pletok-keraton-royale',
                    'sop-buntut-bakar-rempah-pala',
                    'iga-sapi-bakar-madu-hutan-sumbawa',
                    'mie-aceh-wagyu-kepiting-soka',
                    'nasi-liwet-kastrol-parahyangan-gurih',
                    'gudeg-yu-djogja-keraton-krecek'
                ]);
                return $menu;
            });

        $experiences = DB::table('dining_experiences')
            ->where('is_available', true)
            ->get();

        $rawOperatingHours = DB::table('operating_hours')
            ->orderByRaw("CASE WHEN day_of_week = 0 THEN 7 ELSE day_of_week END")
            ->orderBy('id', 'asc')
            ->get();

        $operatingHours = $rawOperatingHours->unique('day_of_week')->values();

        return Inertia::render('LandingPage', [
            'settings' => $settings,
            'categories' => $categories,
            'menus' => $menus,
            'experiences' => $experiences,
            'operatingHours' => $operatingHours,
            'auth' => [
                'user' => $request->user(),
            ],
        ]);
    }
}
