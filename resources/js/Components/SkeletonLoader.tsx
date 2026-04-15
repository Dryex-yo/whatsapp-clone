import React from 'react';
import { motion } from 'framer-motion';

/**
 * SkeletonLoader component
 * Shows a loading skeleton UI that mimics the layout of:
 * - Sidebar with conversations
 * - Chat messages area
 */

interface SkeletonLoaderProps {
    /**
     * Type of skeleton to show
     * 'full' - sidebar + messages (default)
     * 'messages' - only messages area
     * 'sidebar' - only sidebar
     */
    type?: 'full' | 'messages' | 'sidebar';
}

const shimmer = {
    initial: { opacity: 0.6 },
    animate: { opacity: 1 },
    transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: 'reverse' as const,
    },
};

/**
 * SkeletonAvatar - Animated skeleton avatar
 */
const SkeletonAvatar: React.FC = () => (
    <motion.div
        {...shimmer}
        className="w-10 h-10 rounded-full bg-[#2a3942]"
    />
);

/**
 * SkeletonConversationItem - Skeleton for a conversation item in sidebar
 */
const SkeletonConversationItem: React.FC = () => (
    <div className="flex gap-3 p-3 border-b border-[#2a3942]">
        <SkeletonAvatar />
        <div className="flex-1 space-y-2">
            <motion.div
                {...shimmer}
                className="h-4 bg-[#2a3942] rounded w-3/4"
            />
            <motion.div
                {...shimmer}
                className="h-3 bg-[#1f2937] rounded w-1/2"
            />
        </div>
    </div>
);

/**
 * SkeletonSidebar - Skeleton for the conversation sidebar
 */
const SkeletonSidebar: React.FC = () => (
    <div className="w-80 bg-[#111b21] border-r border-[#2a3942] flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-[#2a3942] space-y-3">
            <motion.div
                {...shimmer}
                className="h-8 bg-[#2a3942] rounded w-1/2"
            />
            <motion.div
                {...shimmer}
                className="h-10 bg-[#202c33] rounded"
            />
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
            {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonConversationItem key={i} />
            ))}
        </div>
    </div>
);

/**
 * SkeletonMessageBubble - Skeleton for a single message
 */
const SkeletonMessageBubble: React.FC<{ isOwn?: boolean }> = ({ isOwn = false }) => (
    <div className={`flex gap-2 mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        {!isOwn && <SkeletonAvatar />}
        <motion.div
            {...shimmer}
            className={`h-10 bg-[#2a3942] rounded-lg ${
                isOwn ? 'w-40' : 'w-48'
            }`}
        />
    </div>
);

/**
 * SkeletonChatArea - Skeleton for the chat messages area
 */
const SkeletonChatArea: React.FC = () => (
    <div className="flex-1 flex flex-col bg-[#0a0e11]">
        {/* Chat Header */}
        <div className="h-16 border-b border-[#2a3942] flex items-center justify-between px-4 bg-[#111b21]">
            <div className="space-y-2 flex-1">
                <motion.div
                    {...shimmer}
                    className="h-5 bg-[#2a3942] rounded w-1/3"
                />
                <motion.div
                    {...shimmer}
                    className="h-4 bg-[#1f2937] rounded w-1/4"
                />
            </div>
            <motion.div
                {...shimmer}
                className="w-10 h-10 rounded-full bg-[#2a3942]"
            />
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <SkeletonMessageBubble />
            <SkeletonMessageBubble isOwn />
            <SkeletonMessageBubble />
            <SkeletonMessageBubble isOwn />
            <SkeletonMessageBubble />
            <SkeletonMessageBubble isOwn />

            {/* Date divider skeleton */}
            <div className="flex items-center gap-2 py-2">
                <motion.div
                    {...shimmer}
                    className="flex-1 h-px bg-[#2a3942]"
                />
                <motion.div
                    {...shimmer}
                    className="h-6 bg-[#2a3942] rounded-full w-20"
                />
                <motion.div
                    {...shimmer}
                    className="flex-1 h-px bg-[#2a3942]"
                />
            </div>

            <SkeletonMessageBubble />
            <SkeletonMessageBubble isOwn />
            <SkeletonMessageBubble />
        </div>

        {/* Input Area */}
        <div className="h-16 border-t border-[#2a3942] flex items-center gap-2 px-4 bg-[#111b21]">
            <motion.div
                {...shimmer}
                className="w-10 h-10 rounded-full bg-[#2a3942]"
            />
            <motion.div
                {...shimmer}
                className="flex-1 h-10 rounded-2xl bg-[#2a3942]"
            />
            <motion.div
                {...shimmer}
                className="w-10 h-10 rounded-full bg-[#2a3942]"
            />
        </div>
    </div>
);

/**
 * SkeletonLoader Component
 * Shows appropriate skeleton based on the type prop
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type = 'full' }) => {
    if (type === 'sidebar') {
        return <SkeletonSidebar />;
    }

    if (type === 'messages') {
        return <SkeletonChatArea />;
    }

    // Full layout with sidebar and chat area
    return (
        <div className="flex h-full">
            <SkeletonSidebar />
            <SkeletonChatArea />
        </div>
    );
};

export default SkeletonLoader;
