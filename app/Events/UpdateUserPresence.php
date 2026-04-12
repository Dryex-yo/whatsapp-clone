<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\User;

/**
 * Event fired when a user joins or updates their presence in a conversation
 * Uses Presence Channels to track who's online
 */
class UpdateUserPresence implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public User $user,
        public int $conversationId,
        public bool $isOnline = true,
    ) {
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("chat.presence.{$this->conversationId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return $this->isOnline ? 'user.joined' : 'user.left';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->user->id,
            'name' => $this->user->name,
            'avatar' => $this->user->avatar,
            'last_seen' => $this->user->last_seen?->toIso8601String(),
            'is_online' => $this->isOnline,
        ];
    }
}
