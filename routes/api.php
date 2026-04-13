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

    Route::put('/user/theme', function (Request $request) {
        $validated = $request->validate([
            'theme' => 'required|in:light,dark,system',
        ]);

        $request->user()->update([
            'theme' => $validated['theme'],
        ]);

        return response()->json([
            'message' => 'Theme updated successfully',
            'theme' => $request->user()->theme,
        ]);
    })->name('user.theme.update');

    /**
     * Search Routes
     * Global search and search within conversations
     */
    Route::get('/search', [ChatController::class, 'globalSearch'])
        ->name('search.global');

    Route::get('/conversations/{conversation}/search', [ChatController::class, 'searchChat'])
        ->name('search.chat');

    Route::get('/conversations/{conversation}/messages', [ChatController::class, 'getMessages'])
        ->name('messages.get');

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
