<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CashierController;
use App\Http\Controllers\LandingPageController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\WaiterController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [LandingPageController::class, 'index'])->name('home');
Route::get('/splash', function () {
    return Inertia::render('SplashScreenPage');
})->name('splash');

Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.post');
Route::get('/register', [AuthController::class, 'showLogin'])->name('register');
Route::post('/register', [AuthController::class, 'register'])->name('register.post');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Quick simulated action routes from PRD
Route::get('/menu', [LandingPageController::class, 'index'])->name('menu');
// Dedicated Luxury Reservation Page (Customer Flow)
Route::get('/reservation', [ReservationController::class, 'index'])->name('reservation');
Route::post('/reservation', [ReservationController::class, 'store'])->name('reservation.store');

// Customer Ordering App (Akses Publik / Tamu Meja & Member)
Route::get('/order', [OrderController::class, 'index'])->name('order.app');
Route::post('/order/checkout', [OrderController::class, 'checkout'])->name('order.checkout');

// Midtrans Webhook Notification Handler (Public & CSRF Exempted)
Route::post('/api/midtrans/webhook', [OrderController::class, 'handleWebhook'])->name('midtrans.webhook');
Route::post('/midtrans/webhook', [OrderController::class, 'handleWebhook']);

// Fitur Khusus Member Terdaftar
Route::middleware('auth')->group(function () {
    Route::post('/order/{id}/rating', [OrderController::class, 'submitRating'])->name('order.rating');
    Route::post('/chat/send', [OrderController::class, 'sendMessage'])->name('chat.send');
    Route::post('/chat/read', [OrderController::class, 'markAsRead'])->name('chat.read');
    Route::post('/favorites/toggle', [OrderController::class, 'toggleFavorite'])->name('favorites.toggle');
});

// Admin Single Branch Management Dashboard
Route::middleware('auth')->prefix('admin')->group(function () {
    Route::get('/', [AdminController::class, 'index'])->name('admin.dashboard');
    Route::post('/order/{id}/status', [AdminController::class, 'updateOrderStatus'])->name('admin.order.status');
    Route::post('/menu/{id}/stock', [AdminController::class, 'updateMenuStock'])->name('admin.menu.stock');
    Route::post('/menus', [AdminController::class, 'storeMenu'])->name('admin.menu.store');
    Route::post('/categories', [AdminController::class, 'storeCategory'])->name('admin.category.store');
    Route::post('/table/{id}/status', [AdminController::class, 'updateTableStatus'])->name('admin.table.status');
    Route::post('/reservation/{id}/status', [AdminController::class, 'updateReservationStatus'])->name('admin.reservation.status');
    Route::get('/chats', [AdminController::class, 'chats'])->name('admin.chats');
    Route::get('/chats/{user}', [AdminController::class, 'chatShow'])->name('admin.chats.show');
    Route::post('/chats/{user}', [AdminController::class, 'sendChatMessage'])->name('admin.chats.send_direct');
    Route::post('/chats/{user}/send', [AdminController::class, 'sendChatMessage'])
        ->name('admin.chats.send');
});

// Cashier Operational Dashboard (PRD Section 8.1 & REQ-FE-003)
Route::middleware('auth')->prefix('cashier')->group(function () {
    Route::get('/', [CashierController::class, 'index'])->name('cashier.dashboard');
    Route::post('/order/{id}/status', [CashierController::class, 'updateOrderStatus'])->name('cashier.order.status');
    Route::post('/order/{id}/payment', [CashierController::class, 'confirmCashPayment'])->name('cashier.order.payment');
    Route::post('/table/{id}/status', [CashierController::class, 'updateTableStatus'])->name('cashier.table.status');
    Route::post('/reservation/{id}/status', [CashierController::class, 'updateReservationStatus'])->name('cashier.reservation.status');
});

// Waiter Operational Dashboard (PRD Section 2, 6.1, 6.2 & 8.2)
Route::middleware('auth')->prefix('waiter')->group(function () {
    Route::get('/', [WaiterController::class, 'index'])->name('waiter.dashboard');
    Route::post('/table/{id}/validate', [WaiterController::class, 'validateTable'])->name('waiter.table.validate');
    Route::post('/order/{id}/serve', [WaiterController::class, 'markServed'])->name('waiter.order.serve');
    Route::post('/table/{id}/cleaning', [WaiterController::class, 'startCleaning'])->name('waiter.table.cleaning');
    Route::post('/table/{id}/available', [WaiterController::class, 'finishCleaning'])->name('waiter.table.available');
    Route::post('/table/{id}/request-occupancy', [WaiterController::class, 'requestOccupancy'])->name('waiter.table.request-occupancy');
});
