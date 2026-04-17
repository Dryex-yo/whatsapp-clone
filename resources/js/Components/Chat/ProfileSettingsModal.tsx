import React from 'react';
import { motion } from 'framer-motion';
import { X, User, LogOut } from 'lucide-react';
import { router } from '@inertiajs/react';
import type { User as UserType } from '@/types/chat';

export interface ProfileSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserType;
}

/**
 * ProfileSettingsModal Component
 * Displays user profile information and settings options
 */
export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
    isOpen,
    onClose,
    user,
}) => {
    if (!isOpen) {
        return null;
    }

    const handleEditProfile = () => {
        router.get(route('profile.edit'));
        onClose();
    };

    const handleLogout = () => {
        router.post(route('logout'));
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full max-w-sm mx-auto p-6 bg-[#111b21] rounded-2xl shadow-2xl border border-[#1f2937] pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-xl font-bold text-white flex items-center gap-2"
                >
                    <User className="w-5 h-5 text-[#005c4b]" />
                    Profile Settings
                </motion.h2>
                <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition"
                >
                    <X className="w-5 h-5" />
                </motion.button>
            </div>

            {/* Profile Info */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="space-y-4 mb-6"
            >
                {/* Avatar */}
                <div className="flex justify-center">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#005c4b]"
                    >
                        <img
                            src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`}
                            alt={user.name}
                            className="w-full h-full object-cover"
                        />
                    </motion.div>
                </div>

                {/* User Details */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center space-y-2"
                >
                    <h3 className="text-lg font-semibold text-white">
                        {user.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                        {user.email}
                    </p>
                    <motion.p
                        animate={{ opacity: [0.6, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-xs text-[#005c4b]"
                    >
                        ● Online
                    </motion.p>
                </motion.div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="flex gap-3 pt-4 border-t border-[#1f2937]"
            >
                <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="flex-1 px-4 py-2 rounded-lg bg-[#202c33] text-gray-300 text-sm font-medium hover:bg-[#1a2835] transition"
                >
                    Close
                </motion.button>
                <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleEditProfile}
                    className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-[#005c4b] to-[#008060] text-white text-sm font-medium hover:shadow-lg transition"
                >
                    Edit Profile
                </motion.button>
            </motion.div>

            {/* Logout Button */}
            <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="w-full mt-3 px-4 py-2 rounded-lg bg-red-900/20 text-red-400 text-sm font-medium hover:bg-red-900/30 transition flex items-center justify-center gap-2"
            >
                <LogOut className="w-4 h-4" />
                Logout
            </motion.button>
        </motion.div>
    );
};
