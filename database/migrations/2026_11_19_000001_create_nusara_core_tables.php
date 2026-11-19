<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Roles
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // Update Users table for role_id & is_active
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('role_id')->nullable()->after('id')->constrained('roles')->nullOnDelete();
            $table->boolean('is_active')->default(true)->after('password');
        });

        // 2. Customers
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->unique()->constrained('users')->nullOnDelete();
            $table->string('name');
            $table->string('phone_normalized')->unique();
            $table->string('email')->nullable();
            $table->timestamp('phone_verified_at')->nullable();
            $table->timestamps();
        });

        // 3. Categories
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 4. Menus & Menu Images
        Schema::create('menus', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->decimal('price', 12, 2);
            $table->integer('stock_quantity')->default(0);
            $table->boolean('is_available')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('menu_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_id')->constrained('menus')->cascadeOnDelete();
            $table->string('image_path');
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
        });

        // 5. Dining Experiences
        Schema::create('dining_experiences', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description');
            $table->integer('duration_minutes')->default(120);
            $table->decimal('price_per_person', 12, 2)->nullable();
            $table->string('image_url')->nullable();
            $table->boolean('is_available')->default(true);
            $table->timestamps();
        });

        // 6. Restaurant Tables, Table QR Codes, Table Sessions
        Schema::create('restaurant_tables', function (Blueprint $table) {
            $table->id();
            $table->string('table_number')->unique();
            $table->integer('capacity');
            $table->string('location')->default('Indoor Main Hall');
            $table->string('status')->default('Available'); // Available, Occupied, Reserved, Cleaning, Inactive
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('table_qr_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('table_id')->constrained('restaurant_tables')->cascadeOnDelete();
            $table->string('token_hash')->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('table_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('table_id')->constrained('restaurant_tables')->cascadeOnDelete();
            $table->string('session_code')->unique();
            $table->string('status')->default('Pending Validation'); // Pending Validation, Open, Closed
            $table->foreignId('opened_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('closed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();
        });

        // 7. Orders & Order Items
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_code')->unique();
            $table->string('access_token_hash')->nullable();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->foreignId('table_session_id')->nullable()->constrained('table_sessions')->nullOnDelete();
            $table->string('order_type'); // dine_in, takeaway
            $table->string('order_status')->default('Awaiting Payment'); 
            // Awaiting Payment, Paid, Confirmed, Preparing, Ready, Served, Picked Up, Cancelled
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('tax', 12, 2)->default(0);
            $table->decimal('discount', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->text('customer_notes')->nullable();
            $table->timestamp('pickup_time')->nullable();
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('menu_id')->nullable()->constrained('menus')->nullOnDelete();
            $table->string('menu_name_snapshot');
            $table->decimal('unit_price_snapshot', 12, 2);
            $table->integer('quantity');
            $table->decimal('subtotal', 12, 2);
            $table->text('item_notes')->nullable();
            $table->timestamps();
        });

        Schema::create('order_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('previous_status')->nullable();
            $table->string('new_status');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 8. Payments, Transactions & Refunds
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->string('payment_method'); // qris, bank_transfer, cash
            $table->string('payment_status')->default('Pending'); 
            // Pending, Paid, Failed, Expired, Cancelled, Refund Pending, Refunded
            $table->decimal('amount', 12, 2);
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained('payments')->cascadeOnDelete();
            $table->string('provider')->default('midtrans');
            $table->string('provider_transaction_id')->nullable();
            $table->string('transaction_status')->default('pending');
            $table->string('payment_url')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->json('response_data')->nullable();
            $table->timestamps();
        });

        Schema::create('refunds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained('payments')->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->text('reason');
            $table->string('refund_method');
            $table->string('refund_status')->default('Requested');
            $table->foreignId('requested_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('provider_refund_id')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });

        // 9. Reservations
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->string('reservation_code')->unique();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignId('experience_id')->nullable()->constrained('dining_experiences')->nullOnDelete();
            $table->dateTime('reservation_datetime');
            $table->integer('guest_count');
            $table->integer('duration_minutes')->default(120);
            $table->string('status')->default('Pending'); // Pending, Confirmed, Rejected, Cancelled, Completed, No Show
            $table->text('special_request')->nullable();
            $table->string('source')->default('website');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('confirmed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('reservation_tables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reservation_id')->constrained('reservations')->cascadeOnDelete();
            $table->foreignId('table_id')->constrained('restaurant_tables')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('reservation_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reservation_id')->constrained('reservations')->cascadeOnDelete();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('previous_status')->nullable();
            $table->string('new_status');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 10. Waiter assignments & Favorites
        Schema::create('waiter_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('waiter_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('assigned_at')->useCurrent();
            $table->timestamps();
        });

        Schema::create('favorites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('menu_id')->constrained('menus')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['user_id', 'menu_id']);
        });

        // 11. Restaurant Settings & Operating Hours
        Schema::create('restaurant_settings', function (Blueprint $table) {
            $table->id();
            $table->string('restaurant_name')->default('NUSARA — Indonesian Dining Experience');
            $table->string('address');
            $table->string('phone');
            $table->string('email');
            $table->json('social_links')->nullable();
            $table->decimal('tax_percentage', 5, 2)->default(11.00);
            $table->text('reservation_policy')->nullable();
            $table->timestamps();
        });

        Schema::create('operating_hours', function (Blueprint $table) {
            $table->id();
            $table->integer('day_of_week'); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
            $table->string('day_name');
            $table->time('open_time');
            $table->time('close_time');
            $table->boolean('is_closed')->default(false);
            $table->timestamps();
        });

        // 12. Contacts, Journal & Audit Logs
        Schema::create('contacts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('subject');
            $table->text('message');
            $table->string('status')->default('New');
            $table->timestamps();
        });

        Schema::create('journal_posts', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->longText('content');
            $table->string('image')->nullable();
            $table->string('status')->default('Published');
            $table->timestamp('published_at')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action');
            $table->string('entity_type');
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('journal_posts');
        Schema::dropIfExists('contacts');
        Schema::dropIfExists('operating_hours');
        Schema::dropIfExists('restaurant_settings');
        Schema::dropIfExists('favorites');
        Schema::dropIfExists('waiter_assignments');
        Schema::dropIfExists('reservation_status_histories');
        Schema::dropIfExists('reservation_tables');
        Schema::dropIfExists('reservations');
        Schema::dropIfExists('refunds');
        Schema::dropIfExists('payment_transactions');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('order_status_histories');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('table_sessions');
        Schema::dropIfExists('table_qr_codes');
        Schema::dropIfExists('restaurant_tables');
        Schema::dropIfExists('dining_experiences');
        Schema::dropIfExists('menu_images');
        Schema::dropIfExists('menus');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('customers');
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropColumn(['role_id', 'is_active']);
        });
        Schema::dropIfExists('roles');
    }
};
