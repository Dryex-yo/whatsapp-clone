import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Check } from 'lucide-react';
import { Modal } from '@/Components/Modal';
import { PrimaryButton } from '@/Components/PrimaryButton';
import { TextInput } from '@/Components/TextInput';
import type { User } from '@/types/chat';

export interface NewGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateGroup: (groupName: string, selectedUserIds: number[]) => Promise<void>;
    availableUsers: User[];
    currentUser: User;
    isLoading?: boolean;
}

export const NewGroupModal: React.FC<NewGroupModalProps> = ({
    isOpen,
    onClose,
    onCreateGroup,
    availableUsers,
    currentUser,
    isLoading = false,
}) => {
    const [groupName, setGroupName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter users based on search query (excluding current user)
    const filteredUsers = useMemo(() => {
        return availableUsers.filter(user => {
            // Exclude current user and already selected users
            if (user.id === currentUser.id) return false;
            
            // Match search query
            const query = searchQuery.toLowerCase();
            return (
                user.name.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query)
            );
        });
    }, [availableUsers, searchQuery, currentUser.id]);

    const toggleUserSelection = (userId: number) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const getSelectedUserNames = useMemo(() => {
        return selectedUsers
            .map(id => availableUsers.find(u => u.id === id)?.name)
            .filter(Boolean)
            .join(', ');
    }, [selectedUsers, availableUsers]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!groupName.trim()) {
            alert('Please enter a group name');
            return;
        }

        if (selectedUsers.length < 2) {
            alert('Please select at least 2 members');
            return;
        }

        setIsSubmitting(true);
        try {
            await onCreateGroup(groupName, selectedUsers);
            // Reset form
            setGroupName('');
            setSearchQuery('');
            setSelectedUsers([]);
            onClose();
        } catch (error) {
            console.error('Error creating group:', error);
            alert('Failed to create group. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setGroupName('');
        setSearchQuery('');
        setSelectedUsers([]);
        onClose();
    };

    return (
        <Modal show={isOpen} onClose={handleClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md mx-auto p-6 bg-[#111b21] rounded-2xl border border-gray-700 shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Create New Group</h2>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleClose}
                        className="text-gray-400 hover:text-white transition"
                    >
                        <X className="w-5 h-5" />
                    </motion.button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Group Name Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">
                            Group Name
                        </label>
                        <TextInput
                            type="text"
                            placeholder="Enter group name..."
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="w-full"
                            disabled={isSubmitting || isLoading}
                        />
                    </div>

                    {/* Search Users Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">
                            Add Members ({selectedUsers.length} selected)
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                            <TextInput
                                type="text"
                                placeholder="Search contacts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10"
                                disabled={isSubmitting || isLoading}
                            />
                        </div>
                    </div>

                    {/* Selected Users Preview */}
                    {selectedUsers.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-3 bg-[#202c33] rounded-lg border border-gray-700"
                        >
                            <p className="text-xs text-gray-400 mb-2">Selected Members:</p>
                            <div className="flex flex-wrap gap-2">
                                {selectedUsers.map(userId => {
                                    const user = availableUsers.find(u => u.id === userId);
                                    return (
                                        <motion.div
                                            key={userId}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#005c4b] text-white text-xs"
                                        >
                                            <span>{user?.name}</span>
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.2 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => toggleUserSelection(userId)}
                                                className="ml-1 hover:bg-[#004239] rounded-full p-0.5 transition"
                                            >
                                                <X className="w-3 h-3" />
                                            </motion.button>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* Users List */}
                    <motion.div
                        layout
                        className="max-h-64 overflow-y-auto bg-[#202c33] rounded-lg border border-gray-700 divide-y divide-gray-700"
                    >
                        <AnimatePresence>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => {
                                    const isSelected = selectedUsers.includes(user.id);
                                    return (
                                        <motion.button
                                            key={user.id}
                                            type="button"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                                            onClick={() => toggleUserSelection(user.id)}
                                            disabled={isSubmitting || isLoading}
                                            className={`w-full flex items-center gap-3 p-3 transition ${
                                                isSelected ? 'bg-[#1a2835]' : ''
                                            } hover:bg-[#1a2835] disabled:opacity-50 disabled:cursor-not-allowed text-left`}
                                        >
                                            {/* Avatar */}
                                            <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden">
                                                <img
                                                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`}
                                                    alt={user.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>

                                            {/* User Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">
                                                    {user.name}
                                                </p>
                                                <p className="text-xs text-gray-400 truncate">
                                                    {user.email}
                                                </p>
                                            </div>

                                            {/* Checkbox */}
                                            <motion.div
                                                animate={{
                                                    backgroundColor: isSelected ? '#005c4b' : 'transparent',
                                                    borderColor: isSelected ? '#005c4b' : '#4B5563',
                                                }}
                                                className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0"
                                            >
                                                {isSelected && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                    >
                                                        <Check className="w-3 h-3 text-white" />
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                        </motion.button>
                                    );
                                })
                            ) : (
                                <div className="p-4 text-center text-gray-400 text-sm">
                                    {searchQuery ? 'No users found' : 'No contacts available'}
                                </div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Error Message */}
                    {selectedUsers.length === 0 && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-gray-400"
                        >
                            Select at least 2 members to create a group
                        </motion.p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleClose}
                            disabled={isSubmitting || isLoading}
                            className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white text-sm font-medium hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </motion.button>
                        <PrimaryButton
                            disabled={
                                !groupName.trim() ||
                                selectedUsers.length < 2 ||
                                isSubmitting ||
                                isLoading
                            }
                            type="submit"
                            className="flex-1"
                        >
                            {isSubmitting ? 'Creating...' : 'Create Group'}
                        </PrimaryButton>
                    </div>
                </form>
            </motion.div>
        </Modal>
    );
};
