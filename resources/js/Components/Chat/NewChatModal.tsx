import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader } from 'lucide-react';
import { router } from '@inertiajs/react';
import type { User } from '@/types/chat';

interface NewChatModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * NewChatModal Component
 * 
 * Allows users to start new direct chats or create group chats
 * Features:
 * - Search through all registered contacts
 * - Displays user avatars and info
 * - Creates new conversation if doesn't exist
 * - Navigates to existing conversation if already created
 * 
 * Uses framer-motion for smooth animations
 */
export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Fetch all users when modal opens
    useEffect(() => {
        if (isOpen && users.length === 0) {
            setIsLoading(true);
            fetch('/api/users')
                .then(res => res.json())
                .then(data => {
                    setUsers(data.users || []);
                })
                .catch(err => console.error('Failed to fetch users:', err))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen]);

    // Filter users based on search query
    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) {
            return users;
        }

        const lowerQuery = searchQuery.toLowerCase();
        return users.filter(user => 
            user.name.toLowerCase().includes(lowerQuery) ||
            (user.email && user.email.toLowerCase().includes(lowerQuery)) ||
            (user.phone && user.phone.includes(lowerQuery))
        );
    }, [users, searchQuery]);

    const handleUserSelect = async (selectedUser: User) => {
        setIsCreating(true);
        try {
            const response = await fetch('/api/conversations/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    user_id: selectedUser.id,
                }),
            });

            const data = await response.json();

            if (response.ok && data.conversation_id) {
                onClose();
                // Navigate to the conversation
                router.get(`/chat/${data.conversation_id}`);
            }
        } catch (err) {
            console.error('Failed to start conversation:', err);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[998]"
                        aria-hidden="true"
                    />

                    {/* Modal */}
                    <motion.div
                        key="modal"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="fixed inset-0 z-[999] flex items-center justify-center p-4"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                onClose();
                            }
                        }}
                    >
                        <div className="bg-[#111b21] rounded-lg w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
                            {/* Header */}
                            <div className="h-[60px] bg-[#202c33] flex items-center justify-between px-6 border-b border-[#1f2937] flex-shrink-0">
                                <h2 className="text-xl font-semibold text-[#e9edef]">New Chat</h2>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onClose}
                                    className="p-2 hover:bg-[#1f2937] rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </motion.button>
                            </div>

                            {/* Search Bar */}
                            <div className="p-4 bg-[#111b21] border-b border-[#1f2937] flex-shrink-0">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Search by name, email, or phone"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-[#202c33] border border-[#1f2937] rounded-lg pl-10 pr-4 py-2 text-sm text-[#e9edef] placeholder-gray-500 focus:outline-none focus:border-[#005c4b] transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Users List */}
                            <div className="flex-1 overflow-y-auto">
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader className="w-5 h-5 text-[#005c4b] animate-spin" />
                                    </div>
                                ) : filteredUsers.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
                                        <p className="text-sm">
                                            {users.length === 0 ? 'No users found' : 'No results match your search'}
                                        </p>
                                    </div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {filteredUsers.map((user, index) => (
                                            <motion.button
                                                key={user.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleUserSelect(user)}
                                                disabled={isCreating}
                                                className="w-full flex items-center px-4 py-3 cursor-pointer transition-colors border-b border-[#1f2937] last:border-b-0 hover:bg-[#1f2937] disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {/* Avatar */}
                                                <div className="w-12 h-12 rounded-full flex-shrink-0 mr-3 overflow-hidden shadow-md">
                                                    <img 
                                                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`}
                                                        alt={user.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>

                                                {/* User Info */}
                                                <div className="flex-1 min-w-0 text-left">
                                                    <h3 className="text-sm font-500 text-gray-100 truncate">
                                                        {user.name}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {user.email}
                                                    </p>
                                                </div>

                                                {/* Loading indicator */}
                                                {isCreating && (
                                                    <Loader className="w-4 h-4 text-[#005c4b] animate-spin ml-2 flex-shrink-0" />
                                                )}
                                            </motion.button>
                                        ))}
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
