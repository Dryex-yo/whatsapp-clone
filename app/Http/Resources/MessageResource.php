<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * MessageResource - Transforms Message model to JSON
 * 
 * Used for API responses and Inertia props
 */
class MessageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $fileSize = $this->file_size;
        $formattedFileSize = null;

        // Format file size to human-readable format
        if ($fileSize) {
            $units = ['B', 'KB', 'MB', 'GB'];
            $size = $fileSize;
            $unitIndex = 0;
            
            while ($size >= 1024 && $unitIndex < count($units) - 1) {
                $size /= 1024;
                $unitIndex++;
            }
            
            $formattedFileSize = round($size, 2) . ' ' . $units[$unitIndex];
        }

        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'user_id' => $this->user_id,
            'body' => $this->body,
            'type' => $this->type, // 'text', 'image', 'file'
            'file_path' => $this->file_path,
            'file_size' => $fileSize,
            'mime_type' => $this->mime_type,
            'read_at' => $this->read_at,
            'edited_at' => $this->edited_at,
            'deleted_at' => $this->deleted_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            // Computed properties
            'is_read' => $this->read_at !== null,
            'is_edited' => $this->edited_at !== null,
            'formatted_file_size' => $formattedFileSize,
            // Relationships (only include sender for message details)
            'sender' => new UserResource($this->whenLoaded('user')),
            'attachments' => MessageAttachmentResource::collection($this->whenLoaded('attachments')),
        ];
    }
}
