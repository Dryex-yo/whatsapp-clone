import React, { useEffect, useState } from 'react';
import { X, Star, Calendar, MessageCircle, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStarredMessages } from '@/hooks/useStarredMessages';
import { StarButton } from '@/Components/Chat/StarButton';
import type { Message, Conversation } from '@/types/chat';

export interface StarredMessagesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * StarredMessagesModal Component
 * Displays all starred messages grouped by conversation
 * Allows users to view and unstar messages
 */
export const StarredMessagesModal: React.FC<StarredMessagesModalProps> = ({
    isOpen,
    onClose,
}) => {
    const {
        starredMessages,
        groupedByConversation,
        isLoading,
        error,
        totalCount,
        fetchStarredMessages,
    } = useStarredMessages();

    useEffect(() => {
        if (isOpen) {
            fetchStarredMessages();
        }
    }, [isOpen, fetchStarredMessages]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black bg-opacity-50 z-40"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            className="w-full max-w-2xl max-h-[80vh] bg-[#111b21] rounded-lg shadow-xl flex flex-col border border-[#1f2937]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-[#1f2937]">
                                <div className="flex items-center gap-3">
                                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                    <h2 className="text-lg font-semibold text-white">
                                        Starred Messages
                                    </h2>
                                    {totalCount > 0 && (
                                        <span className="text-sm text-gray-400">
                                            ({totalCount})
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-1 hover:bg-[#202c33] rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto">
                                {isLoading && (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        className="flex items-center justify-center p-8"
                                    >
                                        <Loader className="w-6 h-6 text-[#005c4b]" />
                                    </motion.div>
                                )}

                                {error && (
                                    <div className="p-4 text-center text-red-400">
                                        {error}
                                    </div>
                                )}

                                {!isLoading && totalCount === 0 && (
                                    <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                                        <Star className="w-8 h-8 mb-2 opacity-50" />
                                        <p>No starred messages yet</p>
                                        <p className="text-sm">Star messages to save them for later</p>
                                    </div>
                                )}

                                {!isLoading && groupedByConversation.length > 0 && (
                                    <div className="space-y-4 p-4">
                                        {groupedByConversation.map((group) => (
                                            <motion.div
                                                key={group.conversation.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="border border-[#1f2937] rounded-lg overflow-hidden"
                                            >
                                                {/* Conversation Header */}
                                                <div className="bg-[#202c33] px-4 py-3 flex items-center gap-3 border-b border-[#1f2937]">
                                                    <MessageCircle className="w-4 h-4 text-[#005c4b]" />
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-white text-sm">
                                                            {group.conversation.name || 'Direct Message'}
                                                        </h3>
                                                        <p className="text-xs text-gray-400">
                                                            {group.messages.length} starred
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Messages */}
                                                <div className="divide-y divide-[#1f2937]">
                                                    {group.messages.map((message) => (
                                                        <StarredMessageItem
                                                            key={message.id}
                                                            message={message}
                                                            conversation={group.conversation}
                                                        />
                                                    ))}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

interface StarredMessageItemProps {
    message: Message;
    conversation: Conversation;
}

/**
 * Individual starred message item
 */
const StarredMessageItem: React.FC<StarredMessageItemProps> = ({
    message,
    conversation,
}) => {
    const [isStarred, setIsStarred] = useState(true);

    const formattedDate = message.created_at
        ? new Date(message.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : '';

    if (!isStarred) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-3 hover:bg-[#1f2937] transition-colors"
        >
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden">
                    <img
                        src={
                            message.user?.avatar ||
                            `https://ui-avatars.com/api/?name=${message.user?.name}`
                        }
                        alt={message.user?.name}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-sm text-white truncate">
                            {message.user?.name}
                        </h4>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                            {formattedDate}
                        </span>
                    </div>

                    {/* Message Body */}
                    <p className="text-sm text-gray-300 break-words line-clamp-2">
                        {message.body}
                    </p>
                </div>

                {/* Star Button */}
                <div className="flex-shrink-0">
                    <StarButton
                        messageId={message.id}
                        isStarred={true}
                        onStarToggle={(starred) => {
                            if (!starred) {
                                setIsStarred(false);
                            }
                        }}
                        size={16}
                    />
                </div>
            </div>
        </motion.div>
    );
};
