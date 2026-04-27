import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConversationSidebar } from '@/Components/Chat/ConversationSidebar';
import { ChatWindow } from '@/Components/Chat/ChatWindow';
import { NavigationRail } from '@/Components/Chat/NavigationRail';
import { WalletSection } from '@/Components/Chat/WalletSection';
import WelcomeScreen from '@/Components/Chat/WelcomeScreen';
import { StarredMessagesModal } from '@/Components/Chat/StarredMessagesModal';
import { ProfileSettingsModal } from '@/Components/Chat/ProfileSettingsModal';
import { NewGroupModal } from '@/Components/Chat/NewGroupModal';
import { NewChatModal } from '@/Components/Chat/NewChatModal';
import { ProfileSection } from '@/Components/Chat/ProfileSection';
import { fadeInVariants, slideInVariants } from '@/utils/animationVariants';
import type { Conversation, Message, User } from '@/types/chat';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';

interface PageProps extends InertiaPageProps {
    auth: { user: User };
    currentUser: User;
    conversations: Conversation[];
}

// Modal types for unified state management
type ActiveModalType = 'starred' | 'profile' | 'groupCreate' | 'newChat' | null;

/**
 * Chat Index Page
 * 
 * Displays list of conversations with responsive sidebar and empty chat window
 * Features unified modal management with fixed overlay system at z-[999]
 * Implements Inertia router for CSRF-protected requests
 * Synchronizes URL parameters with conversation selection state
 */
export default function ChatIndexPage() {
    const { props, url } = usePage<PageProps>();
    const { currentUser, conversations: initialConversations } = props;

    // Extract conversation ID from current URL
    const urlConversationId = useMemo(() => {
        const match = url.match(/\/chat\/(\d+)/);
        return match ? parseInt(match[1], 10) : undefined;
    }, [url]);

    // Ensure conversations is always an array
    const conversationsArray = useMemo(
        () => Array.isArray(initialConversations) ? initialConversations : [],
        [initialConversations]
    );

    // State management
    const [filteredConversations, setFilteredConversations] = useState<Conversation[]>(conversationsArray);
    const [activeConversationId, setActiveConversationId] = useState<number | undefined>(urlConversationId);
    const [syncedConversations, setSyncedConversations] = useState<Conversation[]>(conversationsArray);
    const [activeModal, setActiveModal] = useState<ActiveModalType>(null);
    const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
    const [isWalletOpen, setIsWalletOpen] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'chats' | 'calls' | 'status' | 'communities' | 'wallet'>('chats');

    // Mobile state management
    const [isMobileSidebarVisible, setIsMobileSidebarVisible] = useState(true);

    // Sync conversations when props change (e.g., after adding a contact)
    // Preserve other_user data to prevent "Unknown" display
    useEffect(() => {
        setSyncedConversations(prev => 
            conversationsArray.map(newConv => {
                const existingConv = prev.find(c => c.id === newConv.id);
                if (existingConv && existingConv.other_user) {
                    // Preserve other_user if it exists
                    return {
                        ...newConv,
                        other_user: newConv.other_user || existingConv.other_user,
                        users: newConv.users || existingConv.users,
                    };
                }
                return newConv;
            })
        );
        setFilteredConversations(conversationsArray);
    }, [conversationsArray]);

    // Sync activeConversationId with URL parameter on mount and when URL changes
    useEffect(() => {
        if (urlConversationId !== activeConversationId) {
            setActiveConversationId(urlConversationId);
        }
    }, [urlConversationId]);

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
        // Navigate using Inertia router without full page reload
        router.visit(`/chat/${id}`, {
            replace: false,
            preserveScroll: true,
            preserveState: true,
        });
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

    // Profile view handlers
    const handleOpenProfile = useCallback(() => {
        setIsProfileOpen(true);
    }, []);

    const handleCloseProfile = useCallback(() => {
        setIsProfileOpen(false);
    }, []);

    // Wallet view handlers
    const handleOpenWallet = useCallback(() => {
        setIsWalletOpen(true);
    }, []);

    const handleCloseWallet = useCallback(() => {
        setIsWalletOpen(false);
    }, []);

    // Handle tab changes including wallet
    const handleTabChange = useCallback((tab: 'chats' | 'calls' | 'status' | 'communities' | 'wallet') => {
        setActiveTab(tab);
        if (tab === 'wallet') {
            handleOpenWallet();
        }
    }, []);

    // Handle mobile back click to show sidebar again
    const handleMobileBackClick = useCallback(() => {
        setIsMobileSidebarVisible(true);
    }, []);

    return (
        <div className="fixed inset-0 w-screen h-screen bg-[#0b141a] overflow-hidden">
            {/* Main Layout Container - Base layer with Navigation Rail */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex h-screen w-screen"
            >
                {/* Navigation Rail - Always visible (64px width) */}
                <NavigationRail
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    userAvatar={currentUser.avatar}
                    userName={currentUser.name}
                    onProfileClick={handleOpenProfile}
                    onStarredClick={() => openModal('starred')}
                    onWalletClick={handleOpenWallet}
                />

                {/* Sidebar - Desktop: always visible (350-400px), Mobile: hidden when chat selected */}
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
                            onNewGroupClick={() => openModal('newChat')}
                            onOpenProfileSettings={handleOpenProfile}
                            onOpenStarredMessages={() => openModal('starred')}
                        />
                        {/* Profile Section Overlay */}
                        <AnimatePresence>
                            {isProfileOpen && (
                                <ProfileSection
                                    user={currentUser}
                                    onBack={handleCloseProfile}
                                />
                            )}
                        </AnimatePresence>

                        {/* Wallet Section Overlay */}
                        <AnimatePresence>
                            {isWalletOpen && (
                                <WalletSection
                                    onBack={handleCloseWallet}
                                />
                            )}
                        </AnimatePresence>
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
                                    onNewGroupClick={() => openModal('newChat')}
                                    onOpenProfileSettings={handleOpenProfile}
                                    onOpenStarredMessages={() => openModal('starred')}
                                />
                                {/* Profile Section Overlay - Mobile */}
                                <AnimatePresence>
                                    {isProfileOpen && (
                                        <ProfileSection
                                            user={currentUser}
                                            onBack={handleCloseProfile}
                                        />
                                    )}
                                </AnimatePresence>

                                {/* Wallet Section Overlay - Mobile */}
                                <AnimatePresence>
                                    {isWalletOpen && (
                                        <WalletSection
                                            onBack={handleCloseWallet}
                                        />
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Chat Window - Desktop: visible (flexible), Mobile: hidden by default */}
                <AnimatePresence mode="wait">
                    {activeConversation ? (
                        <motion.div
                            key={`chat-${activeConversationId}`}
                            variants={slideInVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="hidden md:flex md:flex-col md:flex-1 md:relative md:z-5 bg-[#0b141a]"
                        >
                            <ChatWindow
                                conversation={activeConversation}
                                currentUser={currentUser}
                                messages={[]}
                                isLoading={false}
                                onSendMessage={handleSendMessage}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="welcome-screen"
                            variants={fadeInVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="hidden md:flex md:flex-col md:flex-1 md:relative md:z-5 bg-[#0b141a]"
                        >
                            <WelcomeScreen key={`welcome-${filteredConversations.length}`} conversations={filteredConversations} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mobile Chat View - Shows when conversation is selected on mobile */}
                <AnimatePresence>
                    {!isMobileSidebarVisible && activeConversation && (
                        <motion.div
                            key={`mobile-chat-${activeConversationId}`}
                            initial={{ opacity: 0, x: 400 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 400 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="md:hidden absolute inset-0 z-20 w-full h-full flex flex-col bg-[#0b141a]"
                        >
                            <ChatWindow
                                conversation={activeConversation}
                                currentUser={currentUser}
                                messages={[]}
                                isLoading={false}
                                onSendMessage={handleSendMessage}
                                onMobileBackClick={handleMobileBackClick}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
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

            {/* New Chat Modal - Separate from global modal system */}
            <NewChatModal
                isOpen={activeModal === 'newChat'}
                onClose={closeModal}
            />
        </div>
    );
}

