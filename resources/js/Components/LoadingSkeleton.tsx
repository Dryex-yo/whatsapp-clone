import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
    width?: number | string;
    height?: number | string;
    aspectRatio?: string;
    className?: string;
}

/**
 * LoadingSkeleton Component
 *
 * Displays a gradient animation skeleton while images are loading.
 * Used as placeholder for ImageMessage before image is loaded.
 */
export function LoadingSkeleton({
    width = 300,
    height = undefined,
    aspectRatio = '16 / 9',
    className = '',
}: LoadingSkeletonProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`relative overflow-hidden rounded-lg bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 ${className}`}
            style={{
                width: width,
                height: height,
                aspectRatio: !height ? aspectRatio : undefined,
            }}
        >
            {/* Shimmer Animation */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10"
                animate={{
                    x: ['-100%', '100%'],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            />
        </motion.div>
    );
}

/**
 * MessageSkeleton Component
 *
 * Skeletal loading state for message bubble with attachment.
 */
export function MessageSkeleton() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start gap-3 mb-4"
        >
            {/* Avatar Skeleton */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex-shrink-0 mt-6" />

            <div className="flex-1 space-y-2">
                {/* Message Bubble Skeleton */}
                <div className="max-w-xs">
                    {/* Image Skeleton */}
                    <LoadingSkeleton
                        width="100%"
                        height={200}
                        className="mb-2"
                    />

                    {/* Text Skeleton */}
                    <div className="bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg p-3 space-y-2">
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                </div>

                {/* Timestamp Skeleton */}
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 ml-3" />
            </div>
        </motion.div>
    );
}
