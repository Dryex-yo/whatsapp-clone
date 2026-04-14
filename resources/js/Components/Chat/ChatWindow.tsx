import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { ChatHeader, ChatHeaderOnly } from './ChatHeader';
import { MessageBubble, MessageGroup, DateSeparator, TypingIndicator } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { SearchInChat, useSearchInChat } from '@/Components/SearchInChat';
import WelcomeScreen from './WelcomeScreen';
import { useInfiniteScroll, useScrollPosition } from '@/hooks/useInfiniteScroll';
import type { Conversation, Message, User } from '@/types/chat';

export interface ChatWindowProps {
    conversation?: Conversation | null;
    currentUser: User;
    messages?: Message[];
    isLoading?: boolean;
    onSendMessage?: (message: string, file?: File) => Promise<void>;
    onTypingStart?: () => void;
    onTypingStop?: () => void;
    isTyping?: boolean;
    typingUsers?: Record<number, string>;
    onlineUsers?: Record<number, User>;
    onLoadMoreMessages?: () => Promise<void>;
    hasMoreMessages?: boolean;
    canNotify?: boolean;
    isSoundEnabled?: boolean;
    onToggleSound?: () => void;
    onRequestNotificationPermission?: () => Promise<boolean>;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    conversation,
    currentUser,
    messages = [],
    isLoading = false,
    onSendMessage,
    onTypingStart,
    onTypingStop,
    isTyping = false,
    typingUsers = {},
    onlineUsers = {},
    onLoadMoreMessages,
    hasMoreMessages = false,
    canNotify = false,
    isSoundEnabled = true,
    onToggleSound,
    onRequestNotificationPermission,
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const { saveScrollPosition, restoreScrollPosition } = useScrollPosition(messagesContainerRef);
    const { isSearchOpen, setIsSearchOpen } = useSearchInChat();

    // Infinite scroll sentinel reference
    const sentinelRef = useInfiniteScroll({
        onLoadMore: async () => {
            if (onLoadMoreMessages) {
                setIsLoadingMore(true);
                saveScrollPosition();
                try {
                    await onLoadMoreMessages();
                    // Restore scroll position after messages load
                    setTimeout(restoreScrollPosition, 100);
                } catch (error) {
                    console.error('Error loading more messages:', error);
                } finally {
                    setIsLoadingMore(false);
                }
            }
        },
        hasMore: hasMoreMessages,
        isLoading: isLoadingMore,
    });

    // Auto-scroll to bottom when new messages arrive (only if already at bottom)
    useEffect(() => {
        if (isScrolledToBottom && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length, isTyping, isScrolledToBottom]);

    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollHeight, scrollTop, clientHeight } = messagesContainerRef.current;
            const isBottom = scrollHeight - scrollTop - clientHeight < 100;
            setIsScrolledToBottom(isBottom);
        }
    };

    // Group messages by date
    const groupedMessages = messages.reduce<
        Array<{ date: Date; messages: Message[] }>
    >((groups, message) => {
        const messageDate = message.created_at ? new Date(message.created_at) : new Date();
        messageDate.setHours(0, 0, 0, 0);

        const existingGroup = groups.find((g) =>
            g.date.getTime() === messageDate.getTime()
        );

        if (existingGroup) {
            existingGroup.messages.push(message);
        } else {
            groups.push({ date: messageDate, messages: [message] });
        }

        return groups;
    }, []);

    if (!conversation) {
        return <WelcomeScreen />;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col bg-[#111b21] overflow-hidden relative"
        >
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-[#005c4b] to-transparent pointer-events-none" />

            {/* Chat Header */}
            <ChatHeader 
                conversation={conversation} 
                currentUser={currentUser} 
                typingUsers={typingUsers}
                onlineUsers={onlineUsers}
                canNotify={canNotify}
                isSoundEnabled={isSoundEnabled}
                onToggleSound={onToggleSound}
                onRequestNotificationPermission={onRequestNotificationPermission}
            />

            {/* Search in Chat Overlay */}
            {isSearchOpen && (
                <SearchInChat 
                    conversationId={conversation.id}
                    onClose={() => setIsSearchOpen(false)}
                />
            )}

            {/* Messages Container */}
            <motion.div
                ref={messagesContainerRef}
                data-chat-scroll
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 space-y-2 relative z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                {isLoading ? (
                    <motion.div
                        className="flex items-center justify-center h-full"
                        animate={{ opacity: [0.5, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                    >
                        <div className="animate-spin">
                            <MessageSquare className="w-8 h-8 text-[#005c4b]" />
                        </div>
                    </motion.div>
                ) : messages.length === 0 ? (
                    <motion.div
                        className="flex items-center justify-center h-full flex-col gap-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        >
                            <MessageSquare className="w-16 h-16 text-[#005c4b] opacity-30" />
                        </motion.div>
                        <div className="text-center">
                            <p className="text-gray-400 text-sm">
                                No messages yet
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                                Start the conversation!
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <AnimatePresence>
                        {/* Infinite Scroll Sentinel - Triggers when scrolled to top */}
                        <motion.div
                            ref={sentinelRef}
                            className="h-4"
                            layout
                        />

                        {/* Loading indicator for more messages */}
                        {isLoadingMore && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center justify-center py-4"
                            >
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                >
                                    <MessageSquare className="w-5 h-5 text-[#005c4b]" />
                                </motion.div>
                            </motion.div>
                        )}

                        {groupedMessages.map((group, groupIdx) => (
                            <motion.div
                                key={group.date.getTime()}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                {/* Date Separator */}
                                {groupIdx > 0 && <DateSeparator date={group.date} />}

                                {/* Messages in this date group */}
                                <MessageGroup
                                    messages={group.messages}
                                    currentUser={currentUser}
                                    isGroup={conversation.is_group}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}

                {/* Typing Indicator */}
                {isTyping && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                    >
                        <div className="flex gap-2 mb-1">
                            <div className="w-8 flex-shrink-0"></div>
                            <div className="bg-[#202c33] rounded-lg rounded-br-lg px-3 py-2">
                                <TypingIndicator />
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
            </motion.div>

            {/* Message Input */}
            {onSendMessage && conversation?.id && (
                <MessageInput
                    conversationId={conversation.id}
                    onSendMessage={onSendMessage}
                    disabled={isLoading}
                    isLoading={isLoading}
                    onTypingStart={onTypingStart}
                    onTypingStop={onTypingStop}
                />
            )}
        </motion.div>
    );
};

/**
 * Compact chat window for mobile view
 */
export const ChatWindowCompact: React.FC<ChatWindowProps> = ({
    conversation,
    currentUser,
    messages = [],
    onSendMessage,
    onTypingStart,
    onTypingStop,
    isTyping = false,
    typingUsers = {},
    onlineUsers = {},
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    if (!conversation) {
        return (
            <motion.div
                initial={{ x: 400 }}
                animate={{ x: 0 }}
                className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#111b21]"
            >
                <MessageSquare className="w-16 h-16 text-[#005c4b] opacity-30 mb-4" />
                <p className="text-gray-400">Select a chat to start</p>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="fixed inset-0 z-50 flex flex-col bg-[#111b21]"
        >
            <ChatHeader conversation={conversation} currentUser={currentUser} />

            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2">
                {messages.map((message, idx) => (
                    <MessageBubble
                        key={message.id}
                        message={message}
                        currentUser={currentUser}
                        isConsecutive={
                            idx > 0 && messages[idx - 1].user_id === message.user_id
                        }
                    />
                ))}
                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
            </div>

            {onSendMessage && conversation?.id && (
                <MessageInput 
                    conversationId={conversation.id}
                    onSendMessage={onSendMessage}
                    onTypingStart={onTypingStart}
                    onTypingStop={onTypingStop}
                />
            )}
        </motion.div>
    );
};
