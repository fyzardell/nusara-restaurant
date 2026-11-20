<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CashierController;
use App\Http\Controllers\LandingPageController;
use App\Http\Controllers\OrderController;
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
Route::get('/reservation', [LandingPageController::class, 'index'])->name('reservation');

// Customer Ordering App (Akses Publik / Tamu Meja & Member)
Route::get('/order', [OrderController::class, 'index'])->name('order.app');
Route::post('/order/checkout', [OrderController::class, 'checkout'])->name('order.checkout');

// Fitur Khusus Member Terdaftar
Route::middleware('auth')->group(function () {
    Route::post('/order/{id}/rating', [OrderController::class, 'submitRating'])->name('order.rating');
    Route::post('/chat/send', [OrderController::class, 'sendMessage'])->name('chat.send');
    Route::post('/favorites/toggle', [OrderController::class, 'toggleFavorite'])->name('favorites.toggle');
});

// Admin Single Branch Management Dashboard
Route::middleware('auth')->prefix('admin')->group(function () {
    Route::get('/', [AdminController::class, 'index'])->name('admin.dashboard');
    Route::post('/order/{id}/status', [AdminController::class, 'updateOrderStatus'])->name('admin.order.status');
    Route::post('/menu/{id}/stock', [AdminController::class, 'updateMenuStock'])->name('admin.menu.stock');
    Route::post('/table/{id}/status', [AdminController::class, 'updateTableStatus'])->name('admin.table.status');
    Route::post('/reservation/{id}/status', [AdminController::class, 'updateReservationStatus'])->name('admin.reservation.status');
});

// Cashier Operational Dashboard (PRD Section 8.1 & REQ-FE-003)
Route::middleware('auth')->prefix('cashier')->group(function () {
    Route::get('/', [CashierController::class, 'index'])->name('cashier.dashboard');
    Route::post('/order/{id}/status', [CashierController::class, 'updateOrderStatus'])->name('cashier.order.status');
    Route::post('/order/{id}/payment', [CashierController::class, 'confirmCashPayment'])->name('cashier.order.payment');
    Route::post('/table/{id}/status', [CashierController::class, 'updateTableStatus'])->name('cashier.table.status');
    Route::post('/reservation/{id}/status', [CashierController::class, 'updateReservationStatus'])->name('cashier.reservation.status');
});
