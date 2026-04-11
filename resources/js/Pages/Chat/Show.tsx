import React, { useState, useEffect, useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import { ChatLayout } from '../Layouts/ChatLayout';
import type { Conversation, User, Message } from '../types/chat';

/**
 * Main Chat Page Component
 * 
 * Integrates with Inertia.js and backend API
 * Handles real-time WebSocket connections
 * Manages chat state and message flow
 */
interface PageProps {
    currentUser: User;
    conversations: Conversation[];
}

export default function ChatPage() {
    const { props } = usePage<PageProps>();
    const { currentUser, conversations: initialConversations } = props;

    const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
    const [activeConversationId, setActiveConversationId] = useState<number | undefined>();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    // Setup WebSocket connection for real-time updates
    useEffect(() => {
        if (!activeConversationId) return;

        // Example WebSocket setup (with Laravel Reverb)
        // const channel = Echo.private(`conversation.${activeConversationId}`)
        //     .listen('MessageSent', (data: Message) => {
        //         setMessages(prev => [...prev, data]);
        //         // Update conversation's last message
        //         setConversations(prevConvs => 
        //             prevConvs.map(conv => 
        //                 conv.id === activeConversationId
        //                     ? { ...conv, last_message: data }
        //                     : conv
        //             )
        //         );
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
    }, [activeConversationId, currentUser.id]);

    // Fetch messages for selected conversation
    const fetchMessages = useCallback(async (conversationId: number) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/conversations/${conversationId}/messages?page=1&per_page=50`);
            const data = await response.json();
            setMessages(data.data || []);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Handle conversation selection
    const handleSelectConversation = useCallback((id: number) => {
        setActiveConversationId(id);
        fetchMessages(id);
    }, [fetchMessages]);

    // Handle sending message
    const handleSendMessage = useCallback(
        async (message: string, file?: File) => {
            if (!activeConversationId) return;

            setIsSending(true);
            try {
                const formData = new FormData();
                formData.append('body', message);
                if (file) {
                    formData.append('file', file);
                }

                const response = await fetch(
                    `/api/conversations/${activeConversationId}/messages`,
                    {
                        method: 'POST',
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                            // Add CSRF token if needed
                        },
                        body: formData,
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to send message');
                }

                const data = await response.json();
                
                // Add new message to local state
                if (data.success && data.data) {
                    const newMessage: Message = {
                        id: data.data.id,
                        conversation_id: activeConversationId,
                        user_id: currentUser.id,
                        body: message,
                        type: file ? 'file' : 'text',
                        read_at: null,
                        created_at: new Date().toISOString(),
                        user: currentUser,
                    };
                    
                    setMessages(prev => [...prev, newMessage]);
                }
            } catch (error) {
                console.error('Failed to send message:', error);
                // Show error toast here
            } finally {
                setIsSending(false);
            }
        },
        [activeConversationId, currentUser]
    );

    // Handle search
    const handleSearchChange = useCallback((query: string) => {
        if (!query.trim()) {
            setConversations(initialConversations);
            return;
        }

        const filtered = initialConversations.filter(conv => {
            const name = (conv.name || conv.participants?.[0]?.name || '').toLowerCase();
            const body = (conv.last_message?.body || '').toLowerCase();
            const searchTerm = query.toLowerCase();
            return name.includes(searchTerm) || body.includes(searchTerm);
        });

        setConversations(filtered);
    }, [initialConversations]);

    return (
        <div className="h-screen w-full overflow-hidden">
            <ChatLayout
                currentUser={currentUser}
                conversations={conversations}
                onSelectConversation={handleSelectConversation}
                onSendMessage={handleSendMessage}
            />
        </div>
    );
}

/**
 * Example of getting page props from Inertia route
 * 
 * // In your route (routes/web.php):
 * Route::get('/chat', function() {
 *     return inertia('Chat/Index', [
 *         'currentUser' => auth()->user(),
 *         'conversations' => auth()->user()->conversations()
 *             ->with(['users', 'lastMessage.sender'])
 *             ->latest('updated_at')
 *             ->get(),
 *     ]);
 * });
 */
