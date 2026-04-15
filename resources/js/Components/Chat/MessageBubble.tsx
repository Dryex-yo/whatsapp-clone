import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck, AlertCircle } from 'lucide-react';
import { ImageMessage } from '@/Components/ImageMessage';
import { AudioPlayer } from '@/Components/Chat/AudioPlayer';
import { MessageStatus } from '@/Components/MessageStatus';
import { StarButton } from '@/Components/Chat/StarButton';
import { HighlightedText } from '@/utils/highlightUtils';
import { getUserColor } from '@/utils/colorUtils';
import { decryptMessage, generateEncryptionKey } from '@/utils/encryption';
import { sanitizeAsText } from '@/utils/sanitize';
import type { Message, User, Conversation } from '@/types/chat';
import type { Variants } from 'framer-motion';

export interface MessageBubbleProps {
    message: Message;
    currentUser: User;
    isConsecutive?: boolean;
    isGroup?: boolean;
    searchTerm?: string; // For highlighting search matches
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
    message, 
    currentUser, 
    isConsecutive,
    isGroup = false,
    searchTerm = '',
}) => {
    const [isStarred, setIsStarred] = useState(message.is_starred || false);
    const [displayedBody, setDisplayedBody] = useState<string>(message.body || '');
    const [decryptionError, setDecryptionError] = useState<string | null>(null);
    
    const isSent = message.user_id === currentUser.id;
    const isOptimistic = (message as any).is_optimistic === true;
    const timestamp = message.created_at ? new Date(message.created_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    }) : '';

    const senderColor = getUserColor(message.user_id);

    // Decrypt message if it's encrypted
    useEffect(() => {
        if (message.type === 'text' && (message as any).is_encrypted && (message as any).encrypted_body) {
            try {
                // Get the encryption key for the sender
                const senderEmail = message.user?.email || '';
                const encryptionKey = generateEncryptionKey(message.user_id, senderEmail);
                const decrypted = decryptMessage((message as any).encrypted_body, encryptionKey);
                // Sanitize decrypted content to prevent XSS attacks
                const sanitized = sanitizeAsText(decrypted);
                setDisplayedBody(sanitized);
                setDecryptionError(null);
            } catch (error) {
                console.error('Failed to decrypt message:', error);
                setDecryptionError('Failed to decrypt message');
                setDisplayedBody('[Encrypted Message]');
            }
        } else {
            // Sanitize message body to prevent XSS attacks
            // This removes any potentially dangerous HTML/JavaScript
            const sanitized = sanitizeAsText(message.body || '');
            setDisplayedBody(sanitized);
            setDecryptionError(null);
        }
    }, [message, message.user?.email]);

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
                className="flex flex-col"
            >
                {/* Sender name (for group chats, shown for first message from user) */}
                {!isSent && isGroup && !isConsecutive && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs font-semibold mb-1 px-3"
                        style={{ color: senderColor }}
                    >
                        {message.user?.name}
                    </motion.p>
                )}

                {/* Message content bubble */}
                <motion.div
                    className={`max-w-xs px-3 py-2 rounded-lg ${
                        isSent
                            ? 'bg-[#005c4b] text-white rounded-bl-lg'
                            : 'bg-[#202c33] text-gray-100 rounded-br-lg'
                    } ${isOptimistic ? 'opacity-70' : ''}`}
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
                        <div className="flex items-center gap-2">
                            {searchTerm ? (
                                <HighlightedText
                                    text={displayedBody}
                                    searchTerm={searchTerm}
                                    className="text-sm break-words"
                                    highlightClassName="bg-yellow-400 bg-opacity-70 font-semibold rounded px-1"
                                />
                            ) : (
                                <p className="text-sm break-words">{displayedBody}</p>
                            )}
                            {decryptionError && (
                                <div className="relative group">
                                    <AlertCircle className="w-4 h-4 text-orange-400" />
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-orange-500 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                                        {decryptionError}
                                    </div>
                                </div>
                            )}
                            {(message as any).is_encrypted && !decryptionError && (
                                <span className="text-xs opacity-60" title="End-to-End Encrypted">🔒</span>
                            )}
                        </div>
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

                    {/* Message Type: Audio (legacy - voice messages) */}
                    {message.type === 'audio' && message.body && (
                        <AudioPlayer
                            src={message.body}
                            fileName={message.body.split('/').pop() || 'Voice Message'}
                            isOwn={isSent}
                        />
                    )}

                    {/* Timestamp & Message Status (for sent messages) */}
                    {isSent && (
                        <div className="flex items-center justify-end gap-1 mt-1 text-xs opacity-70">
                            <span>{timestamp}</span>
                            <MessageStatus status={message.status || 'sent'} className="w-4 h-4" />
                        </div>
                    )}

                    {/* Timestamp (for received messages) */}
                    {!isSent && (
                        <div className="text-xs opacity-70 mt-1">
                            {timestamp}
                        </div>
                    )}
                </motion.div>

                {/* Message Actions - Star button */}
                <div className="flex items-center gap-1 mt-1 px-1">
                    <StarButton
                        messageId={message.id}
                        isStarred={isStarred}
                        onStarToggle={setIsStarred}
                        size={16}
                    />
                </div>
            </motion.div>
        </motion.div>
    );
};

export interface MessageGroupProps {
    messages: Message[];
    currentUser: User;
    isGroup?: boolean;
    searchTerm?: string; // For highlighting search matches
}

/**
 * Groups consecutive messages from the same sender
 */
export const MessageGroup: React.FC<MessageGroupProps> = ({ messages, currentUser, isGroup = false, searchTerm = '' }) => {
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
                        isGroup={isGroup}
                        searchTerm={searchTerm}
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
