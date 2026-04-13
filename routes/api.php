<?php

use App\Http\Controllers\ChatController;
use App\Http\Controllers\MediaController;
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

    /**
     * Media/Attachment Routes
     * Upload media and manage attachments
     */
    Route::post('/conversations/{conversation}/media/upload', [MediaController::class, 'upload'])
        ->name('media.upload');

    Route::post('/messages/{message}/attachments', [MediaController::class, 'createAttachment'])
        ->name('attachments.create');

    Route::delete('/attachments/{attachment}', [MediaController::class, 'destroy'])
        ->name('attachments.destroy');
});
