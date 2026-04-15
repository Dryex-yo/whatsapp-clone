import { useState, useCallback } from 'react';
import ReactEasyCrop, { Area, Point } from 'react-easy-crop';

interface ImageCropperProps {
    imageSrc: string;
    onCropComplete: (croppedImageBlob: Blob) => void;
    onCancel: () => void;
    resetTrigger?: boolean;
}

function getCroppedImage(
    imageSrc: string,
    pixelCrop: Area
): Promise<Blob> {
    return new Promise((resolve) => {
        const image = new Image();
        image.src = imageSrc;
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;

            // Create circular image
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('No 2d context');
            }

            const maxDim = Math.max(
                pixelCrop.width * scaleX,
                pixelCrop.height * scaleY
            );

            canvas.width = maxDim;
            canvas.height = maxDim;

            // Draw circular crop
            ctx.beginPath();
            ctx.arc(maxDim / 2, maxDim / 2, maxDim / 2, 0, 2 * Math.PI);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.clip();

            // Position image
            ctx.drawImage(
                image,
                pixelCrop.x * scaleX,
                pixelCrop.y * scaleY,
                pixelCrop.width * scaleX,
                pixelCrop.height * scaleY,
                0,
                0,
                maxDim,
                maxDim
            );

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                }
            }, 'image/jpeg', 0.95);
        };
    });
}

export default function ImageCropper({
    imageSrc,
    onCropComplete,
    onCancel,
    resetTrigger = false,
}: ImageCropperProps) {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppingArea, setCroppingArea] = useState<Area | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCropAreaChange = useCallback(
        (_crop: unknown, croppedAreaPixels: Area) => {
            setCroppingArea(croppedAreaPixels);
        },
        []
    );

    const handleSaveCrop = async () => {
        if (!croppingArea) return;

        try {
            setIsProcessing(true);
            const croppedImageBlob = await getCroppedImage(imageSrc, croppingArea);
            onCropComplete(croppedImageBlob);
        } catch (error) {
            console.error('Error cropping image:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                        Crop Profile Picture
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Adjust and move the circle to frame your photo
                    </p>
                </div>

                <div className="relative w-full h-96 bg-gray-100">
                    <ReactEasyCrop
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onCropAreaChange={handleCropAreaChange}
                        onZoomChange={setZoom}
                    />
                </div>

                {/* Zoom Slider */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Zoom
                    </label>
                    <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.1}
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className="w-full"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-4 justify-end">
                    <button
                        onClick={onCancel}
                        disabled={isProcessing}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveCrop}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Processing...
                            </>
                        ) : (
                            'Save Crop'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
