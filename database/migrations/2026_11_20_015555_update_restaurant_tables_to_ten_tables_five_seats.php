<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add customer_name and table_number to orders table if not present
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'customer_name')) {
                $table->string('customer_name')->nullable()->after('customer_id');
            }
            if (!Schema::hasColumn('orders', 'table_number')) {
                $table->string('table_number')->nullable()->after('table_session_id');
            }
        });

        // 2. Synchronize 10 Restaurant Tables with 5 seats each (Meja 01 s/d Meja 10)
        for ($i = 1; $i <= 10; $i++) {
            $tableNum = sprintf('Meja %02d', $i);
            $existing = DB::table('restaurant_tables')->where('table_number', $tableNum)->first();

            if ($existing) {
                DB::table('restaurant_tables')->where('id', $existing->id)->update([
                    'capacity' => 5,
                    'location' => 'Main Dining Hall',
                    'is_active' => true,
                    'status' => 'Available',
                    'updated_at' => now(),
                ]);
                $tableId = $existing->id;
            } else {
                $tableId = DB::table('restaurant_tables')->insertGetId([
                    'table_number' => $tableNum,
                    'capacity' => 5,
                    'location' => 'Main Dining Hall',
                    'status' => 'Available',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Ensure QR Code record exists
            $hasQr = DB::table('table_qr_codes')->where('table_id', $tableId)->first();
            if (!$hasQr) {
                DB::table('table_qr_codes')->insert([
                    'table_id' => $tableId,
                    'token_hash' => hash('sha256', 'nusara-table-' . sprintf('%02d', $i) . '-' . Str::random(16)),
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // Deactivate any table numbers above Meja 10 if they exist
        DB::table('restaurant_tables')
            ->whereNotIn('table_number', [
                'Meja 01', 'Meja 02', 'Meja 03', 'Meja 04', 'Meja 05',
                'Meja 06', 'Meja 07', 'Meja 08', 'Meja 09', 'Meja 10'
            ])
            ->update(['is_active' => false]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'customer_name')) {
                $table->dropColumn('customer_name');
            }
            if (Schema::hasColumn('orders', 'table_number')) {
                $table->dropColumn('table_number');
            }
        });
    }
};
