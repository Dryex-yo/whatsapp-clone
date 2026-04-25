<?php

namespace App\Events;

use App\Models\User;
use App\Http\Resources\UserResource;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * UpdateUserProfile Event - Broadcast profile changes in real-time
 * 
 * Implements ShouldBroadcastNow for immediate delivery via Laravel Reverb WebSockets
 * Broadcasts to: user-profile.{userId} for all contacts listening to this user's profile updates
 * 
 * This ensures that when a user updates their profile (avatar, bio, phone, etc.),
 * all their contacts receive the update in real-time.
 */
class UpdateUserProfile implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @var User The user whose profile was updated
     */
    public User $user;

    /**
     * Create a new event instance.
     *
     * @param User $user
     */
    public function __construct(User $user)
    {
        $this->user = $user;
    }

    /**
     * Get the channels the event should broadcast on.
     * 
     * Broadcasts to a user-specific channel that contacts listen to
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel("user-profile.{$this->user->id}"),
        ];
    }

    /**
     * Get the name of the broadcast event.
     *
     * @return string
     */
    public function broadcastAs(): string
    {
        return 'profile.updated';
    }

    /**
     * Get the data to broadcast.
     * 
     * Includes all essential profile information that might have been updated:
     * - profile_photo_url (avatar image)
     * - name (display name)
     * - bio (user status message)
     * - phone (phone number)
     * - last_seen_privacy (privacy setting)
     * - last_seen (online status)
     *
     * @return array
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->user->id,
            'name' => $this->user->name,
            'email' => $this->user->email,
            'phone' => $this->user->phone,
            'bio' => $this->user->bio,
            'about' => $this->user->bio, // Alias
            'avatar' => $this->user->avatar,
            'profile_photo_path' => $this->user->profile_photo_path,
            'profile_photo_url' => $this->user->profile_photo_url,
            'last_seen' => $this->user->last_seen?->toIso8601String(),
            'last_seen_privacy' => $this->user->last_seen_privacy,
            'is_online' => $this->user->isOnline(),
            'created_at' => $this->user->created_at?->toIso8601String(),
            'updated_at' => $this->user->updated_at?->toIso8601String(),
        ];
    }
}
