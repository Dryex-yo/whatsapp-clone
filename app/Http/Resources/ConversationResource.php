<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * ConversationResource - Transforms Conversation model to JSON
 * 
 * Used for API responses and Inertia props
 */
class ConversationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $currentUserId = $request->user()?->id;
        
        // For 1-on-1 conversations, get the other user
        $users = $this->whenLoaded('users', function () use ($currentUserId) {
            return UserResource::collection($this->users);
        });

        $otherUser = null;
        if (!$this->is_group && $this->users && $currentUserId) {
            $otherUserModel = $this->users->firstWhere('id', '!=', $currentUserId);
            $otherUser = $otherUserModel ? new UserResource($otherUserModel) : null;
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'is_group' => $this->is_group,
            'avatar' => $this->avatar,
            'created_by' => $this->created_by,
            'description' => $this->description,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            // Relationships
            'users' => $users,
            'last_message' => new MessageResource($this->whenLoaded('lastMessage')),
            'other_user' => $otherUser,
            // Pivot data (from BelongsToMany relationship)
            'pivot' => $this->when($this->pivot, function () {
                return [
                    'user_id' => $this->pivot->user_id,
                    'conversation_id' => $this->pivot->conversation_id,
                    'role' => $this->pivot->role,
                    'is_muted' => (bool) $this->pivot->is_muted,
                    'is_pinned' => (bool) $this->pivot->is_pinned,
                    'joined_at' => $this->pivot->joined_at,
                    'last_read_message_id' => $this->pivot->last_read_message_id,
                    'created_at' => $this->pivot->created_at,
                    'updated_at' => $this->pivot->updated_at,
                ];
            }),
            // Unread count
            'unread_count' => $this->whenCounted('unreadMessages'),
        ];
    }
}
