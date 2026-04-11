<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

/**
 * Conversation Model - Represents conversations (1-on-1 or groups) in the WhatsApp Clone
 * 
 * @property int $id
 * @property string|null $name Group name
 * @property bool $is_group
 * @property string|null $avatar Group avatar
 * @property int|null $created_by User ID who created the group
 * @property string|null $description Group description
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class Conversation extends Model
{

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'is_group',
        'avatar',
        'created_by',
        'description',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'is_group' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get all users in this conversation.
     * Returns pivot data including role, mute status, etc.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'conversation_user')
                    ->withPivot('role', 'is_muted', 'is_pinned', 'joined_at', 'last_read_message_id')
                    ->withTimestamps();
    }

    /**
     * Get all messages in this conversation.
     * Ordered from oldest to newest.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /**
     * Get the latest message in this conversation.
     * Useful for displaying preview in sidebar.
     */
    public function lastMessage(): HasOne
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    /**
     * Get the user who created this conversation (group creator).
     * Returns null for 1-on-1 conversations.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the other user in a 1-on-1 conversation.
     * 
     * @param int $userId The ID of the current user
     * @return User|null The other user, or null if this is a group
     */
    public function getOtherUser(int $userId): ?User
    {
        if ($this->is_group) {
            return null;
        }

        return $this->users()
                    ->where('users.id', '!=', $userId)
                    ->first();
    }

    /**
     * Get unread message count for a specific user.
     * 
     * @param int $userId The user ID to check
     * @return int Number of unread messages
     */
    public function getUnreadCount(int $userId): int
    {
        $lastReadMessageId = $this->users()
                                  ->where('user_id', $userId)
                                  ->value('conversation_user.last_read_message_id');

        return $this->messages()
                    ->when($lastReadMessageId, function ($query) use ($lastReadMessageId) {
                        $query->where('id', '>', $lastReadMessageId);
                    })
                    ->whereNull('deleted_at')
                    ->count();
    }

    /**
     * Mark all messages as read for a specific user.
     * 
     * @param int $userId The user ID
     */
    public function markAsRead(int $userId): void
    {
        $latestMessage = $this->messages()
                             ->whereNull('deleted_at')
                             ->latest()
                             ->first();

        if ($latestMessage) {
            $this->users()
                 ->updateExistingPivot($userId, [
                     'last_read_message_id' => $latestMessage->id,
                 ]);

            $latestMessage->update(['read_at' => now()]);
        }
    }

    /**
     * Add a user to this conversation.
     * 
     * @param int $userId The user ID to add
     * @param string $role The role of the user ('member', 'admin', etc.)
     */
    public function addUser(int $userId, string $role = 'member'): void
    {
        $this->users()->attach($userId, [
            'role' => $role,
            'joined_at' => now(),
        ]);
    }

    /**
     * Remove a user from this conversation.
     * 
     * @param int $userId The user ID to remove
     */
    public function removeUser(int $userId): void
    {
        $this->users()->detach($userId);
    }
}