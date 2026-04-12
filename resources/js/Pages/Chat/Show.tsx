import React, { useState, useEffect, useCallback } from 'react';
import { usePage, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ConversationSidebar } from '@/Components/Chat/ConversationSidebar';
import { ChatWindow } from '@/Components/Chat/ChatWindow';
import { usePresence } from '@/hooks/usePresence';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import type { Conversation, Message, User } from '@/types/chat';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';

interface PageProps extends InertiaPageProps {
    auth: { user: User };
    currentUser: User;
    conversations: Conversation[];
    activeConversation: Conversation;
    messages: Message[];
    pagination: {
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
    };
}

/**
 * Chat Show Page
 * 
 * Displays a specific conversation with full message history
 * Supports pagination, message sending, and real-time updates via presence channels and typing indicators
 */
export default function ChatShowPage() {
    const { props } = usePage<PageProps>();
    const { currentUser, conversations: initialConversations, activeConversation, messages: initialMessages } = props;

    // Ensure data is always arrays
    const conversationsArray = Array.isArray(initialConversations) ? initialConversations : [];
    const messagesArray = Array.isArray(initialMessages) ? initialMessages : [];

    const [filteredConversations, setFilteredConversations] = useState<Conversation[]>(conversationsArray);
    const [messages, setMessages] = useState<Message[]>(messagesArray);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // Setup presence tracking for online users
    const { onlineUsers } = usePresence(activeConversation?.id, currentUser);

    // Setup typing indicator
    const { typingUsers, broadcastTypingStart, broadcastTypingStop } = useTypingIndicator(
        activeConversation?.id,
        currentUser?.id
    );

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        const chatContainer = document.querySelector('[data-chat-scroll]');
        if (chatContainer && messagesArray.length > 0) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }, [messages, messagesArray.length]);

    // Setup WebSocket connection for real-time updates (optional)
    useEffect(() => {
        if (!activeConversation?.id) return;

        // Example WebSocket setup (with Laravel Reverb)
        // Uncomment when ready to implement
        // const channel = Echo.private(`conversation.${activeConversation.id}`)
        //     .listen('MessageSent', (data: Message) => {
        //         setMessages(prev => [...prev, data]);
        //     })
        //     .listenForWhisper('typing', (data: { user_id: number }) => {
        //         if (data.user_id !== currentUser.id) {
        //             setIsTyping(true);
        //             setTimeout(() => setIsTyping(false), 3000);
        //         }
        //     });

        // return () => {
        //     channel.leave();
        // };
    }, [activeConversation?.id, currentUser.id]);

    const handleSelectConversation = useCallback((id: number) => {
        router.get(`/chat/${id}`);
    }, []);

    const handleSearchChange = useCallback((query: string) => {
        if (!query.trim()) {
            setFilteredConversations(conversationsArray);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const filtered = conversationsArray.filter((conv) => {
            const name = (conv.name || conv.other_user?.name || '').toLowerCase();
            const lastMessage = (conv.last_message?.body || '').toLowerCase();

            return name.includes(lowerQuery) || lastMessage.includes(lowerQuery);
        });

        setFilteredConversations(filtered);
    }, [conversationsArray]);

    const handleSendMessage = useCallback(
        async (body: string, file?: File) => {
            if (!activeConversation?.id || !body.trim()) return;

            setIsSending(true);
            const formData = new FormData();
            formData.append('body', body);
            if (file) {
                formData.append('file', file);
            }

            try {
                const response = await fetch(
                    `/api/conversations/${activeConversation.id}/messages`,
                    {
                        method: 'POST',
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        body: formData,
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to send message');
                }

                const newMessage = await response.json();

                // Add new message to local state
                setMessages((prev) => [...prev, newMessage]);

                // Update conversation's last message in sidebar
                setFilteredConversations((prev) =>
                    prev.map((conv) =>
                        conv.id === activeConversation.id
                            ? { ...conv, last_message: newMessage }
                            : conv
                    )
                );
            } catch (error) {
                console.error('Failed to send message:', error);
                // You can add a toast notification here
            } finally {
                setIsSending(false);
            }
        },
        [activeConversation?.id]
    );

    const handleLoadMore = useCallback(async () => {
        if (currentPage >= props.pagination.last_page) return;

        setIsLoading(true);
        try {
            const nextPage = currentPage + 1;
            const response = await fetch(
                `/api/conversations/${activeConversation.id}/messages?page=${nextPage}&per_page=50`
            );

            if (!response.ok) throw new Error('Failed to load more messages');

            const data = await response.json();
            setMessages((prev) => [...data.data, ...prev]);
            setCurrentPage(nextPage);
        } catch (error) {
            console.error('Failed to load more messages:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, props.pagination.last_page, activeConversation.id]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-screen bg-[#111b21] overflow-hidden"
        >
            {/* Sidebar - Hidden on mobile */}
            <div className="hidden md:flex md:flex-col w-[400px]">
                <ConversationSidebar
                    conversations={filteredConversations}
                    activeConversationId={activeConversation.id}
                    currentUser={currentUser}
                    onSelectConversation={handleSelectConversation}
                    onSearchChange={handleSearchChange}
                />
            </div>

            {/* Chat Window - Main area */}
            <div className="flex-1 flex flex-col md:min-w-0">
                <ChatWindow
                    conversation={activeConversation}
                    currentUser={currentUser}
                    messages={messages}
                    isLoading={isLoading}
                    onSendMessage={handleSendMessage}
                    onTypingStart={broadcastTypingStart}
                    onTypingStop={broadcastTypingStop}
                    isTyping={isTyping}
                    typingUsers={typingUsers}
                    onlineUsers={onlineUsers}
                />
            </div>

            {/* Mobile - Show back to sidebar button */}
            <div className="md:hidden absolute top-4 left-4 z-10">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.get('/chat')}
                    className="p-2 hover:bg-[#202c33] rounded-full text-white"
                    title="Back to conversations"
                >
                    ← Back
                </motion.button>
            </div>
        </motion.div>
    );
}
