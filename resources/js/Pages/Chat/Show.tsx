import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePage, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { ConversationSidebar } from '@/Components/Chat/ConversationSidebar';
import { ChatWindow } from '@/Components/Chat/ChatWindow';
import { SkeletonLoader } from '@/Components/SkeletonLoader';
import { NewGroupModal } from '@/Components/Chat/NewGroupModal';
import { GroupSettingsSidebar } from '@/Components/Chat/GroupSettingsSidebar';
import { StarredMessagesModal } from '@/Components/Chat/StarredMessagesModal';
import { usePresence } from '@/hooks/usePresence';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useWebNotifications } from '@/hooks/useWebNotifications';
import { encryptMessage, generateEncryptionKey } from '@/utils/encryption';
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

// Unified modal type for centralized state management
type ActiveModalType = 'newGroup' | 'groupSettings' | 'starred' | 'profile' | null;

/**
 * Chat Show Page
 * 
 * Displays a specific conversation with full message history
 * Supports pagination, message sending, and real-time updates via presence channels and typing indicators
 * Features unified modal management with proper z-index hierarchy
 */
export default function ChatShowPage() {
    const { props } = usePage<PageProps>();
    const { currentUser, conversations: initialConversations, activeConversation, messages: initialMessages } = props;

    // Ensure data is always arrays
    const conversationsArray = useMemo(
        () => Array.isArray(initialConversations) ? initialConversations : [],
        [initialConversations]
    );

    const messagesArray = useMemo(
        () => Array.isArray(initialMessages) ? initialMessages : [],
        [initialMessages]
    );

    // State management
    const [messages, setMessages] = useState<Message[]>(messagesArray);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [currentPage, setCurrentPage] = useState<number>(Number(props.pagination?.current_page) || 1);
    const [hasMoreMessages, setHasMoreMessages] = useState(
        props.pagination ? currentPage < (Number(props.pagination.last_page) || 1) : false
    );
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);

    // Unified modal management - only one modal open at a time
    const [activeModal, setActiveModal] = useState<ActiveModalType>(null);

    // Mobile state management
    const [isMobileSidebarVisible, setIsMobileSidebarVisible] = useState(true);

    // Setup presence tracking for online users
    const { onlineUsers } = usePresence(activeConversation?.id, currentUser);

    // Setup typing indicator
    const { typingUsers, broadcastTypingStart, broadcastTypingStop } = useTypingIndicator(
        activeConversation?.id,
        currentUser?.id
    );

    // Setup web notifications (browser alerts, sound, favicon badge)
    const notifications = useWebNotifications(currentUser, activeConversation, {
        enableBrowserNotifications: true,
        enableSound: true,
        enableFaviconBadge: true,
    });

    // Clear unread count when entering a conversation
    useEffect(() => {
        notifications.clearUnreadCount();
        setIsInitialLoad(false);
    }, [activeConversation?.id, notifications]);

    // Track last notified message to avoid duplicate notifications
    const lastNotifiedMessageRef = React.useRef<number | null>(null);

    // Listen for incoming messages and trigger notifications
    useEffect(() => {
        if (messages.length === 0 || !currentUser) return;

        const lastMessage = messages[messages.length - 1];
        
        if (
            lastMessage && 
            lastMessage.id !== lastNotifiedMessageRef.current &&
            lastMessage.user_id !== currentUser.id
        ) {
            const sender = conversationsArray
                .find(conv => conv.id === activeConversation?.id)
                ?.users?.find((u: any) => u.id === lastMessage.user_id);
            
            if (sender) {
                notifications.notifyNewMessage(lastMessage, sender);
                lastNotifiedMessageRef.current = typeof lastMessage.id === 'string' ? parseInt(lastMessage.id) : lastMessage.id;
            }
        }
    }, [messages, currentUser?.id, activeConversation?.id, conversationsArray, notifications]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        const chatContainer = document.querySelector('[data-chat-scroll]');
        if (chatContainer && messagesArray.length > 0) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }, [messages, messagesArray.length]);

    const handleSelectConversation = useCallback((id: number) => {
        // Close any open modals when switching conversations
        setActiveModal(null);
        router.get(`/chat/${id}`);
    }, []);

    /**
     * Generate a temporary ID for optimistic message
     * Format: temp_{timestamp}_{random}
     */
    const generateTempMessageId = useCallback(() => {
        return `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }, []);

    const handleSendMessage = useCallback(
        async (body: string, file?: File) => {
            if (!activeConversation?.id) return;
            
            if (!body.trim() && !file) return;

            setIsSending(true);
            const tempMessageId = generateTempMessageId();
            const formData = new FormData();
            
            let displayBody = body.trim();
            if (body.trim()) {
                try {
                    const encryptionKey = generateEncryptionKey(currentUser.id, currentUser.email);
                    const encryptedBody = encryptMessage(body.trim(), encryptionKey);
                    
                    formData.append('encrypted_body', encryptedBody);
                    formData.append('is_encrypted', 'true');
                    formData.append('body', '');
                } catch (error) {
                    console.error('Failed to encrypt message:', error);
                    setIsSending(false);
                    alert('Failed to encrypt message. Please try again.');
                    return;
                }
            } else {
                formData.append('body', body);
                formData.append('is_encrypted', 'false');
            }
            
            formData.append('is_ephemeral', 'true');
            
            if (file) {
                formData.append('file', file);
            }

            const optimisticMessage: Message = {
                id: tempMessageId,
                conversation_id: activeConversation.id,
                user_id: currentUser.id,
                body: displayBody,
                type: 'text',
                status: 'pending',
                created_at: new Date().toISOString(),
                is_optimistic: true,
                user: currentUser,
            };

            setMessages((prev) => [...prev, optimisticMessage]);

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

                setMessages((prev) => 
                    prev.map((msg) => 
                        msg.id === tempMessageId 
                            ? { 
                                ...newMessage, 
                                is_optimistic: false, 
                                status: 'sent',
                                server_id: newMessage.id,
                              }
                            : msg
                    )
                );
            } catch (error) {
                console.error('Failed to send message:', error);
                
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === tempMessageId
                            ? {
                                ...msg,
                                status: 'sent',
                                is_optimistic: false,
                                error_message: error instanceof Error ? error.message : 'Failed to send message',
                              }
                            : msg
                    )
                );
            } finally {
                setIsSending(false);
            }
        },
        [activeConversation?.id, currentUser]
    );

    const handleLoadMore = useCallback(async () => {
        if (!hasMoreMessages || isLoading) return;

        setIsLoading(true);
        try {
            const nextPage = currentPage + 1;
            const response = await fetch(
                `/api/conversations/${activeConversation.id}/messages?page=${nextPage}&per_page=30`
            );

            if (!response.ok) throw new Error('Failed to load more messages');

            const data = await response.json();
            
            setMessages((prev) => [...data.messages, ...prev]);
            setCurrentPage(nextPage);
            
            if (data.pagination) {
                setHasMoreMessages(data.pagination.has_more || nextPage < Number(data.pagination.last_page));
            }
        } catch (error) {
            console.error('Failed to load more messages:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, hasMoreMessages, isLoading, activeConversation.id]);

    const handleCreateGroup = useCallback(
        async (groupName: string, userIds: number[]) => {
            setIsCreatingGroup(true);
            try {
                const response = await fetch('/api/groups', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({
                        name: groupName,
                        user_ids: userIds,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to create group');
                }

                const newConversation = await response.json();
                
                // Close modal and navigate
                setActiveModal(null);
                router.get(`/chat/${newConversation.id}`);
            } catch (error) {
                console.error('Error creating group:', error);
                alert(error instanceof Error ? error.message : 'Failed to create group');
                throw error;
            } finally {
                setIsCreatingGroup(false);
            }
        },
        []
    );

    const handleRemoveMember = useCallback(
        async (userId: number) => {
            if (!activeConversation?.id) return;

            try {
                const response = await fetch(
                    `/api/conversations/${activeConversation.id}/members/${userId}`,
                    {
                        method: 'DELETE',
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to remove member');
                }

                alert('Member removed successfully');
            } catch (error) {
                console.error('Error removing member:', error);
                alert('Failed to remove member');
                throw error;
            }
        },
        [activeConversation?.id]
    );

    // Modal management callbacks
    const openModal = useCallback((modalType: ActiveModalType) => {
        setActiveModal(modalType);
    }, []);

    const closeModal = useCallback(() => {
        setActiveModal(null);
    }, []);

    // Handle back button on mobile
    const handleMobileBack = useCallback(() => {
        setIsMobileSidebarVisible(true);
    }, []);

    return (
        <div className="relative h-screen bg-[#111b21] overflow-hidden">
            {/* Show skeleton loader during initial load from Inertia */}
            {isInitialLoad ? (
                <SkeletonLoader type="full" />
            ) : (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="flex h-screen"
                    >
                        {/* Sidebar - Desktop: always visible, Mobile: hidden when chat selected */}
                        <AnimatePresence mode="wait">
                            {isMobileSidebarVisible && (
                                <motion.div
                                    key="desktop-sidebar"
                                    initial={{ x: -400, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -400, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    className="hidden md:flex md:flex-col md:relative md:z-20 w-[400px]"
                                >
                                    <ConversationSidebar
                                        conversations={conversationsArray}
                                        activeConversationId={activeConversation.id}
                                        currentUser={currentUser}
                                        onSelectConversation={handleSelectConversation}
                                        onSearchChange={() => {}}
                                        onNewGroupClick={() => openModal('newGroup')}
                                        onOpenProfileSettings={() => openModal('profile')}
                                        onOpenStarredMessages={() => openModal('starred')}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Chat Window - Main area with back button for mobile */}
                        <motion.div
                            key="chat-window"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="flex-1 flex flex-col md:relative md:z-10 relative"
                        >
                            {/* Mobile Back Button */}
                            {!isMobileSidebarVisible && (
                                <motion.button
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleMobileBack}
                                    className="md:hidden absolute top-4 left-4 z-40 p-2 hover:bg-[#202c33] rounded-full text-gray-300 transition-colors"
                                    title="Back to conversations"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </motion.button>
                            )}

                            <ChatWindow
                                conversation={activeConversation}
                                currentUser={currentUser}
                                messages={messages}
                                isLoading={isSending}
                                onSendMessage={handleSendMessage}
                                onTypingStart={broadcastTypingStart}
                                onTypingStop={broadcastTypingStop}
                                isTyping={isTyping}
                                typingUsers={typingUsers}
                                onlineUsers={onlineUsers}
                                onLoadMoreMessages={handleLoadMore}
                                hasMoreMessages={hasMoreMessages}
                                canNotify={notifications.canNotify}
                                isSoundEnabled={notifications.isSoundEnabled}
                                onToggleSound={notifications.toggleSoundNotification}
                                onRequestNotificationPermission={notifications.requestNotificationPermission}
                            />
                        </motion.div>
                    </motion.div>

                    {/* Global Modal System with Z-Index Hierarchy
                        Z-Index Hierarchy:
                        - 50: Modal Backdrop (with blur effect)
                        - 60: Modal Content
                        Ensures only one modal is open at a time
                    */}
                    <AnimatePresence>
                        {activeModal && (
                            <>
                                {/* Global Backdrop with blur effect */}
                                <motion.div
                                    key="modal-backdrop"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    onClick={closeModal}
                                    className="fixed inset-0 bg-black/40 backdrop-blur-md z-50"
                                />

                                {/* Modal Content */}
                                <motion.div
                                    key="modal-wrapper"
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                    className="fixed inset-0 z-60 flex items-center justify-center p-4 pointer-events-none"
                                >
                                    {/* New Group Modal */}
                                    {activeModal === 'newGroup' && (
                                        <div className="pointer-events-auto">
                                            <NewGroupModal
                                                isOpen={true}
                                                onClose={closeModal}
                                                onCreateGroup={handleCreateGroup}
                                                availableUsers={conversationsArray
                                                    .flatMap(c => Array.isArray(c.users) ? c.users : [])
                                                    .filter((user, idx, arr) => arr.findIndex(u => u.id === user.id) === idx)
                                                    .filter(u => u.id !== currentUser.id)}
                                                currentUser={currentUser}
                                                isLoading={isCreatingGroup}
                                            />
                                        </div>
                                    )}

                                    {/* Starred Messages Modal */}
                                    {activeModal === 'starred' && (
                                        <div className="pointer-events-auto">
                                            <StarredMessagesModal
                                                isOpen={true}
                                                onClose={closeModal}
                                            />
                                        </div>
                                    )}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>

                    {/* Group Settings Sidebar - Desktop only, uses separate z-index */}
                    <AnimatePresence>
                        {activeConversation?.is_group && activeModal === 'groupSettings' && (
                            <GroupSettingsSidebar
                                isOpen={true}
                                onClose={closeModal}
                                conversation={activeConversation}
                                currentUser={currentUser}
                                onRemoveMember={handleRemoveMember}
                                onAddMembers={() => openModal('newGroup')}
                            />
                        )}
                    </AnimatePresence>
                </>
            )}
        </div>
    );
}
