<?php

use App\Http\Controllers\ChatController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    /**
     * User Routes
     */
    Route::get('/user', function (Request $request) {
        return $request->user();
    })->name('user.profile');

    /**
     * Chat/Message Routes
     * Note: Uses implicit model binding for {conversation} parameter
     */
    Route::post('/conversations/{conversation}/messages', [ChatController::class, 'store'])
        ->name('messages.store');

    /**
     * Presence Routes
     * Updates user presence in conversation for real-time online status
     */
    Route::post('/conversations/{conversation}/presence', [ChatController::class, 'updatePresence'])
        ->name('conversations.presence');
});
