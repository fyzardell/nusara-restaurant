<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\LandingPageController;
use App\Http\Controllers\OrderController;
use Illuminate\Support\Facades\Route;

Route::get('/', [LandingPageController::class, 'index'])->name('home');

Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.post');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Quick simulated action routes from PRD
Route::get('/menu', [LandingPageController::class, 'index'])->name('menu');
Route::get('/reservation', [LandingPageController::class, 'index'])->name('reservation');

// Customer Ordering App (Kopi Kenangan style web app flow)
Route::middleware('auth')->group(function () {
    Route::get('/order', [OrderController::class, 'index'])->name('order.app');
    Route::post('/order/checkout', [OrderController::class, 'checkout'])->name('order.checkout');
    Route::post('/order/{id}/rating', [OrderController::class, 'submitRating'])->name('order.rating');
    Route::post('/chat/send', [OrderController::class, 'sendMessage'])->name('chat.send');
    Route::post('/favorites/toggle', [OrderController::class, 'toggleFavorite'])->name('favorites.toggle');
});
