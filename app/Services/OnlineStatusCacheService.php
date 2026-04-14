<?php

namespace App\Services;

use App\Models\User;
use App\Models\Conversation;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;

/**
 * OnlineStatusCacheService - Manages online status caching with Redis
 * 
 * Optimizes user presence tracking and reduces PostgreSQL query load
 * by caching online status in Redis with 5-minute TTL.
 */
class OnlineStatusCacheService
{
    private const ONLINE_THRESHOLD_MINUTES = 5;
    private const CACHE_TTL_MINUTES = 5;
    private const STATUS_KEY_PREFIX = 'user:status:';
    private const ONLINE_USERS_KEY = 'online:users';
    private const CONVERSATION_MEMBERS_STR = 'conversation:members:';

    /**
     * Check if a user is online
     */
    public function isOnline(User|int $user): bool
    {
        $userId = $user instanceof User ? $user->id : $user;
        $cacheKey = static::STATUS_KEY_PREFIX . $userId;

        // Check Redis cache first
        $cachedStatus = Cache::store('redis')->get($cacheKey);
        if ($cachedStatus !== null) {
            return (bool) $cachedStatus;
        }

        // If not cached, check database
        $user = User::find($userId);
        if (!$user) {
            return false;
        }

        $isOnline = $user->last_seen && $user->last_seen->isAfter(now()->subMinutes(self::ONLINE_THRESHOLD_MINUTES));

        // Cache the result
        Cache::store('redis')->put(
            $cacheKey,
            (int) $isOnline,
            now()->addMinutes(self::CACHE_TTL_MINUTES)
        );

        return $isOnline;
    }

    /**
     * Get online status for multiple users
     * 
     * @param array $userIds
     * @return array ['user_id' => bool]
     */
    public function getMultipleStatuses(array $userIds): array
    {
        $statuses = [];
        $notCached = [];

        // Check Redis cache for all users
        foreach ($userIds as $userId) {
            $cacheKey = static::STATUS_KEY_PREFIX . $userId;
            $cached = Cache::store('redis')->get($cacheKey);
            
            if ($cached !== null) {
                $statuses[$userId] = (bool) $cached;
            } else {
                $notCached[] = $userId;
            }
        }

        // Fetch uncached users from database
        if (!empty($notCached)) {
            $users = User::whereIn('id', $notCached)->get();
            
            foreach ($users as $user) {
                $isOnline = $user->last_seen && $user->last_seen->isAfter(now()->subMinutes(self::ONLINE_THRESHOLD_MINUTES));
                $statuses[$user->id] = $isOnline;

                // Cache the result
                Cache::store('redis')->put(
                    static::STATUS_KEY_PREFIX . $user->id,
                    (int) $isOnline,
                    now()->addMinutes(self::CACHE_TTL_MINUTES)
                );
            }
        }

        // Fill missing users with false (not found or offline)
        foreach ($userIds as $userId) {
            if (!isset($statuses[$userId])) {
                $statuses[$userId] = false;
            }
        }

        return $statuses;
    }

    /**
     * Update user's online status
     */
    public function updateStatus(User $user, ?Carbon $lastSeen = null): void
    {
        $lastSeen = $lastSeen ?? now();
        $cacheKey = static::STATUS_KEY_PREFIX . $user->id;

        $isOnline = $lastSeen->isAfter(now()->subMinutes(self::ONLINE_THRESHOLD_MINUTES));

        // Cache the online status
        Cache::store('redis')->put(
            $cacheKey,
            (int) $isOnline,
            now()->addMinutes(self::CACHE_TTL_MINUTES)
        );

        // Also add to global online users set for quick lookups
        if ($isOnline) {
            Redis::setex(static::ONLINE_USERS_KEY . ':' . $user->id, self::CACHE_TTL_MINUTES * 60, 1);
        } else {
            Redis::del(static::ONLINE_USERS_KEY . ':' . $user->id);
        }
    }

    /**
     * Invalidate user's online status cache
     */
    public function invalidate(User|int $user): void
    {
        $userId = $user instanceof User ? $user->id : $user;
        Cache::store('redis')->forget(static::STATUS_KEY_PREFIX . $userId);
        Redis::del(static::ONLINE_USERS_KEY . ':' . $userId);
    }

    /**
     * Get all online users in a conversation
     * 
     * @param Conversation $conversation
     * @return Collection
     */
    public function getConversationOnlineMembers(Conversation $conversation): Collection
    {
        $cacheKey = static::CONVERSATION_MEMBERS_STR . $conversation->id . ':online';

        return Cache::store('redis')->remember(
            $cacheKey,
            now()->addMinutes(self::CACHE_TTL_MINUTES),
            function () use ($conversation) {
                $userIds = $conversation->users()->pluck('users.id')->toArray();
                $onlineStatuses = $this->getMultipleStatuses($userIds);

                // Filter to only online users and return their data
                $onlineUserIds = array_keys(array_filter($onlineStatuses));

                return User::whereIn('id', $onlineUserIds)
                    ->select('id', 'name', 'avatar', 'last_seen')
                    ->get();
            }
        );
    }

    /**
     * Invalidate conversation members cache
     */
    public function invalidateConversationCache(Conversation $conversation): void
    {
        $cacheKey = static::CONVERSATION_MEMBERS_STR . $conversation->id . ':online';
        Cache::store('redis')->forget($cacheKey);
    }

    /**
     * Get user list for conversation with online status
     * 
     * @param Conversation $conversation
     * @return Collection
     */
    public function getConversationMembersWithStatus(Conversation $conversation): Collection
    {
        $cacheKey = static::CONVERSATION_MEMBERS_STR . $conversation->id . ':all';

        return Cache::store('redis')->remember(
            $cacheKey,
            now()->addMinutes(self::CACHE_TTL_MINUTES),
            function () use ($conversation) {
                $users = $conversation->users()
                    ->select('users.id', 'users.name', 'users.avatar', 'users.last_seen')
                    ->get();

                $userIds = $users->pluck('id')->toArray();
                $onlineStatuses = $this->getMultipleStatuses($userIds);

                // Add online status to each user
                return $users->map(function ($user) use ($onlineStatuses) {
                    $user->is_online = $onlineStatuses[$user->id] ?? false;
                    return $user;
                });
            }
        );
    }

    /**
     * Get count of online users in conversation
     */
    public function getConversationOnlineCount(Conversation $conversation): int
    {
        return $this->getConversationOnlineMembers($conversation)->count();
    }

    /**
     * Clear all online status caches
     * 
     * Clears all Redis cache entries - use with caution
     */
    public function clearAll(): void
    {
        // Use Artisan command or direct Redis flush
        Redis::flushDb();
    }
}
