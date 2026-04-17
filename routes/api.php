<?php

use App\Http\Controllers\ChatController;
use App\Http\Controllers\MediaController;
use App\Models\User;
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
     * User Settings Routes
     */
    Route::get('/user/settings', function (Request $request) {
        return response()->json([
            'bio' => $request->user()->bio,
            'last_seen_privacy' => $request->user()->last_seen_privacy,
            'avatar' => $request->user()->avatar,
        ]);
    })->name('user.settings.get');

    Route::put('/user/settings', function (Request $request) {
        $validated = $request->validate([
            'bio' => 'nullable|string|max:500',
            'last_seen_privacy' => 'required|in:everyone,contacts,nobody',
        ]);

        $request->user()->update($validated);

        return response()->json([
            'message' => 'Settings updated successfully',
            'bio' => $request->user()->bio,
            'last_seen_privacy' => $request->user()->last_seen_privacy,
        ]);
    })->name('user.settings.update');

    /**
     * Block Management Routes
     * Block, unblock, and manage blocked users
     */
    Route::get('/users', [ChatController::class, 'getUsers'])
        ->name('users.list');

    Route::post('/conversations/start', [ChatController::class, 'startDirectConversation'])
        ->name('conversations.start');
    Route::post('/users/{user}/block', [ChatController::class, 'blockUser'])
        ->name('users.block');

    Route::post('/users/{user}/unblock', [ChatController::class, 'unblockUser'])
        ->name('users.unblock');

    Route::get('/users/blocked', [ChatController::class, 'getBlockedUsers'])
        ->name('users.blocked-list');

    Route::get('/users/{user}/is-blocked', [ChatController::class, 'isUserBlocked'])
        ->name('users.is-blocked');

    /**
     * Search Routes
     * Global search and search within conversations
     */
    Route::get('/search', [ChatController::class, 'globalSearch'])
        ->name('search.global');

    Route::get('/conversations/{conversation}/search', [ChatController::class, 'searchChat'])
        ->name('search.chat');

    /**
     * Starred Messages Routes
     * Save and retrieve important messages
     */
    Route::get('/messages/starred', [ChatController::class, 'getStarredMessages'])
        ->name('messages.starred');

    Route::post('/messages/{message}/star', [ChatController::class, 'toggleStar'])
        ->name('messages.toggleStar');

    Route::get('/conversations/{conversation}/messages/starred', [ChatController::class, 'getStarredMessagesInConversation'])
        ->name('messages.starred.conversation');

    Route::get('/conversations/{conversation}/messages', [ChatController::class, 'getMessages'])
        ->name('messages.get');

    /**
     * Chat/Message Routes
     * Note: Uses implicit model binding for {conversation} parameter
     */
    Route::post('/conversations/{conversation}/messages', [ChatController::class, 'store'])
        ->middleware('rate-limit-messages')
        ->name('messages.store');

    /**
     * Group Management Routes
     */
    Route::post('/groups', [ChatController::class, 'createGroup'])
        ->name('groups.create');

    Route::delete('/conversations/{conversation}/members/{member}', [ChatController::class, 'removeMember'])
        ->name('conversations.removeMember');

    Route::post('/conversations/{conversation}/members', [ChatController::class, 'addMembers'])
        ->name('conversations.addMembers');

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
