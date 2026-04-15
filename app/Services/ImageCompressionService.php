<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\GdDriver;

class ImageCompressionService
{
    protected ImageManager $imageManager;

    public function __construct()
    {
        $this->imageManager = new ImageManager(new GdDriver());
    }

    /**
     * Compress and optimize an image file
     *
     * @param UploadedFile $file The image file to compress
     * @param int $maxWidth Maximum width for the image
     * @param int $maxHeight Maximum height for the image
     * @param int $quality JPEG quality (0-100)
     * @return UploadedFile The compressed image file
     */
    public function compress(
        UploadedFile $file,
        int $maxWidth = 800,
        int $maxHeight = 800,
        int $quality = 85
    ): UploadedFile {
        try {
            // Read the image
            $image = $this->imageManager->read($file->getPathname());

            // Get original dimensions
            $originalWidth = $image->width();
            $originalHeight = $image->height();

            // Calculate new dimensions while maintaining aspect ratio
            $ratio = min($maxWidth / $originalWidth, $maxHeight / $originalHeight, 1);

            if ($ratio < 1) {
                $newWidth = (int)($originalWidth * $ratio);
                $newHeight = (int)($originalHeight * $ratio);

                $image = $image->scale($newWidth, $newHeight);
            }

            // Convert to JPEG for better compression
            $compressed = $image->toJpeg($quality);

            // Create a temporary file
            $tempPath = tempnam(sys_get_temp_dir(), 'img_');
            file_put_contents($tempPath, $compressed);

            // Create a new UploadedFile from the compressed image
            $compressedFile = new UploadedFile(
                $tempPath,
                $file->getClientOriginalName(),
                'image/jpeg',
                null,
                true
            );

            return $compressedFile;
        } catch (\Exception $e) {
            throw new \Exception('Image compression failed: ' . $e->getMessage());
        }
    }

    /**
     * Compress image specifically for profile pictures (circular)
     *
     * @param UploadedFile $file The image file to compress
     * @param int $size Size of the profile picture (width and height)
     * @param int $quality JPEG quality (0-100)
     * @return UploadedFile The compressed profile picture
     */
    public function compressProfilePicture(
        UploadedFile $file,
        int $size = 400,
        int $quality = 85
    ): UploadedFile {
        return $this->compress($file, $size, $size, $quality);
    }

    /**
     * Get image statistics before and after compression
     *
     * @param UploadedFile $originalFile The original file
     * @param UploadedFile $compressedFile The compressed file
     * @return array Statistics about compression
     */
    public function getCompressionStats(UploadedFile $originalFile, UploadedFile $compressedFile): array
    {
        $originalSize = $originalFile->getSize();
        $compressedSize = $compressedFile->getSize();
        $reduction = $originalSize - $compressedSize;
        $reductionPercent = $originalSize > 0 ? round(($reduction / $originalSize) * 100, 2) : 0;

        return [
            'original_size' => $this->formatBytes($originalSize),
            'original_size_bytes' => $originalSize,
            'compressed_size' => $this->formatBytes($compressedSize),
            'compressed_size_bytes' => $compressedSize,
            'reduction' => $this->formatBytes($reduction),
            'reduction_bytes' => $reduction,
            'reduction_percent' => $reductionPercent,
        ];
    }

    /**
     * Format bytes to human-readable format
     *
     * @param int $bytes The number of bytes
     * @param int $precision Decimal precision
     * @return string Formatted size
     */
    private function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, $precision) . ' ' . $units[$i];
    }
}
