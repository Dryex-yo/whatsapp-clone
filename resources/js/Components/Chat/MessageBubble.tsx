import React from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck, AlertCircle } from 'lucide-react';
import { ImageMessage } from '@/Components/ImageMessage';
import type { Message, User } from '@/types/chat';
import type { Variants } from 'framer-motion';

export interface MessageBubbleProps {
    message: Message;
    currentUser: User;
    isConsecutive?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
    message, 
    currentUser, 
    isConsecutive 
}) => {
    const isSent = message.user_id === currentUser.id;
    const timestamp = message.created_at ? new Date(message.created_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    }) : '';

    const containerVariants: Variants = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: 'spring',
                stiffness: 300,
                damping: 30,
            },
        },
    };

    const messageContent = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { delay: 0.1 } },
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={`flex gap-2 mb-1 ${isSent ? 'justify-end' : 'justify-start'} ${!isConsecutive ? 'mt-2' : ''}`}
        >
            {/* User Avatar (only for received messages and not consecutive) */}
            {!isSent && !isConsecutive && (
                <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden">
                    <img
                        src={message.user?.avatar || `https://ui-avatars.com/api/?name=${message.user?.name}`}
                        alt={message.user?.name}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            {/* Spacing for consecutive messages */}
            {!isSent && isConsecutive && (
                <div className="w-8 flex-shrink-0"></div>
            )}

            {/* Message Bubble */}
            <motion.div
                variants={messageContent}
                className={`max-w-xs px-3 py-2 rounded-lg ${
                    isSent
                        ? 'bg-[#005c4b] text-white rounded-bl-lg'
                        : 'bg-[#202c33] text-gray-100 rounded-br-lg'
                }`}
            >
                {/* Attachments (new media system) */}
                {message.attachments && message.attachments.length > 0 && (
                    <div className="mb-2 space-y-2">
                        {message.attachments.map((attachment) => (
                            <ImageMessage
                                key={attachment.id}
                                attachment={attachment}
                                isOwn={isSent}
                                maxWidth={300}
                            />
                        ))}
                    </div>
                )}

                {/* Message Type: Text */}
                {message.type === 'text' && (
                    <p className="text-sm break-words">{message.body}</p>
                )}

                {/* Message Type: Image (legacy) */}
                {message.type === 'image' && (
                    <div className="rounded overflow-hidden max-w-xs">
                        <img
                            src={message.body || ''}
                            alt="Message image"
                            className="max-w-full max-h-48"
                        />
                    </div>
                )}

                {/* Message Type: File (legacy) */}
                {message.type === 'file' && (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-white bg-opacity-20 flex items-center justify-center">
                            <span className="text-xs font-bold">📎</span>
                        </div>
                        <div className="text-sm">{message.body}</div>
                    </div>
                )}

                {/* Timestamp & Read Status (for sent messages) */}
                {isSent && (
                    <div className="flex items-center justify-end gap-1 mt-1 text-xs opacity-70">
                        <span>{timestamp}</span>
                        {message.read_at ? (
                            <CheckCheck className="w-4 h-4 text-[#31a24c]" />
                        ) : (
                            <Check className="w-4 h-4" />
                        )}
                    </div>
                )}

                {/* Timestamp (for received messages) */}
                {!isSent && (
                    <div className="text-xs opacity-70 mt-1">
                        {timestamp}
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

export interface MessageGroupProps {
    messages: Message[];
    currentUser: User;
}

/**
 * Groups consecutive messages from the same sender
 */
export const MessageGroup: React.FC<MessageGroupProps> = ({ messages, currentUser }) => {
    return (
        <motion.div
            layout
            className="mb-4"
        >
            {messages.map((message, idx) => {
                const isConsecutive = 
                    idx > 0 && 
                    messages[idx - 1].user_id === message.user_id &&
                    !!(message.created_at && messages[idx - 1].created_at &&
                    (new Date(message.created_at).getTime() - 
                    new Date(messages[idx - 1].created_at!).getTime() < 60000)); // 1 minute

                return (
                    <MessageBubble
                        key={message.id}
                        message={message}
                        currentUser={currentUser}
                        isConsecutive={isConsecutive}
                    />
                );
            })}
        </motion.div>
    );
};

export interface DateSeparatorProps {
    date: Date;
}

/**
 * Display a date separator between message groups
 */
export const DateSeparator: React.FC<DateSeparatorProps> = ({ date }) => {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center my-4"
        >
            <div className="bg-[#202c33] text-gray-400 text-xs px-3 py-1 rounded-full">
                {formattedDate}
            </div>
        </motion.div>
    );
};

/**
 * Typing indicator animation
 */
export const TypingIndicator: React.FC = () => {
    const dotVariants = {
        hidden: { y: 0 },
        visible: { y: -10 },
    };

    return (
        <motion.div className="flex gap-1 items-center py-2 px-3">
            {[0, 1, 2].map((idx) => (
                <motion.div
                    key={idx}
                    variants={dotVariants}
                    animate="visible"
                    initial="hidden"
                    transition={{
                        repeat: Infinity,
                        duration: 0.6,
                        delay: idx * 0.2,
                    }}
                    className="w-2 h-2 rounded-full bg-gray-500"
                />
            ))}
        </motion.div>
    );
};
