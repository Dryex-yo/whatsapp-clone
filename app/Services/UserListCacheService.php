<?php

namespace App\Services;

use App\Models\User;
use App\Models\Conversation;
use Illuminate\Support\Facades\Cache;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Collection;

/**
 * UserListCacheService - Manages user list caching
 * 
 * Caches conversation member lists and user search results to reduce
 * PostgreSQL query load during high-traffic periods.
 */
class UserListCacheService
{
    private const CACHE_TTL_MINUTES = 10;
    private const CONVERSATION_USERS_KEY = 'conversation:users:';
    private const SEARCH_USERS_KEY = 'search:users:';

    /**
     * Get conversation members with caching and blocking privacy
     * 
     * @param Conversation $conversation
     * @param bool $withStatus Include online status
     * @param User|null $currentUser To check blocking relationships
     * @return Collection
     */
    public function getConversationMembers(Conversation $conversation, bool $withStatus = false, ?User $currentUser = null): Collection
    {
        $cacheKey = static::CONVERSATION_USERS_KEY . $conversation->id . ($withStatus ? ':status' : '');

        return Cache::remember(
            $cacheKey,
            now()->addMinutes(self::CACHE_TTL_MINUTES),
            function () use ($conversation, $withStatus, $currentUser) {
                $users = $conversation->users()
                    ->select('users.id', 'users.name', 'users.email', 'users.avatar', 'users.phone', 'users.last_seen')
                    ->get();

                if ($withStatus) {
                    $onlineService = app(OnlineStatusCacheService::class);
                    $userIds = $users->pluck('id')->toArray();
                    $statuses = $onlineService->getMultipleStatuses($userIds);

                    return $users->map(function ($user) use ($statuses, $currentUser) {
                        $isOnline = $statuses[$user->id] ?? false;
                        
                        // SECURITY: Hide online status from users who have been blocked
                        // If this user (in list) has blocked the current user, hide their online status
                        if ($currentUser && $user->hasBlocked($currentUser->id)) {
                            $isOnline = false;
                        }
                        
                        $user->is_online = $isOnline;
                        return $user;
                    });
                }

                return $users;
            }
        );
    }

    /**
     * Get conversation members count with caching
     */
    public function getConversationMemberCount(Conversation $conversation): int
    {
        $cacheKey = static::CONVERSATION_USERS_KEY . $conversation->id . ':count';

        return Cache::remember(
            $cacheKey,
            now()->addMinutes(self::CACHE_TTL_MINUTES),
            function () use ($conversation) {
                return $conversation->users()->count();
            }
        );
    }

    /**
     * Search users with caching
     * Useful for add members to group, mentions, etc.
     * 
     * @param string $search
     * @param int $limit
     * @return Collection
     */
    public function searchUsers(string $search, int $limit = 20): Collection
    {
        $search = trim($search);
        if (strlen($search) < 2) {
            return collect();
        }

        $cacheKey = static::SEARCH_USERS_KEY . md5($search) . ':limit:' . $limit;

        return Cache::remember(
            $cacheKey,
            now()->addMinutes(self::CACHE_TTL_MINUTES),
            function () use ($search, $limit) {
                return User::where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->select('id', 'name', 'email', 'avatar', 'phone')
                    ->limit($limit)
                    ->get();
            }
        );
    }

    /**
     * Get online users in a specific conversation with blocking privacy
     * 
     * @param Conversation $conversation
     * @param User|null $currentUser To check blocking relationships
     * @return Collection
     */
    public function getOnlineMembers(Conversation $conversation, ?User $currentUser = null): Collection
    {
        $members = $this->getConversationMembers($conversation, withStatus: true, currentUser: $currentUser);
        return $members->filter(fn($user) => $user->is_online);
    }

    /**
     * Invalidate user list cache for a conversation
     */
    public function invalidateConversationCache(Conversation $conversation): void
    {
        Cache::forget(static::CONVERSATION_USERS_KEY . $conversation->id);
        Cache::forget(static::CONVERSATION_USERS_KEY . $conversation->id . ':status');
        Cache::forget(static::CONVERSATION_USERS_KEY . $conversation->id . ':count');
    }

    /**
     * Invalidate user search cache
     */
    public function invalidateSearchCache(): void
    {
        // Clear all search caches - you could be more selective if needed
        // For now we'll just let them expire naturally (10 minutes)
    }

    /**
     * Invalidate cache when user is added to conversation
     */
    public function onMemberAdded(Conversation $conversation, User $user): void
    {
        $this->invalidateConversationCache($conversation);
    }

    /**
     * Invalidate cache when user is removed from conversation
     */
    public function onMemberRemoved(Conversation $conversation, User $user): void
    {
        $this->invalidateConversationCache($conversation);
    }

    /**
     * Invalidate cache when user profile is updated
     */
    public function onUserUpdated(User $user): void
    {
        // Clear all conversation caches for this user
        $conversationIds = $user->conversations()->pluck('conversation_id');
        foreach ($conversationIds as $conversationId) {
            $cacheKey = static::CONVERSATION_USERS_KEY . $conversationId;
            Cache::forget($cacheKey);
            Cache::forget($cacheKey . ':status');
        }
    }

    /**
     * Get user with online status
     */
    public function getUserWithStatus(User $user): User
    {
        $onlineService = app(OnlineStatusCacheService::class);
        $user->is_online = $onlineService->isOnline($user);
        return $user;
    }

    /**
     * Get multiple users with online status
     */
    public function getUsersWithStatus(array $userIds): Collection
    {
        $users = User::whereIn('id', $userIds)
            ->select('id', 'name', 'email', 'avatar', 'phone', 'last_seen')
            ->get();

        $onlineService = app(OnlineStatusCacheService::class);
        $statuses = $onlineService->getMultipleStatuses($userIds);

        return $users->map(function ($user) use ($statuses) {
            $user->is_online = $statuses[$user->id] ?? false;
            return $user;
        });
    }
}
