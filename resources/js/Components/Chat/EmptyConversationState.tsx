import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

/**
 * EmptyConversationState Component
 * 
 * Displays when no conversation is selected in the chat window.
 * Features dark WhatsApp-like theme with smooth animations.
 */
export const EmptyConversationState: React.FC = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center h-full w-full bg-[#0b141a]"
        >
            {/* Animated Icon */}
            <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="mb-6"
            >
                <MessageSquare className="w-16 h-16 text-[#005c4b] opacity-60" />
            </motion.div>

            {/* Title */}
            <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-bold text-gray-300 mb-2"
            >
                Select a conversation
            </motion.h2>

            {/* Subtitle */}
            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-gray-500 text-center max-w-sm"
            >
                Choose a conversation from the sidebar to start messaging
            </motion.p>

            {/* Decorative Dots */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-8 flex gap-2"
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
