import React, { useState } from 'react';
import { Download, X, ZoomIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { AudioPlayer } from '@/Components/Chat/AudioPlayer';
import type { MessageAttachment } from '@/types/chat';

interface ImageMessageProps {
    attachment: MessageAttachment;
    isOwn: boolean;
    maxWidth?: number;
}

/**
 * ImageMessage Component
 *
 * Renders media attachments in message bubbles.
 * Supports images with click-to-expand, videos with thumbnails, audio/document links.
 * Shows loading skeleton while image is loading.
 */
export function ImageMessage({
    attachment,
    isOwn,
    maxWidth = 300,
}: ImageMessageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [imageError, setImageError] = useState(false);

    const handleImageLoad = () => {
        setIsLoading(false);
    };

    const handleImageError = () => {
        setIsLoading(false);
        setImageError(true);
    };

    const getFileIcon = () => {
        switch (attachment.type) {
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
        return (
            Math.round((bytes / Math.pow(k, i)) * 100) / 100 +
            ' ' +
            sizes[i]
        );
    };

    // Status badge
    if (attachment.status !== 'completed') {
        return (
            <div
                className={`flex gap-2 items-center p-3 rounded-lg text-sm max-w-xs ${
                    isOwn
                        ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                }`}
            >
                {attachment.status === 'failed' ? (
                    <>
                        <span className="text-lg">❌</span>
                        <div>
                            <p className="font-medium">Upload failed</p>
                            <p className="text-xs opacity-80">
                                {attachment.file_name}
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <div>
                            <p className="font-medium">Processing</p>
                            <p className="text-xs opacity-80">
                                {attachment.file_name}
                            </p>
                        </div>
                    </>
                )}
            </div>
        );
    }

    // Image rendering
    if (attachment.type === 'image' && attachment.url) {
        const imageUrl = attachment.thumbnail_url || attachment.url;

        return (
            <>
                <motion.div
                    className="relative cursor-pointer group bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden"
                    style={{
                        maxWidth: maxWidth,
                        aspectRatio:
                            attachment.width && attachment.height
                                ? `${attachment.width} / ${attachment.height}`
                                : 'auto',
                    }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setIsExpanded(true)}
                >
                    {/* Image */}
                    <img
                        src={imageUrl}
                        alt={attachment.file_name}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        className="w-full h-full object-cover"
                    />

                    {/* Loading Skeleton */}
                    {isLoading && (
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-600 dark:via-gray-700 dark:to-gray-600 animate-pulse" />
                    )}

                    {/* Error State */}
                    {imageError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                            <span className="text-3xl">❌</span>
                        </div>
                    )}

                    {/* Hover Overlay */}
                    {!isLoading && !imageError && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <ZoomIn className="w-6 h-6 text-white" />
                        </div>
                    )}
                </motion.div>

                {/* File Info */}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {attachment.file_name}
                </p>

                {/* Expanded View */}
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                        onClick={() => setIsExpanded(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="relative max-w-4xl w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={attachment.url}
                                alt={attachment.file_name}
                                className="w-full h-auto object-contain"
                            />

                            {/* Close Button */}
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            {/* Download Button */}
                            <a
                                href={attachment.url}
                                download={attachment.file_name}
                                className="absolute bottom-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                            >
                                <Download className="w-6 h-6" />
                            </a>
                        </motion.div>
                    </motion.div>
                )}
            </>
        );
    }

    // Video rendering with thumbnail
    if (attachment.type === 'video' && attachment.thumbnail_url) {
        const duration = attachment.duration
            ? `${Math.floor(attachment.duration / 60)}:${String(attachment.duration % 60).padStart(2, '0')}`
            : 'Unknown';

        return (
            <motion.a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative cursor-pointer group bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden block"
                style={{
                    maxWidth: maxWidth,
                    aspectRatio: '16 / 9',
                }}
                whileHover={{ scale: 1.02 }}
            >
                {/* Thumbnail */}
                <img
                    src={attachment.thumbnail_url}
                    alt={attachment.file_name}
                    className="w-full h-full object-cover"
                />

                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/80 group-hover:bg-white rounded-full flex items-center justify-center transition-colors">
                        <span className="text-xl">▶️</span>
                    </div>
                </div>

                {/* Duration Badge */}
                <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {duration}
                </span>
            </motion.a>
        );
    }

    // Audio rendering
    if (attachment.type === 'audio') {
        return (
            <AudioPlayer
                src={attachment.url}
                fileName={attachment.file_name}
                duration={attachment.duration}
                fileSize={attachment.human_size}
                isOwn={isOwn}
            />
        );
    }

    // Document/File rendering
    if (attachment.type === 'document') {
        return (
            <motion.a
                href={attachment.url}
                download={attachment.file_name}
                className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg p-3 max-w-xs transition-colors group"
                whileHover={{ scale: 1.02 }}
            >
                <span className="text-2xl flex-shrink-0">{getFileIcon()}</span>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {attachment.file_name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        {attachment.human_size}
                    </p>
                </div>
                <Download className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex-shrink-0" />
            </motion.a>
        );
    }

    // Fallback
    return null;
}
