<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * MessageStatusUpdated Event - Broadcast message status changes in real-time
 * 
 * Triggers when a message status changes from:
 * - sent -> delivered (when recipient opens conversation)
 * - delivered -> read (when recipient reads message)
 * 
 * Implements ShouldBroadcastNow for immediate delivery via Laravel Reverb WebSockets
 * Broadcasts to: private-chat.{conversationId}
 */
class MessageStatusUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @var Message The message whose status was updated
     */
    public Message $message;

    /**
     * @var int The conversation ID
     */
    public int $conversationId;

    /**
     * @var string The new status
     */
    public string $status;

    /**
     * Create a new event instance.
     *
     * @param Message $message
     * @param string $status
     */
    public function __construct(Message $message, string $status)
    {
        $this->message = $message;
        $this->conversationId = $message->conversation_id;
        $this->status = $status;
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
            'message_id' => $this->message->id,
            'status' => $this->status,
            'conversation_id' => $this->conversationId,
        ];
    }
}
