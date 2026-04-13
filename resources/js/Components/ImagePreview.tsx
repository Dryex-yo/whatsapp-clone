import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import type { UploadPreview } from '@/types/media';

interface ImagePreviewProps {
    preview: UploadPreview | null;
    loading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    isSubmitting?: boolean;
}

/**
 * ImagePreview Component
 *
 * Shows a preview of the selected file before sending the message.
 * Displays image thumbnail, file info, and confirm/cancel buttons.
 */
export function ImagePreview({
    preview,
    loading,
    onConfirm,
    onCancel,
    isSubmitting = false,
}: ImagePreviewProps) {
    if (!preview) return null;

    const getFileIcon = () => {
        switch (preview.type) {
            case 'image':
                return '🖼️';
            case 'video':
                return '🎥';
            case 'audio':
                return '🎵';
            case 'document':
                return '📄';
            default:
                return '📎';
        }
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const isImage = preview.type === 'image';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onCancel}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Preview
                    </h3>
                    <button
                        onClick={onCancel}
                        disabled={isSubmitting || loading}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Preview Image/Icon */}
                    {isImage && preview.url ? (
                        <div className="mb-4">
                            <img
                                src={preview.url}
                                alt={preview.file_name}
                                className="w-full h-64 object-cover rounded-lg bg-gray-100 dark:bg-gray-700"
                            />
                        </div>
                    ) : (
                        <div className="mb-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 w-full h-64 rounded-lg flex items-center justify-center">
                            <span className="text-6xl">{getFileIcon()}</span>
                        </div>
                    )}

                    {/* File Details */}
                    <div className="space-y-2 mb-6">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {preview.file_name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {preview.type.charAt(0).toUpperCase() +
                                preview.type.slice(1)}{' '}
                            • {formatBytes(preview.size)}
                        </p>

                        {/* Image Dimensions */}
                        {isImage && preview.width && preview.height && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {preview.width}×{preview.height} pixels
                            </p>
                        )}

                        {/* Duration for Video/Audio */}
                        {(preview.type === 'video' ||
                            preview.type === 'audio') &&
                            preview.duration && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {Math.floor(preview.duration / 60)}:
                                    {String(preview.duration % 60).padStart(
                                        2,
                                        '0'
                                    )}{' '}
                                    minutes
                                </p>
                            )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            disabled={isSubmitting || loading}
                            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isSubmitting || loading}
                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {isSubmitting && (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            )}
                            {isSubmitting ? 'Sending...' : 'Send'}
                        </button>
                    </div>
                </div>

                {/* Loading indicator during upload */}
                {loading && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-lg">
                        <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
