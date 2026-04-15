<?php

namespace App\Models;

use Database\Factories\MessageFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Carbon\Carbon;

/**
 * Message Model - Represents individual messages in conversations
 * 
 * @property int $id
 * @property int $conversation_id
 * @property int $user_id Sender ID
 * @property string|null $body Message content
 * @property string|null $encrypted_body Encrypted message body (End-to-End Encryption)
 * @property bool $is_encrypted Flag indicating if message is encrypted
 * @property string $type Message type (text, image, file)
 * @property string $status Message status (sent, delivered, read)
 * @property string|null $file_path Path to file/image
 * @property int|null $file_size Size in bytes
 * @property string|null $mime_type MIME type of file
 * @property Carbon|null $read_at Read receipt timestamp
 * @property Carbon|null $edited_at When message was edited
 * @property Carbon|null $deleted_at Soft delete timestamp
 * @property Carbon|null $disappears_at When the message should be auto-deleted (Ephemeral Messages)
 * @property bool $is_ephemeral Flag indicating if message is ephemeral (disappearing)
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class Message extends Model
{
    use SoftDeletes, HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'conversation_id',
        'user_id',
        'body',
        'encrypted_body',
        'is_encrypted',
        'type',
        'status',
        'file_path',
        'file_size',
        'mime_type',
        'read_at',
        'edited_at',
        'disappears_at',
        'is_ephemeral',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
            'edited_at' => 'datetime',
            'deleted_at' => 'datetime',
            'disappears_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'file_size' => 'integer',
            'status' => 'string',
            'is_encrypted' => 'boolean',
            'is_ephemeral' => 'boolean',
        ];
    }

    /**
     * Get the conversation this message belongs to.
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * Get the sender (user) of this message.
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Alias for sender() relation for better readability in some contexts.
     */
    public function user(): BelongsTo
    {
        return $this->sender();
    }

    /**
     * Get the attachments (media files) for this message.
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(MessageAttachment::class);
    }

    /**
     * Get the users who have starred this message.
     */
    public function starredBy(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'starred_messages',
            'message_id',
            'user_id'
        )->withTimestamps();
    }

    /**
     * Check if message is starred by the given user.
     */
    public function isStarredBy(User $user): bool
    {
        return $this->starredBy()->where('user_id', $user->id)->exists();
    }

    /**
     * Check if this message has been read.
     */
    public function isRead(): Attribute
    {
        return Attribute::make(
            get: fn() => $this->read_at !== null,
        );
    }

    /**
     * Check if this message has been edited.
     */
    public function isEdited(): Attribute
    {
        return Attribute::make(
            get: fn() => $this->edited_at !== null,
        );
    }

    /**
     * Format file size as human-readable string.
     */
    public function formattedFileSize(): Attribute
    {
        return Attribute::make(
            get: fn() => $this->formatBytes($this->file_size ?? 0),
        );
    }

    /**
     * Check if message is sent.
     */
    public function isSent(): Attribute
    {
        return Attribute::make(
            get: fn() => $this->status === 'sent',
        );
    }

    /**
     * Check if message is delivered.
     */
    public function isDelivered(): Attribute
    {
        return Attribute::make(
            get: fn() => in_array($this->status, ['delivered', 'read']),
        );
    }

    /**
     * Mark message as delivered.
     * Updates the status to 'delivered' when recipient opens the conversation.
     * 
     * @return void
     */
    public function markAsDelivered(): void
    {
        if ($this->status === 'sent') {
            $this->update(['status' => 'delivered']);
        }
    }

    /**
     * Mark message as read.
     * Updates the status to 'read' and sets the read_at timestamp.
     * 
     * @return void
     */
    public function markAsRead(): void
    {
        if ($this->status !== 'read') {
            $this->update([
                'status' => 'read',
                'read_at' => now(),
            ]);
        }
    }

    /**
     * Check if message can be edited.
     * Messages can only be edited within 15 minutes of creation.
     * 
     * @return bool
     */
    public function canEdit(): bool
    {
        return $this->created_at->diffInMinutes(now()) < 15;
    }

    /**
     * Format bytes as human-readable file size string.
     * 
     * @param int $bytes
     * @param int $precision
     * @return string
     */
    private function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));

        return round($bytes, $precision) . ' ' . $units[$pow];
    }

    /**
     * Mark message as ephemeral (disappearing in 24 hours).
     * Sets the disappears_at timestamp and is_ephemeral flag.
     * 
     * @return void
     */
    public function markAsEphemeral(): void
    {
        if (!$this->is_ephemeral) {
            $this->update([
                'is_ephemeral' => true,
                'disappears_at' => now()->addHours(24),
            ]);
        }
    }

    /**
     * Check if message is ephemeral (disappearing).
     * 
     * @return bool
     */
    public function isEphemeral(): bool
    {
        return $this->is_ephemeral && $this->disappears_at !== null;
    }

    /**
     * Check if message should have disappeared (past disappears_at time).
     * 
     * @return bool
     */
    public function shouldBeDeleted(): bool
    {
        return $this->is_ephemeral && $this->disappears_at && $this->disappears_at->isPast();
    }

    /**
     * Get time remaining before message disappears.
     * Returns null if not ephemeral or already disappeared.
     * 
     * @return string|null
     */
    public function timeUntilDisappears(): ?string
    {
        if (!$this->isEphemeral()) {
            return null;
        }

        if ($this->shouldBeDeleted()) {
            return 'Expired';
        }

        return $this->disappears_at->diffForHumans();
    }

    /**
     * Mark message as encrypted.
     * 
     * @param bool $encrypted
     * @return void
     */
    public function setEncryption(bool $encrypted = true): void
    {
        if ($this->is_encrypted !== $encrypted) {
            $this->update(['is_encrypted' => $encrypted]);
        }
    }

    /**
     * Check if message is encrypted.
     * 
     * @return bool
     */
    public function isEncrypted(): bool
    {
        return $this->is_encrypted && $this->encrypted_body !== null;
    }
}
