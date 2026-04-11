import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ConversationSidebar } from '../Components/Chat/ConversationSidebar';
import { ChatWindow } from '../Components/Chat/ChatWindow';
import type { Conversation, Message, User } from '../types/chat';

interface ChatLayoutProps {
    currentUser: User;
    conversations?: Conversation[];
    onSelectConversation?: (id: number) => void;
    onSendMessage?: (conversationId: number, message: string, file?: File) => Promise<Message>;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({
    currentUser,
    conversations = [],
    onSelectConversation,
    onSendMessage,
}) => {
    const [activeConversationId, setActiveConversationId] = useState<number | undefined>();
    const [filteredConversations, setFilteredConversations] = useState(conversations);
    const [isSearching, setIsSearching] = useState(false);

    const activeConversation = conversations.find(
        (conv) => conv.id === activeConversationId
    );

    const handleSelectConversation = useCallback((id: number) => {
        setActiveConversationId(id);
        onSelectConversation?.(id);
    }, [onSelectConversation]);

    const handleSearchChange = useCallback((query: string) => {
        setIsSearching(query.length > 0);
        
        if (!query.trim()) {
            setFilteredConversations(conversations);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const filtered = conversations.filter((conv) => {
            const name = (conv.name || conv.participants?.[0]?.name || '').toLowerCase();
            const lastMessage = (conv.last_message?.body || '').toLowerCase();
            
            return name.includes(lowerQuery) || lastMessage.includes(lowerQuery);
        });

        setFilteredConversations(filtered);
    }, [conversations]);

    const handleSendMessage = useCallback(
        async (message: string, file?: File) => {
            if (!activeConversationId || !onSendMessage) return;

            try {
                await onSendMessage(activeConversationId, message, file);
            } catch (error) {
                console.error('Failed to send message:', error);
            }
        },
        [activeConversationId, onSendMessage]
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-screen bg-[#111b21] overflow-hidden"
        >
            {/* Sidebar - Desktop */}
            <div className="hidden md:flex md:flex-col">
                <ConversationSidebar
                    conversations={filteredConversations}
                    activeConversationId={activeConversationId}
                    currentUser={currentUser}
                    onSelectConversation={handleSelectConversation}
                    onSearchChange={handleSearchChange}
                />
            </div>

            {/* Chat Window - Desktop */}
            <div className="hidden md:flex md:flex-col flex-1">
                <ChatWindow
                    conversation={activeConversation}
                    currentUser={currentUser}
                    messages={activeConversation?.last_message ? [activeConversation.last_message] : []}
                    onSendMessage={handleSendMessage}
                />
            </div>

            {/* Mobile View - Show sidebar by default, chat on selection */}
            <div className="w-full md:hidden">
                {!activeConversationId ? (
                    <ConversationSidebar
                        conversations={filteredConversations}
                        activeConversationId={activeConversationId}
                        currentUser={currentUser}
                        onSelectConversation={handleSelectConversation}
                        onSearchChange={handleSearchChange}
                    />
                ) : (
                    <ChatWindow
                        conversation={activeConversation}
                        currentUser={currentUser}
                        messages={activeConversation?.last_message ? [activeConversation.last_message] : []}
                        onSendMessage={handleSendMessage}
                    />
                )}
            </div>
        </motion.div>
    );
};

export default ChatLayout;
