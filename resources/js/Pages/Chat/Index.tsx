import React, { useState, useCallback, useMemo } from 'react';
import { usePage, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConversationSidebar } from '@/Components/Chat/ConversationSidebar';
import { ChatWindow } from '@/Components/Chat/ChatWindow';
import { StarredMessagesModal } from '@/Components/Chat/StarredMessagesModal';
import { ProfileSettingsModal } from '@/Components/Chat/ProfileSettingsModal';
import { NewGroupModal } from '@/Components/Chat/NewGroupModal';
import { EmptyConversationState } from '@/Components/Chat/EmptyConversationState';
import { NoConversationsState } from '@/Components/Chat/NoConversationsState';
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
 * Features unified modal management with fixed overlay system at z-[999]
 * Implements Inertia router for CSRF-protected requests
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
        // Navigate to show page using Inertia router
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
        async (message: string, file?: File): Promise<void> => {
            if (!activeConversationId) return;

            const formData = new FormData();
            formData.append('body', message);
            if (file) {
                formData.append('file', file);
            }

            // Use Inertia router for CSRF-protected request
            return new Promise((resolve) => {
                router.post(`/chat/${activeConversationId}/messages`, formData, {
                    onFinish: () => resolve(),
                });
            });
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
        <div className="fixed inset-0 w-screen h-screen bg-[#0b141a] overflow-hidden">
            {/* Main Layout Container - Base layer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex h-screen w-screen"
            >
                {/* Sidebar - Desktop: always visible, Mobile: hidden when chat selected */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key="sidebar"
                        initial={{ x: -400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -400, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="hidden md:flex md:flex-col md:relative md:z-10 w-[400px]"
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
                                className="md:hidden absolute inset-0 z-20 w-full"
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

                {/* Chat Window - Desktop: visible, Mobile: hidden by default */}
                <motion.div
                    key="chat-window"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="hidden md:flex md:flex-col md:flex-1 md:relative md:z-5"
                >
                    {conversationsArray.length === 0 ? (
                        <NoConversationsState onCreateGroup={() => openModal('groupCreate')} />
                    ) : activeConversation ? (
                        <ChatWindow
                            conversation={activeConversation}
                            currentUser={currentUser}
                            messages={[]}
                            isLoading={false}
                            onSendMessage={handleSendMessage}
                        />
                    ) : (
                        <EmptyConversationState />
                    )}
                </motion.div>
            </motion.div>

            {/* Global Modal System - Fixed overlay at z-[999]
                Ensures modals always appear on top of all content
                Uses backdrop-blur-md with dark semi-transparent background
            */}
            <AnimatePresence>
                {activeModal && (
                    <>
                        {/* Backdrop - Dismissible overlay */}
                        <motion.div
                            key="modal-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={closeModal}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[998]"
                            aria-hidden="true"
                        />

                        {/* Modal Content Container - Perfectly centered */}
                        <motion.div
                            key="modal-content"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="fixed inset-0 z-[999] flex items-center justify-center p-4"
                            onClick={(e) => {
                                // Only close if clicking the container itself, not the modal
                                if (e.target === e.currentTarget) {
                                    closeModal();
                                }
                            }}
                        >
                            {/* Starred Messages Modal */}
                            {activeModal === 'starred' && (
                                <StarredMessagesModal
                                    isOpen={true}
                                    onClose={closeModal}
                                />
                            )}

                            {/* Profile Settings Modal */}
                            {activeModal === 'profile' && (
                                <ProfileSettingsModal
                                    isOpen={true}
                                    onClose={closeModal}
                                    user={currentUser}
                                />
                            )}

                            {/* New Group Modal */}
                            {activeModal === 'groupCreate' && (
                                <NewGroupModal
                                    isOpen={true}
                                    onClose={closeModal}
                                    onCreateGroup={async (groupName, userIds) => {
                                        // Use Inertia router for group creation
                                        router.post('/groups', {
                                            name: groupName,
                                            user_ids: userIds,
                                        });
                                        closeModal();
                                    }}
                                    availableUsers={conversationsArray
                                        .flatMap(c => Array.isArray(c.users) ? c.users : [])
                                        .filter((user, idx, arr) => arr.findIndex(u => u.id === user.id) === idx)
                                        .filter(u => u.id !== currentUser.id)}
                                    currentUser={currentUser}
                                />
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

