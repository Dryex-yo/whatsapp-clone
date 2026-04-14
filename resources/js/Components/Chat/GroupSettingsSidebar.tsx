import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Edit2, Trash2, Plus, Shield } from 'lucide-react';
import { PrimaryButton } from '@/Components/PrimaryButton';
import { DangerButton } from '@/Components/DangerButton';
import type { Conversation, User } from '@/types/chat';

export interface GroupSettingsSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    conversation: Conversation;
    currentUser: User;
    onRemoveMember?: (userId: number) => Promise<void>;
    onAddMembers?: () => void;
    onDeleteGroup?: () => Promise<void>;
    isLoading?: boolean;
}

export const GroupSettingsSidebar: React.FC<GroupSettingsSidebarProps> = ({
    isOpen,
    onClose,
    conversation,
    currentUser,
    onRemoveMember,
    onAddMembers,
    onDeleteGroup,
    isLoading = false,
}) => {
    const [removingUserId, setRemovingUserId] = useState<number | null>(null);

    // Check if current user is admin
    const isAdmin = conversation.admin_id === currentUser.id;
    
    // Get members array
    const members = Array.isArray(conversation.users) ? conversation.users : [];

    const handleRemoveMember = async (userId: number) => {
        if (!onRemoveMember) return;
        
        setRemovingUserId(userId);
        try {
            await onRemoveMember(userId);
        } finally {
            setRemovingUserId(null);
        }
    };

    const handleDeleteGroup = async () => {
        if (!onDeleteGroup) return;
        
        if (window.confirm('Are you sure? This will delete the group for everyone.')) {
            await onDeleteGroup();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    />

                    {/* Sidebar */}
                    <motion.aside
                        initial={{ x: 400 }}
                        animate={{ x: 0 }}
                        exit={{ x: 400 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                        className="fixed right-0 top-0 bottom-0 w-[350px] bg-[#111b21] border-l border-[#1f2937] z-50 overflow-y-auto md:static md:border-l md:w-[320px]"
                    >
                        {/* Header */}
                        <motion.div
                            className="sticky top-0 h-[60px] px-6 bg-[#202c33] border-b border-[#1f2937] flex items-center justify-between flex-shrink-0"
                            layout
                        >
                            <h3 className="text-lg font-bold text-white">Group Settings</h3>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onClose}
                                className="text-gray-400 hover:text-white transition md:hidden"
                            >
                                <X className="w-5 h-5" />
                            </motion.button>
                        </motion.div>

                        {/* Content */}
                        <motion.div
                            layout
                            className="p-4 space-y-6"
                        >
                            {/* Group Info */}
                            <motion.div
                                layout
                                className="space-y-4"
                            >
                                <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                                    Group Information
                                </h4>

                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                        <img
                                            src={conversation.avatar || `https://ui-avatars.com/api/?name=${conversation.name}`}
                                            alt={conversation.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white truncate">
                                            {conversation.name}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {members.length} members
                                        </p>
                                    </div>
                                </div>

                                {conversation.description && (
                                    <p className="text-sm text-gray-300 bg-[#202c33] rounded-lg p-3">
                                        {conversation.description}
                                    </p>
                                )}
                            </motion.div>

                            {/* Members Section */}
                            <motion.div
                                layout
                                className="space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Members
                                    </h4>
                                    {isAdmin && onAddMembers && (
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={onAddMembers}
                                            disabled={isLoading}
                                            className="text-[#00d084] hover:text-[#31a24c] transition disabled:opacity-50"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </motion.button>
                                    )}
                                </div>

                                {/* Members List */}
                                <motion.div
                                    layout
                                    className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar"
                                >
                                    <AnimatePresence>
                                        {members.length > 0 ? (
                                            members.map((member) => {
                                                const isCurrentUser = member.id === currentUser.id;
                                                const isMemberAdmin = conversation.admin_id === member.id;
                                                const isRemoving = removingUserId === member.id;

                                                return (
                                                    <motion.div
                                                        key={member.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -10 }}
                                                        layout
                                                        className="flex items-center gap-3 p-3 rounded-lg bg-[#202c33] hover:bg-[#1a2835] transition"
                                                    >
                                                        {/* Avatar */}
                                                        <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden">
                                                            <img
                                                                src={member.avatar || `https://ui-avatars.com/api/?name=${member.name}`}
                                                                alt={member.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>

                                                        {/* Member Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-white truncate">
                                                                {member.name}
                                                                {isCurrentUser && ' (You)'}
                                                            </p>
                                                            {isMemberAdmin && (
                                                                <p className="text-xs text-[#00d084] flex items-center gap-1">
                                                                    <Shield className="w-3 h-3" />
                                                                    Admin
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Remove Button */}
                                                        {isAdmin && !isCurrentUser && onRemoveMember && (
                                                            <motion.button
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => handleRemoveMember(member.id)}
                                                                disabled={isLoading || isRemoving}
                                                                className="text-gray-400 hover:text-red-400 transition disabled:opacity-50"
                                                            >
                                                                {isRemoving ? (
                                                                    <motion.div
                                                                        animate={{ rotate: 360 }}
                                                                        transition={{ repeat: Infinity, duration: 1 }}
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </motion.div>
                                                                ) : (
                                                                    <X className="w-4 h-4" />
                                                                )}
                                                            </motion.button>
                                                        )}
                                                    </motion.div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-sm text-gray-400 text-center py-4">
                                                No members
                                            </p>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </motion.div>

                            {/* Admin Actions */}
                            {isAdmin && (
                                <motion.div
                                    layout
                                    className="pt-4 border-t border-[#1f2937] space-y-3"
                                >
                                    <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                                        Admin Controls
                                    </h4>

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#202c33] text-gray-300 hover:bg-[#1a2835] transition disabled:opacity-50"
                                        disabled={isLoading}
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Edit Group Info
                                    </motion.button>

                                    {onDeleteGroup && (
                                        <DangerButton
                                            disabled={isLoading}
                                            onClick={handleDeleteGroup}
                                            className="w-full flex items-center justify-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete Group
                                        </DangerButton>
                                    )}
                                </motion.div>
                            )}
                        </motion.div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
};
