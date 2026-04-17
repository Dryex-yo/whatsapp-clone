import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Plus } from 'lucide-react';

export interface EmptyConversationsProps {
    onCreateGroup?: () => void;
}

/**
 * NoConversationsState Component
 * 
 * Displays when the user has no conversations yet.
 * Features dark WhatsApp-like theme with call-to-action button.
 */
export const NoConversationsState: React.FC<EmptyConversationsProps> = ({ onCreateGroup }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center h-full w-full bg-[#0b141a] px-6"
        >
            {/* Animated Icon */}
            <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="mb-6"
            >
                <MessageSquare className="w-20 h-20 text-[#005c4b] opacity-50" />
            </motion.div>

            {/* Title */}
            <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl font-bold text-gray-300 mb-3"
            >
                No conversations yet
            </motion.h2>

            {/* Subtitle */}
            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-gray-500 text-center max-w-md mb-8"
            >
                Start a new conversation by creating a group or searching for contacts
            </motion.p>

            {/* Create Group Button */}
            {onCreateGroup && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onCreateGroup}
                    className="flex items-center gap-2 px-6 py-3 bg-[#005c4b] hover:bg-[#004d3d] text-white font-medium rounded-lg transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Start New Group
                </motion.button>
            )}

            {/* Decorative Dots */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-12 flex gap-2"
            >
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.2,
                        }}
                        className="w-2 h-2 rounded-full bg-[#005c4b]"
                    />
                ))}
            </motion.div>
        </motion.div>
    );
};
