<?php

namespace App\Listeners;

use App\Events\ConversationOpened;
use App\Events\MessageStatusUpdated;
use App\Models\Message;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

/**
 * ConversationOpenedHandler - Handle conversation opened events
 * 
 * When a user opens a conversation, this listener:
 * 1. Marks all received messages (not sent by this user) as 'delivered'
 * 2. Broadcasts individual MessageStatusUpdated events for real-time UI updates
 */
class ConversationOpenedHandler implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(ConversationOpened $event): void
    {
        // Get all undelivered messages in this conversation that were NOT sent by the current user
        $messages = Message::where('conversation_id', $event->conversationId)
            ->where('user_id', '!=', $event->userId)
            ->where('status', 'sent')
            ->get();

        // Mark each message as delivered and broadcast the status change
        foreach ($messages as $message) {
            $message->markAsDelivered();
            
            // Broadcast individual message status update
            MessageStatusUpdated::dispatch($message, 'delivered');
        }
    }
}
