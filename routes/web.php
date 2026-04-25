<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Foundation\Application;

/**
 * Public Routes
 */
Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('chat.index');
    }

    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
})->name('home');

/**
 * Authenticated Routes
 */
Route::middleware(['auth', 'verified'])->group(function () {
    
    // Fitur Chat (Halaman Utama setelah Login)
    Route::prefix('chat')->group(function () {
        Route::get('/', [ChatController::class, 'index'])->name('chat.index');
        Route::get('/{conversation}', [ChatController::class, 'show'])->name('chat.show');
        Route::post('/ai/start', [ChatController::class, 'startAIConversation'])->name('chat.ai.start');
    });

    // Contacts Management
    Route::prefix('contacts')->group(function () {
        Route::get('/add', [ContactController::class, 'add'])->name('contacts.add');
        Route::get('/add-new', [ContactController::class, 'addNew'])->name('contacts.add-new');
        Route::post('/store', [ContactController::class, 'storeContacts'])->name('contacts.store');
    });

    // Profile Management
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/users/search', [UserController::class, 'search'])->name('users.search');
    Route::get('/users/nearby', [UserController::class, 'nearby'])->name('users.nearby');
});

require __DIR__.'/auth.php';