import React, { useState } from 'react';
import { Bell, Volume2, VolumeX, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playNotificationTone } from '@/utils/notificationSound';

interface NotificationSettingsProps {
    canNotify: boolean;
    isSoundEnabled: boolean;
    onToggleSound: () => void;
    onRequestNotificationPermission: () => Promise<boolean>;
}

/**
 * NotificationSettings Component
 * 
 * Dropdown menu for managing notification preferences
 * Allows users to toggle sound notifications and request browser notification permission
 */
export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
    canNotify,
    isSoundEnabled,
    onToggleSound,
    onRequestNotificationPermission,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);
    const [isPlayingSound, setIsPlayingSound] = useState(false);

    const handleRequestPermission = async () => {
        setIsRequesting(true);
        try {
            await onRequestNotificationPermission();
        } finally {
            setIsRequesting(false);
        }
    };

    const handleTestSound = async () => {
        setIsPlayingSound(true);
        try {
            await playNotificationTone();
        } catch (error) {
            console.error('Error playing test sound:', error);
        } finally {
            setIsPlayingSound(false);
        }
    };

    return (
        <div className="relative">
            {/* Settings Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-[#2a3f35] transition-colors"
                title="Notification Settings"
            >
                <Bell size={20} className="text-[#aebac1]" />
                
                {/* Unread badge indicator */}
                {canNotify && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
                )}
            </button>

            {/* Settings Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-64 bg-[#2a3f35] rounded-lg shadow-lg z-50 overflow-hidden"
                    >
                        <div className="p-3">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-[#e9edef]">Notifications</h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 hover:bg-[#1f2d2b] rounded-md transition-colors"
                                >
                                    <X size={16} className="text-[#aebac1]" />
                                </button>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-[#3a5350] mb-3" />

                            {/* Browser Notifications */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="flex items-center text-sm text-[#d1d7db] cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={canNotify}
                                            onChange={handleRequestPermission}
                                            disabled={isRequesting}
                                            className="w-4 h-4 rounded cursor-pointer accent-[#25d366]"
                                        />
                                        <span className="ml-2 group-hover:text-[#e9edef] transition-colors">
                                            Browser Notifications
                                        </span>
                                    </label>
                                </div>
                                <p className="text-xs text-[#888d8f] ml-6">
                                    {canNotify
                                        ? 'Enabled - You\'ll receive browser alerts'
                                        : 'Disabled - Click to enable'}
                                </p>
                            </div>

                            {/* Sound Notifications */}
                            <div className="mb-3">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="flex items-center text-sm text-[#d1d7db] cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={isSoundEnabled}
                                            onChange={onToggleSound}
                                            className="w-4 h-4 rounded cursor-pointer accent-[#25d366]"
                                        />
                                        <span className="ml-2 group-hover:text-[#e9edef] transition-colors">
                                            Sound Alerts
                                        </span>
                                    </label>
                                </div>
                                <p className="text-xs text-[#888d8f] ml-6">
                                    {isSoundEnabled
                                        ? 'Enabled - You\'ll hear a ping sound'
                                        : 'Disabled - Silent mode'}
                                </p>
                            </div>

                            {/* Sound preview button */}
                            {isSoundEnabled && (
                                <motion.button
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    disabled={isPlayingSound}
                                    className="w-full mt-2 px-3 py-2 text-xs text-[#d1d7db] bg-[#1f2d2b] hover:bg-[#25d366] hover:text-[#111b21] disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors flex items-center justify-center gap-2"
                                    onClick={handleTestSound}
                                >
                                    <Volume2 size={14} />
                                    {isPlayingSound ? 'Playing...' : 'Test Sound'}
                                </motion.button>
                            )}

                            {/* Info Box */}
                            <div className="mt-3 p-2 bg-[#1f2d2b] rounded text-xs text-[#888d8f]">
                                <p>
                                    💡 <strong>Tip:</strong> Keep both enabled for full notification experience
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
