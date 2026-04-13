<?php

namespace App\Events;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * ConversationOpened Event - Trigger when a user opens a conversation
 * 
 * This event is used to:
 * - Mark all unread messages in the conversation as 'delivered'
 * - Broadcast user's presence to other conversation participants
 * - Update conversation's last read timestamp
 * 
 * Broadcasts to: private-chat.{conversationId}
 */
class ConversationOpened implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @var Conversation The conversation that was opened
     */
    public Conversation $conversation;

    /**
     * @var User The user who opened the conversation
     */
    public User $user;

    /**
     * @var int The conversation ID
     */
    public int $conversationId;

    /**
     * @var int The user ID
     */
    public int $userId;

    /**
     * Create a new event instance.
     *
     * @param Conversation $conversation
     * @param User $user
     */
    public function __construct(Conversation $conversation, User $user)
    {
        $this->conversation = $conversation;
        $this->user = $user;
        $this->conversationId = $conversation->id;
        $this->userId = $user->id;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('chat.' . $this->conversationId),
        ];
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'conversation_id' => $this->conversationId,
            'user_id' => $this->userId,
            'user_name' => $this->user->name,
            'event' => 'conversation_opened',
        ];
    }

    /**
     * Determine if this event should be broadcast.
     */
    public function shouldBroadcast(): bool
    {
        return true;
    }
}
