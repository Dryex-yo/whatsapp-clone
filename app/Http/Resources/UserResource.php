<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * UserResource - Transforms User model to JSON
 * 
 * Used for API responses and Inertia props
 */
class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Determine if user is online (last_seen within 5 minutes)
        $isOnline = false;
        if ($this->last_seen) {
            $lastSeenTime = strtotime($this->last_seen);
            $currentTime = time();
            $isOnline = ($currentTime - $lastSeenTime) < (5 * 60); // 5 minutes
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar' => $this->avatar,
            'last_seen' => $this->last_seen,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            // Computed properties
            'is_online' => $isOnline,
        ];
    }
}
