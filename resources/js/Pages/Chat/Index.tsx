import React, { useState, useCallback, useMemo } from 'react';
import { usePage, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConversationSidebar } from '@/Components/Chat/ConversationSidebar';
import { ChatWindow } from '@/Components/Chat/ChatWindow';
import WelcomeScreen from '@/Components/Chat/WelcomeScreen';
import type { Conversation, Message, User } from '@/types/chat';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';

interface PageProps extends InertiaPageProps {
    auth: { user: User };
    currentUser: User;
    conversations: Conversation[];
}

// Modal types for unified state management
type ActiveModalType = 'starred' | 'profile' | 'groupCreate' | null;

/**
 * Chat Index Page
 * 
 * Displays list of conversations with responsive sidebar and empty chat window
 * Features unified modal management, proper z-index hierarchy, and responsive design
 */
export default function ChatIndexPage() {
    const { props } = usePage<PageProps>();
    const { currentUser, conversations: initialConversations } = props;

    // Ensure conversations is always an array
    const conversationsArray = useMemo(
        () => Array.isArray(initialConversations) ? initialConversations : [],
        [initialConversations]
    );

    // State management
    const [filteredConversations, setFilteredConversations] = useState<Conversation[]>(conversationsArray);
    const [activeConversationId, setActiveConversationId] = useState<number | undefined>();
    const [activeModal, setActiveModal] = useState<ActiveModalType>(null);

    // Mobile state management
    const [isMobileSidebarVisible, setIsMobileSidebarVisible] = useState(true);

    // Derived state
    const activeConversation = filteredConversations.find(
        (conv) => conv.id === activeConversationId
    );

    const handleSelectConversation = useCallback((id: number) => {
        setActiveConversationId(id);
        // On mobile, hide sidebar when selecting conversation
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setIsMobileSidebarVisible(false);
        }
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

                const data = await response.json();
                console.log('Message sent:', data);
            } catch (error) {
                console.error('Failed to send message:', error);
            }
        },
        [activeConversationId]
    );

    // Close modal callback
    const closeModal = useCallback(() => {
        setActiveModal(null);
    }, []);

    // Open modal callback
    const openModal = useCallback((modalType: ActiveModalType) => {
        setActiveModal(modalType);
    }, []);

    return (
        <div className="relative h-screen bg-[#111b21] overflow-hidden">
            {/* Main Layout Container */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex h-screen"
            >
                {/* Sidebar - Desktop: always visible, Mobile: hidden when chat selected */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key="sidebar"
                        initial={{ x: -400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -400, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="hidden md:flex md:flex-col md:relative md:z-20 w-[400px]"
                    >
                        <ConversationSidebar
                            conversations={filteredConversations}
                            activeConversationId={activeConversationId}
                            currentUser={currentUser}
                            onSelectConversation={handleSelectConversation}
                            onSearchChange={handleSearchChange}
                            onNewGroupClick={() => openModal('groupCreate')}
                            onOpenProfileSettings={() => openModal('profile')}
                            onOpenStarredMessages={() => openModal('starred')}
                        />
                    </motion.div>
                </AnimatePresence>

                {/* Mobile Sidebar Overlay */}
                <AnimatePresence>
                    {isMobileSidebarVisible && (
                        <>
                            {/* Mobile Sidebar */}
                            <motion.div
                                key="mobile-sidebar"
                                initial={{ x: -400, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -400, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="md:hidden absolute inset-0 z-30 w-full"
                            >
                                <ConversationSidebar
                                    conversations={filteredConversations}
                                    activeConversationId={activeConversationId}
                                    currentUser={currentUser}
                                    onSelectConversation={handleSelectConversation}
                                    onSearchChange={handleSearchChange}
                                    onNewGroupClick={() => openModal('groupCreate')}
                                    onOpenProfileSettings={() => openModal('profile')}
                                    onOpenStarredMessages={() => openModal('starred')}
                                />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Chat Window */}
                <motion.div
                    key="chat-window"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="hidden md:flex md:flex-col md:flex-1 md:relative md:z-10"
                >
                    {activeConversation ? (
                        <ChatWindow
                            conversation={activeConversation}
                            currentUser={currentUser}
                            messages={[]}
                            isLoading={false}
                            onSendMessage={handleSendMessage}
                        />
                    ) : (
                        <WelcomeScreen />
                    )}
                </motion.div>
            </motion.div>

            {/* Global Modal Overlay & Container
                Z-Index Hierarchy:
                - 30: Mobile Sidebar
                - 50: Modal Backdrop (with blur)
                - 60: Modal Content
            */}
            <AnimatePresence>
                {activeModal && (
                    <>
                        {/* Backdrop with blur effect */}
                        <motion.div
                            key="modal-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={closeModal}
                            className="fixed inset-0 bg-black/40 backdrop-blur-md z-50"
                        />

                        {/* Modal Content Container */}
                        <motion.div
                            key="modal-content"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="fixed inset-0 z-60 flex items-center justify-center p-4 pointer-events-none"
                            onClick={closeModal}
                        >
                            {/* Modal content goes here - currently placeholder */}
                            <div className="pointer-events-auto">
                                {/* Modal handlers would go here */}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

