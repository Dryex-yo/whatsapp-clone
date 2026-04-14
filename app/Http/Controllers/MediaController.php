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
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\GdDriver;

/**
 * MediaController - Handles media uploads and storage with optimization
 * 
 * Manages file uploads for messages with automatic image optimization:
 * - Converts images to WebP format for 25-40% better compression
 * - Auto-resizes large images to prevent storage bloat
 * - Generates optimized thumbnails for preview
 * - Reduces bandwidth usage for high-traffic applications
 */
class MediaController extends Controller
{
    private const MAX_IMAGE_WIDTH = 2048;
    private const MAX_IMAGE_HEIGHT = 2048;
    private const THUMBNAIL_SIZE = 300;
    private const WEBP_QUALITY = 80; // Balance between quality and file size
    private const WEBP_THUMBNAIL_QUALITY = 75;

    /**
     * Upload media for a message with optimization
     * 
     * - Automatically converts images to WebP format
     * - Compresses to reduce storage and bandwidth
     * - Generates optimized thumbnails
     * - Returns attachment resource
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

            // Process and store file
            $path = null;
            $width = null;
            $height = null;
            $thumbnailPath = null;
            $optimizedSize = null;

            if ($type === 'image') {
                // Handle image: optimize, resize, and convert to WebP
                [$path, $optimizedSize, $width, $height] = $this->storeOptimizedImage(
                    $file,
                    $directory,
                    $fileName
                );

                // Generate optimized thumbnail
                $thumbnailPath = $this->generateOptimizedThumbnail($path, $width, $height);
            } else {
                // Handle non-image files normally
                $path = $file->store($directory, 'public');
                $optimizedSize = $fileSize;
            }

            // Return response without creating message
            // Message creation happens after user confirms
            /** @var FilesystemAdapter $disk */
            $disk = Storage::disk('public');
            
            return response()->json([
                'success' => true,
                'file_name' => $fileName,
                'path' => $path,
                'mime_type' => $type === 'image' ? 'image/webp' : $mimeType,
                'size' => $optimizedSize ?? $fileSize,
                'original_size' => $fileSize,
                'compression_ratio' => $optimizedSize ? round(100 - (($optimizedSize / $fileSize) * 100), 2) : 0,
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
     * Store and optimize image: resize and convert to WebP
     * 
     * @return array [$path, $optimizedSize, $width, $height]
     */
    private function storeOptimizedImage(
        \Illuminate\Http\UploadedFile $file,
        string $directory,
        string $originalFileName
    ): array {
        try {
            $manager = new ImageManager(new GdDriver());
            $image = $manager->read($file->getPathname());

            // Get original dimensions
            $width = $image->width();
            $height = $image->height();

            // Resize if image is too large
            if ($width > self::MAX_IMAGE_WIDTH || $height > self::MAX_IMAGE_HEIGHT) {
                $image->scaleDown(
                    width: self::MAX_IMAGE_WIDTH,
                    height: self::MAX_IMAGE_HEIGHT
                );

                $width = $image->width();
                $height = $image->height();
            }

            // Convert to WebP with optimized quality
            $image->toWebp(self::WEBP_QUALITY);

            // Generate new filename with .webp extension
            $pathInfo = pathinfo($originalFileName);
            $webpFileName = "{$pathInfo['filename']}_" . time() . '.webp';
            $storagePath = "{$directory}/{$webpFileName}";

            // Get full path and save
            $disk = Storage::disk('public');
            $fullPath = $disk->path($storagePath);

            // Ensure directory exists
            if (!file_exists(dirname($fullPath))) {
                mkdir(dirname($fullPath), 0755, true);
            }

            // Save the WebP image
            $image->save($fullPath);

            // Get optimized file size
            $optimizedSize = filesize($fullPath);

            return [
                $storagePath,
                $optimizedSize,
                $width,
                $height,
            ];
        } catch (\Exception $e) {
            // Fallback: store original file if optimization fails
            $path = $file->store($directory, 'public');
            return [$path, $file->getSize(), null, null];
        }
    }

    /**
     * Generate optimized thumbnail with WebP conversion
     */
    private function generateOptimizedThumbnail(string $path, ?int $width, ?int $height): ?string
    {
        try {
            // Only generate thumbnail for reasonable image sizes
            if (!$width || !$height || ($width < 50 && $height < 50)) {
                return null;
            }

            $disk = Storage::disk('public');
            $fullPath = $disk->path($path);

            // Read image from storage path or from the actual file
            if (file_exists($fullPath)) {
                $manager = new ImageManager(new GdDriver());
                $image = $manager->read($fullPath);

                // Scale to thumbnail size
                $image->scaleDown(
                    width: self::THUMBNAIL_SIZE,
                    height: self::THUMBNAIL_SIZE
                );

                // Convert to WebP with lower quality for thumbnails
                $image->toWebp(self::WEBP_THUMBNAIL_QUALITY);

                // Save thumbnail
                $pathInfo = pathinfo($path);
                $thumbnailPath = "{$pathInfo['dirname']}/{$pathInfo['filename']}_thumb.webp";
                $thumbnailFullPath = $disk->path($thumbnailPath);

                // Ensure directory exists
                if (!file_exists(dirname($thumbnailFullPath))) {
                    mkdir(dirname($thumbnailFullPath), 0755, true);
                }

                $image->save($thumbnailFullPath);

                return $thumbnailPath;
            }
        } catch (\Exception $e) {
            // Silently fail - thumbnail generation is optional
        }

        return null;
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
}

