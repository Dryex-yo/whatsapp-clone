<?php

namespace App\Observers;

use App\Models\User;
use App\Services\OnlineStatusCacheService;
use App\Services\UserListCacheService;
use Illuminate\Support\Facades\Cache;

/**
 * UserObserver - Manages cache invalidation for user changes
 * 
 * Ensures cached user data is cleared when user information changes
 */
class UserObserver
{
    public function __construct(
        private OnlineStatusCacheService $onlineStatusService,
        private UserListCacheService $userListService
    ) {}

    /**
     * Handle the User "updated" event
     * Invalidate user's online status and profile caches
     */
    public function updated(User $user): void
    {
        // Invalidate the user's online status cache
        $this->onlineStatusService->invalidate($user);

        // Invalidate user in all their conversations
        $this->userListService->onUserUpdated($user);

        // Clear search caches as name/email might have changed
        $this->userListService->invalidateSearchCache();
    }

    /**
     * Handle the User "deleted" event
     */
    public function deleted(User $user): void
    {
        // Invalidate user's online status
        $this->onlineStatusService->invalidate($user);

        // Clear from all conversation member caches
        $conversationIds = $user->conversations()->pluck('conversation_id');
        foreach ($conversationIds as $conversationId) {
            Cache::store('redis')->forget("conversation:users:{$conversationId}");
            Cache::store('redis')->forget("conversation:users:{$conversationId}:status");
            Cache::store('redis')->forget("conversation:users:{$conversationId}:count");
        }
    }
}
