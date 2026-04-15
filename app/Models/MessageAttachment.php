<?php

namespace App\Models;

use Database\Factories\MessageAttachmentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

/**
 * MessageAttachment Model - Represents files/media attached to messages
 * 
 * @property int $id
 * @property int $message_id
 * @property int $user_id
 * @property string $file_name Original file name
 * @property string $path Storage path (relative to public disk)
 * @property string $mime_type MIME type of file
 * @property int $size File size in bytes
 * @property string $type Media type (image, video, audio, document)
 * @property int|null $width Image width in pixels
 * @property int|null $height Image height in pixels
 * @property float|null $duration Audio/video duration in seconds
 * @property string|null $thumbnail_path Thumbnail storage path
 * @property string $status Processing status (pending, processing, completed, failed)
 * @property string|null $processing_error Error message if processing failed
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class MessageAttachment extends Model
{
    use HasFactory;
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'message_id',
        'user_id',
        'file_name',
        'path',
        'mime_type',
        'size',
        'type',
        'width',
        'height',
        'duration',
        'thumbnail_path',
        'status',
        'processing_error',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'width' => 'integer',
            'height' => 'integer',
            'duration' => 'float',
            'size' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the message this attachment belongs to.
     */
    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    /**
     * Get the user who uploaded this attachment.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the full URL to the attachment file.
     */
    public function getUrl(): string
    {
        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('public');
        return $disk->url($this->path);
    }

    /**
     * Get the full URL to the thumbnail (if available).
     */
    public function getThumbnailUrl(): ?string
    {
        if (!$this->thumbnail_path) {
            // For images, return original if no thumbnail
            return $this->type === 'image' ? $this->getUrl() : null;
        }

        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('public');
        return $disk->url($this->thumbnail_path);
    }

    /**
     * Check if this attachment is an image.
     */
    public function isImage(): bool
    {
        return $this->type === 'image' || str_starts_with($this->mime_type, 'image/');
    }

    /**
     * Check if this attachment is a video.
     */
    public function isVideo(): bool
    {
        return $this->type === 'video' || str_starts_with($this->mime_type, 'video/');
    }

    /**
     * Check if this attachment is audio.
     */
    public function isAudio(): bool
    {
        return $this->type === 'audio' || str_starts_with($this->mime_type, 'audio/');
    }

    /**
     * Get human-readable file size.
     */
    public function getHumanFileSize(): string
    {
        $bytes = $this->size;
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));

        return round($bytes, 2) . ' ' . $units[$pow];
    }

    /**
     * Delete the physical file from storage when model is deleted.
     */
    protected static function booted()
    {
        static::deleting(function (self $attachment) {
            // Delete main file
            if (Storage::disk('public')->exists($attachment->path)) {
                Storage::disk('public')->delete($attachment->path);
            }

            // Delete thumbnail if exists
            if ($attachment->thumbnail_path && Storage::disk('public')->exists($attachment->thumbnail_path)) {
                Storage::disk('public')->delete($attachment->thumbnail_path);
            }
        });
    }
}
