<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Change sender_type from enum to string to support 'customer', 'admin', 'waiter', 'cashier'
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->string('sender_type', 30)->default('customer')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to enum
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->enum('sender_type', ['customer', 'admin'])->default('customer')->change();
        });
    }
};
