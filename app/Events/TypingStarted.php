<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * TypingStarted Event - Broadcast typing indicators in real-time
 * 
 * Uses whisper() in Echo for per-user typing status
 * Does not persist in database - real-time presence only
 */
class TypingStarted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @var int The user who is typing
     */
    public int $userId;

    /**
     * @var int The conversation ID
     */
    public int $conversationId;

    /**
     * @var string The user's name
     */
    public string $userName;

    /**
     * Create a new event instance.
     */
    public function __construct(int $userId, int $conversationId, string $userName)
    {
        $this->userId = $userId;
        $this->conversationId = $conversationId;
        $this->userName = $userName;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("chat.{$this->conversationId}"),
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
            'userId' => $this->userId,
            'userName' => $this->userName,
            'conversationId' => $this->conversationId,
            'timestamp' => now()->toIso8601String(),
        ];
    }

    /**
     * The event's broadcast name.
     *
     * @return string
     */
    public function broadcastAs(): string
    {
        return 'typing.started';
    }
}
