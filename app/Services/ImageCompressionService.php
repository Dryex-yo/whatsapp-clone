<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;

class ImageCompressionService
{
    /**
     * Compress and optimize an image file using native GD library
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
            // Get image info
            $imageInfo = @getimagesize($file->getPathname());
            if (!$imageInfo) {
                throw new \Exception('Invalid image file');
            }

            $originalWidth = $imageInfo[0];
            $originalHeight = $imageInfo[1];
            $mimeType = $imageInfo['mime'];

            // Load the image based on type
            switch ($mimeType) {
                case 'image/jpeg':
                    $image = imagecreatefromjpeg($file->getPathname());
                    break;
                case 'image/png':
                    $image = imagecreatefrompng($file->getPathname());
                    break;
                case 'image/gif':
                    $image = imagecreatefromgif($file->getPathname());
                    break;
                case 'image/webp':
                    $image = imagecreatefromwebp($file->getPathname());
                    break;
                default:
                    throw new \Exception('Unsupported image format');
            }

            if (!$image) {
                throw new \Exception('Failed to load image');
            }

            // Calculate new dimensions while maintaining aspect ratio
            $ratio = min($maxWidth / $originalWidth, $maxHeight / $originalHeight, 1);

            if ($ratio < 1) {
                $newWidth = (int)($originalWidth * $ratio);
                $newHeight = (int)($originalHeight * $ratio);

                $resized = imagecreatetruecolor($newWidth, $newHeight);
                
                // Handle transparency for PNG
                if ($mimeType === 'image/png') {
                    imagealphablending($resized, false);
                    imagesavealpha($resized, true);
                    $transparent = imagecolorallocatealpha($resized, 255, 255, 255, 127);
                    imagefilledrectangle($resized, 0, 0, $newWidth, $newHeight, $transparent);
                }

                imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $originalWidth, $originalHeight);
                imagedestroy($image);
                $image = $resized;
            }

            // Create a temporary file
            $tempPath = tempnam(sys_get_temp_dir(), 'img_');
            
            // Save as JPEG with quality
            imagejpeg($image, $tempPath, $quality);
            imagedestroy($image);

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
