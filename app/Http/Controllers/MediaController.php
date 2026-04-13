<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\Conversation;
use App\Http\Resources\MessageAttachmentResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Filesystem\FilesystemAdapter;

/**
 * MediaController - Handles media uploads and storage
 * 
 * Manages file uploads for messages, generates thumbnails, and returns asset URLs
 */
class MediaController extends Controller
{
    /**
     * Upload media for a message
     * 
     * Validates file, processes it (generates thumbnails for images),
     * and returns attachment resource
     * 
     * @param Request $request
     * @param Conversation $conversation
     * @return JsonResponse
     */
    public function upload(Request $request, Conversation $conversation): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        // Authorize: User must be part of this conversation
        abort_unless($conversation->users->contains($user->id), 403);

        // Validate file upload
        $validated = $request->validate([
            'file' => 'required|file|max:52428800', // 50MB max
        ]);

        try {
            $file = $validated['file'];
            $fileName = $file->getClientOriginalName();
            $mimeType = $file->getMimeType();
            $fileSize = $file->getSize();

            // Determine file type
            $type = $this->determineFileType($mimeType);

            // Create storage directory if it doesn't exist
            $directory = "messages/{$conversation->id}";
            if (!Storage::disk('public')->exists($directory)) {
                Storage::disk('public')->makeDirectory($directory);
            }

            // Store file
            $path = $file->store($directory, 'public');

            // Extract image dimensions and generate thumbnail if image
            $width = null;
            $height = null;
            $thumbnailPath = null;

            if ($type === 'image') {
                [$width, $height] = $this->getImageDimensions($path);
                $thumbnailPath = $this->generateThumbnail($path, $width, $height);
            }

            // Return response without creating message
            // Message creation happens after user confirms
            /** @var FilesystemAdapter $disk */
            $disk = Storage::disk('public');
            
            return response()->json([
                'success' => true,
                'file_name' => $fileName,
                'path' => $path,
                'mime_type' => $mimeType,
                'size' => $fileSize,
                'type' => $type,
                'width' => $width,
                'height' => $height,
                'thumbnail_path' => $thumbnailPath,
                'url' => $disk->url($path),
                'thumbnail_url' => $thumbnailPath ? $disk->url($thumbnailPath) : null,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload file: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Create attachment for a message
     * 
     * Called after message is created to link the uploaded media to the message
     * 
     * @param Request $request
     * @param Message $message
     * @return JsonResponse
     */
    public function createAttachment(Request $request, Message $message): JsonResponse
    {
        $user = $request->user();

        // Authorize: Only message sender can add attachments
        abort_unless($message->user_id === $user->id, 403);

        $validated = $request->validate([
            'file_name' => 'required|string|max:255',
            'path' => 'required|string',
            'mime_type' => 'required|string',
            'size' => 'required|integer',
            'type' => 'required|string|in:image,video,audio,document',
            'width' => 'nullable|integer',
            'height' => 'nullable|integer',
            'thumbnail_path' => 'nullable|string',
        ]);

        try {
            // Create attachment
            $attachment = MessageAttachment::create([
                'message_id' => $message->id,
                'user_id' => $user->id,
                'file_name' => $validated['file_name'],
                'path' => $validated['path'],
                'mime_type' => $validated['mime_type'],
                'size' => $validated['size'],
                'type' => $validated['type'],
                'width' => $validated['width'] ?? null,
                'height' => $validated['height'] ?? null,
                'thumbnail_path' => $validated['thumbnail_path'] ?? null,
                'status' => 'completed',
            ]);

            return response()->json(new MessageAttachmentResource($attachment), 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create attachment: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Delete an attachment
     * 
     * Removes the physical file and database record
     * 
     * @param MessageAttachment $attachment
     * @return JsonResponse
     */
    public function destroy(MessageAttachment $attachment): JsonResponse
    {
        // @noinspection PhpUndefinedMethodInspection
        /** @var User $user */
        $user = auth()->user();

        // Authorize: Only uploader or conversation members can delete
        abort_unless(
            $attachment->user_id === $user->id || 
            $attachment->message->conversation->users->contains($user->id),
            403
        );

        try {
            $attachment->delete(); // Model deletes physical files via observer

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete attachment: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Determine file type from MIME type
     */
    private function determineFileType(string $mimeType): string
    {
        if (str_starts_with($mimeType, 'image/')) {
            return 'image';
        } elseif (str_starts_with($mimeType, 'video/')) {
            return 'video';
        } elseif (str_starts_with($mimeType, 'audio/')) {
            return 'audio';
        }

        return 'document';
    }

    /**
     * Get image dimensions
     */
    private function getImageDimensions(string $path): array
    {
        try {
            $fullPath = Storage::disk('public')->path($path);

            if (function_exists('getimagesize')) {
                $size = getimagesize($fullPath);
                if ($size !== false) {
                    return [$size[0], $size[1]];
                }
            }
        } catch (\Exception $e) {
            // Silently fail - dimensions aren't critical
        }

        return [null, null];
    }

    /**
     * Generate thumbnail for image
     */
    private function generateThumbnail(string $path, ?int $width, ?int $height): ?string
    {
        try {
            // Only generate thumbnail for reasonable image sizes
            if (!$width || !$height || ($width < 50 && $height < 50)) {
                return null;
            }

            /** @var FilesystemAdapter $disk */
            $disk = Storage::disk('public');
            $fullPath = $disk->path($path);

            // Use Intervention Image if available
            if (class_exists('Intervention\Image\ImageManager')) {
                // @noinspection PhpUndefinedClassInspection
                $manager = new \Intervention\Image\ImageManager(new \Intervention\Image\Drivers\GdDriver());
                $image = $manager->read($fullPath);

                // Resize to thumbnail (max 300x300)
                $image->scale(300, 300);

                // Save thumbnail
                $pathInfo = pathinfo($path);
                $thumbnailPath = "{$pathInfo['dirname']}/{$pathInfo['filename']}_thumb.{$pathInfo['extension']}";
                $thumbnailFullPath = $disk->path($thumbnailPath);

                $image->save($thumbnailFullPath);

                return $thumbnailPath;
            }
        } catch (\Exception $e) {
            // Silently fail - thumbnail generation is optional
        }

        return null;
    }
}
