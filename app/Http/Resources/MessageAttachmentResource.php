<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageAttachmentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'message_id' => $this->message_id,
            'file_name' => $this->file_name,
            'type' => $this->type,
            'mime_type' => $this->mime_type,
            'size' => $this->size,
            'human_size' => $this->getHumanFileSize(),
            'url' => $this->getUrl(),
            'thumbnail_url' => $this->getThumbnailUrl(),
            'width' => $this->width,
            'height' => $this->height,
            'duration' => $this->duration,
            'status' => $this->status,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
