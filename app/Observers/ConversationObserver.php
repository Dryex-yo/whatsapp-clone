<?php

namespace App\Observers;

use App\Models\Conversation;
use App\Services\OnlineStatusCacheService;
use App\Services\UserListCacheService;
use Illuminate\Support\Facades\Cache;

/**
 * ConversationObserver - Invalidates caches when conversations change
 * 
 * Ensures cached data is cleared when:
 * - Conversation details are updated
 * - Members are added/removed
 * - Conversation is deleted
 */
class ConversationObserver
{
    public function __construct(
        private OnlineStatusCacheService $onlineStatusService,
        private UserListCacheService $userListService
    ) {}

    /**
     * Handle the Conversation "created" event - no cache to clear
     */
    public function created(Conversation $conversation): void
    {
        // New conversation - nothing to invalidate
    }

    /**
     * Handle the Conversation "updated" event
     * Clear caches when conversation details change
     */
    public function updated(Conversation $conversation): void
    {
        // Invalidate message caches for this conversation
        Cache::tags(["conversation.{$conversation->id}.messages"])->flush();

        // Invalidate user list caches
        $this->userListService->invalidateConversationCache($conversation);

        // Invalidate online status caches
        $this->onlineStatusService->invalidateConversationCache($conversation);
    }

    /**
     * Handle the Conversation "deleted" event
     * Clear all caches when conversation is deleted
     */
    public function deleted(Conversation $conversation): void
    {
        // Clear all caches for this conversation
        Cache::tags(["conversation.{$conversation->id}.messages"])->flush();
        $this->userListService->invalidateConversationCache($conversation);
        $this->onlineStatusService->invalidateConversationCache($conversation);
    }

    /**
     * Handle the Conversation "restored" event - re-populate if needed
     */
    public function restored(Conversation $conversation): void
    {
        // Conversation restored - caches will be re-populated on next access
    }

    /**
     * Handle the Conversation "force deleted" event
     */
    public function forceDeleted(Conversation $conversation): void
    {
        // Clear all caches
        Cache::tags(["conversation.{$conversation->id}.messages"])->flush();
        $this->userListService->invalidateConversationCache($conversation);
        $this->onlineStatusService->invalidateConversationCache($conversation);
    }
}
