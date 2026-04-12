import React, { useState } from 'react';
import { Search, MoreVertical, MessageSquare, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Conversation, User } from '@/types/chat';

export interface ConversationItemProps {
    conversation: Conversation;
    isActive?: boolean;
    onSelect: (id: number) => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({ 
    conversation, 
    isActive, 
    onSelect 
}) => {
    // Ensure users is an array
    const usersArray = Array.isArray(conversation.users) ? conversation.users : [];
    const displayName = conversation.name || conversation.other_user?.name || usersArray[0]?.name || 'Unknown';
    const hasUnread = (conversation.unread_count ?? 0) > 0;
    
    return (
        <motion.button
            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(conversation.id)}
            className={`w-full flex items-center px-3 py-3 cursor-pointer transition-colors border-b border-gray-800 last:border-b-0 ${
                isActive ? 'bg-[#2a3942]' : 'hover:bg-[#1f2937]'
            }`}
        >
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full flex-shrink-0 mr-3 overflow-hidden shadow-md">
                <img 
                    src={conversation.avatar || conversation.other_user?.avatar || `https://ui-avatars.com/api/?name=${displayName}`}
                    alt={displayName}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                    <h3 className="text-[14px] font-500 text-gray-100 truncate">
                        {displayName}
                    </h3>
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {conversation.last_message?.created_at && (
                            new Date(conversation.last_message.created_at).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            })
                        )}
                    </span>
                </div>

                {/* Last Message Preview */}
                <p className={`text-xs truncate mt-1 ${
                    hasUnread ? 'text-gray-100 font-500' : 'text-gray-400'
                }`}>
                    {conversation.last_message?.body || 'No messages yet'}
                </p>
            </div>

            {/* Unread Badge */}
            {hasUnread && (
                <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-5 h-5 rounded-full bg-[#005c4b] flex items-center justify-center text-xs font-bold text-white ml-2 flex-shrink-0"
                >
                    {conversation.unread_count}
                </motion.div>
            )}
        </motion.button>
    );
};

export interface ConversationSidebarProps {
    conversations: Conversation[];
    activeConversationId?: number;
    currentUser: User;
    onSelectConversation: (id: number) => void;
    onSearchChange: (query: string) => void;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
    conversations,
    activeConversationId,
    currentUser,
    onSelectConversation,
    onSearchChange,
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        onSearchChange(e.target.value);
    };

    return (
        <motion.aside
            initial={{ x: -400 }}
            animate={{ x: 0 }}
            className="w-[400px] flex flex-col border-r border-[#1f2937] bg-[#111b21] h-screen overflow-hidden md:static fixed left-0 top-0 z-40 md:z-0"
        >
            {/* Header Section */}
            <motion.header 
                className="h-[60px] flex items-center justify-between px-4 bg-[#202c33] border-b border-[#1f2937] flex-shrink-0"
                layout
            >
                {/* Profile Avatar */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 rounded-full overflow-hidden transition hover:ring-2 ring-[#005c4b]"
                >
                    <img 
                        src={currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.name}`}
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                    />
                </motion.button>

                {/* Action Icons */}
                <div className="flex gap-4 text-gray-400">
                    <motion.button
                        whileHover={{ scale: 1.1, color: '#00d084' }}
                        className="transition"
                    >
                        <MessageSquare className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1, color: '#00d084' }}
                        className="transition"
                    >
                        <MoreVertical className="w-5 h-5" />
                    </motion.button>
                </div>
            </motion.header>

            {/* Search Bar */}
            <motion.div
                className="p-3 bg-[#111b21] flex-shrink-0"
                layout
            >
                <motion.div
                    className="relative flex items-center bg-[#202c33] rounded-xl px-3 py-2 transition-all shadow-inner focus-within:ring-2 focus-within:ring-[#005c4b]"
                    whileFocus={{ scale: 1.02 }}
                >
                    <Search className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                    <input
                        type="text"
                        placeholder="Search or start new chat"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="bg-transparent border-none focus:ring-0 text-sm w-full text-white placeholder-gray-500 outline-none"
                    />
                </motion.div>
            </motion.div>

            {/* Conversations List */}
            <motion.div
                className="flex-1 overflow-y-auto custom-scrollbar"
                layout
            >
                {conversations.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-full text-gray-500 gap-3"
                    >
                        <MessageSquare className="w-12 h-12 opacity-50" />
                        <p className="text-sm">No conversations yet</p>
                    </motion.div>
                ) : (
                    <motion.div layout>
                        {conversations.map((conv, idx) => (
                            <motion.div
                                key={conv.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <ConversationItem
                                    conversation={conv}
                                    isActive={activeConversationId === conv.id}
                                    onSelect={onSelectConversation}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </motion.div>
        </motion.aside>
    );
};
