import React, { useState, useEffect, useCallback } from 'react';
import { usePage, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ConversationSidebar } from '@/Components/Chat/ConversationSidebar';
import { ChatWindow } from '@/Components/Chat/ChatWindow';
import { SkeletonLoader } from '@/Components/SkeletonLoader';
import { NewGroupModal } from '@/Components/Chat/NewGroupModal';
import { GroupSettingsSidebar } from '@/Components/Chat/GroupSettingsSidebar';
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

    const [messages, setMessages] = useState<Message[]>(messagesArray);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true); // Track initial page load
    const [isSending, setIsSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [currentPage, setCurrentPage] = useState(props.pagination?.current_page || 1);
    const [hasMoreMessages, setHasMoreMessages] = useState(
        props.pagination ? currentPage < props.pagination.last_page : false
    );
    const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
    const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);

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
        setIsInitialLoad(false); // Mark initial load complete after component mounts
    }, [activeConversation?.id, notifications]);

    // Track last notified message to avoid duplicate notifications
    const lastNotifiedMessageRef = React.useRef<number | null>(null);

    // Listen for incoming messages and trigger notifications
    useEffect(() => {
        if (messages.length === 0 || !currentUser) return;

        // Get the last message
        const lastMessage = messages[messages.length - 1];
        
        // Check if this is a new message (not already notified) and from another user
        if (
            lastMessage && 
            lastMessage.id !== lastNotifiedMessageRef.current &&
            lastMessage.user_id !== currentUser.id
        ) {
            // Get the sender user from the conversation users
            const sender = conversationsArray
                .find(conv => conv.id === activeConversation?.id)
                ?.users?.find((u: any) => u.id === lastMessage.user_id);
            
            if (sender) {
                // Trigger notification for incoming message
                notifications.notifyNewMessage(lastMessage, sender);
                lastNotifiedMessageRef.current = lastMessage.id;
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
            
            // Check if message has content (body or file)
            if (!body.trim() && !file) return;

            setIsSending(true);
            const tempMessageId = generateTempMessageId();
            const formData = new FormData();
            
            // Encrypt the message body if it's a text message
            let displayBody = body.trim();
            if (body.trim()) {
                try {
                    const encryptionKey = generateEncryptionKey(currentUser.id, currentUser.email);
                    const encryptedBody = encryptMessage(body.trim(), encryptionKey);
                    
                    // Send encrypted body instead of plain body
                    formData.append('encrypted_body', encryptedBody);
                    formData.append('is_encrypted', 'true');
                    formData.append('body', ''); // Keep for backward compatibility
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
            
            // Mark message as ephemeral (disappears in 24 hours)
            formData.append('is_ephemeral', 'true');
            
            if (file) {
                formData.append('file', file);
            }

            // Create optimistic message - show it immediately in the UI
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

            // Add optimistic message to state immediately for instant UI feedback
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

                // Replace optimistic message with server response
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
                
                // Update optimistic message to show error state
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
                // You can add a toast notification here
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
            
            // Prepend older messages (they come chronologically before current messages)
            setMessages((prev) => [...data.messages, ...prev]);
            setCurrentPage(nextPage);
            
            // Update hasMoreMessages based on pagination response
            if (data.pagination) {
                setHasMoreMessages(data.pagination.has_more || nextPage < data.pagination.last_page);
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
                
                // Navigate to the new group conversation
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

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-screen bg-[#111b21] overflow-hidden"
        >
            {/* Show skeleton loader during initial load from Inertia */}
            {isInitialLoad ? (
                <SkeletonLoader type="full" />
            ) : (
                <>
                    {/* Sidebar - Hidden on mobile */}
                    <div className="hidden md:flex md:flex-col w-[400px]">
                        <ConversationSidebar
                            conversations={conversationsArray}
                            activeConversationId={activeConversation.id}
                            currentUser={currentUser}
                            onSelectConversation={handleSelectConversation}
                            onSearchChange={() => {}} // Search is now handled by useGlobalSearch hook in sidebar
                            onNewGroupClick={() => setIsNewGroupModalOpen(true)}
                        />
                    </div>

                    {/* Chat Window - Main area */}
                    <div className="flex-1 flex flex-col md:min-w-0">
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

                    {/* New Group Modal */}
                    <NewGroupModal
                        isOpen={isNewGroupModalOpen}
                        onClose={() => setIsNewGroupModalOpen(false)}
                        onCreateGroup={handleCreateGroup}
                        availableUsers={conversationsArray
                            .flatMap(c => Array.isArray(c.users) ? c.users : [])
                            .filter((user, idx, arr) => arr.findIndex(u => u.id === user.id) === idx)
                            .filter(u => u.id !== currentUser.id)}
                        currentUser={currentUser}
                        isLoading={isCreatingGroup}
                    />

                    {/* Group Settings Sidebar */}
                    {activeConversation?.is_group && (
                        <GroupSettingsSidebar
                            isOpen={isGroupSettingsOpen}
                            onClose={() => setIsGroupSettingsOpen(false)}
                            conversation={activeConversation}
                            currentUser={currentUser}
                            onRemoveMember={handleRemoveMember}
                            onAddMembers={() => setIsNewGroupModalOpen(true)}
                        />
                    )}
                </>
            )}
        </motion.div>
    );
}
