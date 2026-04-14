<?php

namespace App\Policies;

use App\Models\Message;
use App\Models\User;
use App\Models\Conversation;

/**
 * MessagePolicy - Authorization logic for message actions
 * 
 * Handles permissions for:
 * - Creating messages (blocked users cannot send)
 * - Editing messages (only sender within time limit)
 * - Deleting messages (only sender)
 * - Starring messages
 */
class MessagePolicy
{
    /**
     * Determine if user can create a message in a conversation.
     * Prevents blocked users from sending messages.
     * Prevents users blocked by conversation members from sending messages.
     *
     * @param User $user
     * @param Conversation $conversation
     * @return bool
     */
    public function create(User $user, Conversation $conversation): bool
    {
        // User must be a member of the conversation
        if (!$conversation->users()->where('users.id', $user->id)->exists()) {
            return false;
        }

        // Get all conversation members
        $conversationMembers = $conversation->users()->pluck('users.id')->toArray();

        // Check if the user is blocked by any conversation member
        foreach ($conversationMembers as $memberId) {
            if ($memberId === $user->id) {
                continue; // Skip self
            }

            $member = User::find($memberId);
            if ($member && $member->hasBlocked($user)) {
                // User is blocked by this member - prevent message sending
                return false;
            }
        }

        // Check if the user has blocked any conversation members
        // (User can still send messages to blocked users, but blocked users cannot reply)
        // We allow this to prevent blocking from being abused to stop communication

        return true;
    }

    /**
     * Determine if user can view a message.
     * User must be a member of the conversation.
     *
     * @param User $user
     * @param Message $message
     * @return bool
     */
    public function view(User $user, Message $message): bool
    {
        return $message->conversation->users()->where('users.id', $user->id)->exists();
    }

    /**
     * Determine if user can update (edit) a message.
     * Only the sender can edit, and within 15 minutes of creation.
     *
     * @param User $user
     * @param Message $message
     * @return bool
     */
    public function update(User $user, Message $message): bool
    {
        if ($user->id !== $message->user_id) {
            return false;
        }

        return $message->canEdit();
    }

    /**
     * Determine if user can delete a message.
     * Only the sender can delete a message.
     *
     * @param User $user
     * @param Message $message
     * @return bool
     */
    public function delete(User $user, Message $message): bool
    {
        return $user->id === $message->user_id;
    }

    /**
     * Determine if user can star a message.
     * User must be a member of the conversation.
     *
     * @param User $user
     * @param Message $message
     * @return bool
     */
    public function star(User $user, Message $message): bool
    {
        return $message->conversation->users()->where('users.id', $user->id)->exists();
    }

    /**
     * Determine if user can fetch starred messages.
     *
     * @param User $user
     * @return bool
     */
    public function viewStarred(User $user): bool
    {
        return true;
    }
}
