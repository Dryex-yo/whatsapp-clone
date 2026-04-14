<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Carbon\Carbon;

/**
 * User Model - Represents users in the WhatsApp Clone application
 * 
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string|null $avatar
 * @property string|null $phone
 * @property Carbon|null $last_seen
 * @property Carbon|null $email_verified_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
        'phone',
        'last_seen',
        'theme',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_seen' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get all conversations this user is part of.
     * Ordered by most recently updated conversations first.
     */
    public function conversations(): BelongsToMany
    {
        return $this->belongsToMany(Conversation::class, 'conversation_user')
                    ->withPivot('role', 'is_muted', 'is_pinned', 'joined_at', 'last_read_message_id')
                    ->withTimestamps()
                    ->orderByPivot('is_pinned', 'desc')
                    ->latest('conversation_user.updated_at');
    }

    /**
     * Get all messages sent by this user.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /**
     * Get all messages starred by this user.
     */
    public function starredMessages(): BelongsToMany
    {
        return $this->belongsToMany(
            Message::class,
            'starred_messages',
            'user_id',
            'message_id'
        )->withTimestamps()
         ->orderBy('starred_messages.created_at', 'desc');
    }

    /**
     * Get all conversations created by this user.
     */
    public function createdConversations(): HasMany
    {
        return $this->hasMany(Conversation::class, 'created_by');
    }

    /**
     * Check if user is currently online based on last_seen.
     * Considers user online if last_seen is within the last 5 minutes.
     */
    public function isOnline(): bool
    {
        return $this->last_seen && $this->last_seen->diffInMinutes(now()) < 5;
    }

    /**
     * Get formatted online status for display.
     */
    public function onlineStatus(): Attribute
    {
        return Attribute::make(
            get: fn() => $this->isOnline() ? 'online' : 'offline',
        );
    }

    /**
     * Get all users blocked by this user.
     */
    public function blockedUsers(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'blocked_users',
            'user_id',
            'blocked_user_id'
        )->withTimestamps()
         ->withPivot('reason')
         ->as('block');
    }

    /**
     * Get all users who have blocked this user.
     */
    public function blockedByUsers(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'blocked_users',
            'blocked_user_id',
            'user_id'
        )->withTimestamps()
         ->withPivot('reason')
         ->as('block');
    }

    /**
     * Check if this user has blocked another user.
     */
    public function hasBlocked(User|int $user): bool
    {
        $userId = $user instanceof User ? $user->id : $user;
        return $this->blockedUsers()->where('blocked_user_id', $userId)->exists();
    }

    /**
     * Check if this user is blocked by another user.
     */
    public function isBlockedBy(User|int $user): bool
    {
        $userId = $user instanceof User ? $user->id : $user;
        return $this->blockedByUsers()->where('user_id', $userId)->exists();
    }

    /**
     * Block a user.
     */
    public function blockUser(User|int $user, string|null $reason = null): void
    {
        $userId = $user instanceof User ? $user->id : $user;
        if (!$this->hasBlocked($userId)) {
            $this->blockedUsers()->attach($userId, ['reason' => $reason]);
        }
    }

    /**
     * Unblock a user.
     */
    public function unblockUser(User|int $user): void
    {
        $userId = $user instanceof User ? $user->id : $user;
        $this->blockedUsers()->detach($userId);
    }
}
