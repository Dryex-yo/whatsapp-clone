<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The required callback is used to check if an
| authenticated user can listen to the channel.
|
*/

/**
 * Chat Private Channel Authorization
 * 
 * Private channels (prefixed with "chat.") require authentication
 * Only members of the conversation can listen to messages in that channel
 */
Broadcast::channel('chat.{conversationId}', function ($user, $conversationId) {
    // Authorization: User must be a member of the conversation
    return $user->conversations()->where('conversation_id', $conversationId)->exists();
});

/**
 * Presence Channel for Typing Indicators (Optional)
 * 
 * Use presence channels if you want to track who's currently typing
 * This requires Laravel Echo's join() method
 */
Broadcast::channel('chat.presence.{conversationId}', function ($user, $conversationId) {
    // Authorization: User must be a member of the conversation
    if ($user->conversations()->where('conversation_id', $conversationId)->exists()) {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'avatar' => $user->avatar,
        ];
    }
    
    return false;
});
