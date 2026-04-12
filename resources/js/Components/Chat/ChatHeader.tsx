import React from 'react';
import { MessageSquare, Phone, Video, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Conversation, User } from '@/types/chat';

export interface ChatHeaderProps {
    conversation: Conversation;
    currentUser: User;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ conversation, currentUser }) => {
    // Ensure users is an array before calling find
    const usersArray = Array.isArray(conversation.users) ? conversation.users : [];
    const otherUser = usersArray.find((u: User) => u.id !== currentUser.id) || conversation.other_user;
    const displayName = conversation.name || otherUser?.name || 'Unknown';
    const isOnline = otherUser?.last_seen && 
        new Date(otherUser.last_seen).getTime() > Date.now() - 5 * 60 * 1000;

    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-[60px] px-6 bg-[#202c33] border-b border-[#1f2937] flex items-center justify-between flex-shrink-0"
        >
            {/* Left Section: Name & Status */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                >
                    <img
                        src={otherUser?.avatar || `https://ui-avatars.com/api/?name=${displayName}`}
                        alt={displayName}
                        className="w-full h-full object-cover"
                    />
                </motion.div>

                <div className="min-w-0">
                    <h2 className="text-[15px] font-500 text-gray-100 truncate">
                        {displayName}
                    </h2>
                    <p className="text-xs text-gray-400">
                        {isOnline ? (
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-[#31a24c] rounded-full"></span>
                                Online
                            </span>
                        ) : (
                            `Last seen ${new Date(otherUser?.last_seen || '').toLocaleTimeString()}`
                        )}
                    </p>
                </div>
            </div>

            {/* Right Section: Action Icons */}
            <div className="flex items-center gap-4 text-gray-400">
                <motion.button
                    whileHover={{ scale: 1.1, color: '#00d084' }}
                    whileTap={{ scale: 0.95 }}
                    className="transition"
                >
                    <Phone className="w-5 h-5" />
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.1, color: '#00d084' }}
                    whileTap={{ scale: 0.95 }}
                    className="transition"
                >
                    <Video className="w-5 h-5" />
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.1, color: '#00d084' }}
                    whileTap={{ scale: 0.95 }}
                    className="transition"
                >
                    <MoreVertical className="w-5 h-5" />
                </motion.button>
            </div>
        </motion.header>
    );
};

/**
 * Minimal header for when no conversation is selected
 */
export interface ChatHeaderOnlyProps {
    title: string;
}

export const ChatHeaderOnly: React.FC<ChatHeaderOnlyProps> = ({ title }) => {
    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-[60px] px-6 bg-[#202c33] border-b border-[#1f2937] flex items-center justify-between flex-shrink-0"
        >
            <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-[#005c4b]" />
                <h2 className="text-[15px] font-500 text-gray-100">{title}</h2>
            </div>
        </motion.header>
    );
};
