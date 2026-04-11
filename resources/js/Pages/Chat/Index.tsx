import React, { useState, useCallback } from 'react';
import { usePage, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ConversationSidebar } from '@/Components/Chat/ConversationSidebar';
import { ChatWindow } from '@/Components/Chat/ChatWindow';
import type { Conversation, Message, User } from '@/types/chat';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';

interface PageProps extends InertiaPageProps {
    auth: { user: User };
    currentUser: User;
    conversations: Conversation[];
}

/**
 * Chat Index Page
 * 
 * Displays list of conversations with sidebar and empty chat window
 * Allows user to select a conversation to view details
 */
export default function ChatIndexPage() {
    const { props } = usePage<PageProps>();
    const { currentUser, conversations: initialConversations } = props;

    // Ensure conversations is always an array
    const conversationsArray = Array.isArray(initialConversations) ? initialConversations : [];

    const [filteredConversations, setFilteredConversations] = useState<Conversation[]>(conversationsArray);
    const [activeConversationId, setActiveConversationId] = useState<number | undefined>();

    const activeConversation = filteredConversations.find(
        (conv) => conv.id === activeConversationId
    );

    const handleSelectConversation = useCallback((id: number) => {
        setActiveConversationId(id);
        // Navigate to show page
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
        async (message: string, file?: File) => {
            if (!activeConversationId) return;

            const formData = new FormData();
            formData.append('body', message);
            if (file) {
                formData.append('file', file);
            }

            try {
                const response = await fetch(
                    `/api/conversations/${activeConversationId}/messages`,
                    {
                        method: 'POST',
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        body: formData,
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to send message');
                }

                // Message sent successfully - update conversation's last message
                const data = await response.json();
                console.log('Message sent:', data);
            } catch (error) {
                console.error('Failed to send message:', error);
            }
        },
        [activeConversationId]
    );

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
                    activeConversationId={activeConversationId}
                    currentUser={currentUser}
                    onSelectConversation={handleSelectConversation}
                    onSearchChange={handleSearchChange}
                />
            </div>

            {/* Chat Window - Desktop only, empty state on mobile */}
            <div className="hidden md:flex md:flex-col flex-1">
                <ChatWindow
                    conversation={activeConversation || null}
                    currentUser={currentUser}
                    messages={[]}
                    isLoading={false}
                    onSendMessage={handleSendMessage}
                />
            </div>

            {/* Mobile - Show sidebar by default */}
            <div className="w-full md:hidden">
                <ConversationSidebar
                    conversations={filteredConversations}
                    activeConversationId={activeConversationId}
                    currentUser={currentUser}
                    onSelectConversation={handleSelectConversation}
                    onSearchChange={handleSearchChange}
                />
            </div>
        </motion.div>
    );
}

