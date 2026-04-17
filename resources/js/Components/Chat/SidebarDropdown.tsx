import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, Plus, Star, Settings, LogOut } from 'lucide-react';
import { router } from '@inertiajs/react';

export interface SidebarDropdownProps {
    onNewGroupClick?: () => void;
    onOpenStarredMessages?: () => void;
    onOpenProfileSettings?: () => void;
}

/**
 * SidebarDropdown Component
 * 
 * Floating menu triggered by the three-dot icon in the sidebar header.
 * Provides quick access to:
 * - New Group creation
 * - Starred Messages
 * - Profile Settings
 * - Logout
 * 
 * Features:
 * - Click outside to close
 * - Smooth Framer Motion animations
 * - Proper z-index stacking
 * - Dark theme with WhatsApp-like styling
 */
export const SidebarDropdown: React.FC<SidebarDropdownProps> = ({
    onNewGroupClick,
    onOpenStarredMessages,
    onOpenProfileSettings,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current && 
                !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [isOpen]);

    const handleMenuItemClick = (callback?: () => void) => {
        if (callback) {
            callback();
        }
        setIsOpen(false);
    };

    const handleLogout = () => {
        setIsOpen(false);
        router.post(route('logout'));
    };

    const menuItems = [
        {
            label: 'New Group',
            icon: Plus,
            onClick: () => handleMenuItemClick(onNewGroupClick),
            color: 'text-emerald-400',
        },
        {
            label: 'Starred Messages',
            icon: Star,
            onClick: () => handleMenuItemClick(onOpenStarredMessages),
            color: 'text-amber-400',
        },
        {
            label: 'Settings',
            icon: Settings,
            onClick: () => handleMenuItemClick(onOpenProfileSettings),
            color: 'text-blue-400',
        },
        {
            label: 'Logout',
            icon: LogOut,
            onClick: handleLogout,
            color: 'text-red-400',
            isDangerous: true,
        },
    ];

    return (
        <div className="relative">
            {/* Trigger Button */}
            <motion.button
                ref={buttonRef}
                whileHover={{ scale: 1.1, color: '#00d084' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                title="More options"
                className="text-gray-400 transition focus:outline-none"
            >
                <MoreVertical className="w-5 h-5" />
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={dropdownRef}
                        initial={{ opacity: 0, scale: 0.95, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -8 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute top-12 right-0 z-50 w-48 bg-[#202c33] rounded-lg shadow-2xl border border-[#1f2937] overflow-hidden"
                    >
                        {/* Menu Items */}
                        <div className="py-2">
                            {menuItems.map((item, index) => {
                                const Icon = item.icon;
                                return (
                                    <motion.button
                                        key={item.label}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{
                                            duration: 0.2,
                                            delay: index * 0.05,
                                        }}
                                        whileHover={{
                                            backgroundColor: item.isDangerous 
                                                ? 'rgba(239, 68, 68, 0.1)' 
                                                : 'rgba(0, 212, 132, 0.1)',
                                        }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={item.onClick}
                                        className={`
                                            w-full flex items-center gap-3 px-4 py-3 text-sm font-medium
                                            text-gray-300 transition-colors
                                            ${item.isDangerous ? 'hover:text-red-400' : 'hover:text-white'}
                                            focus:outline-none focus:ring-2 focus:ring-[#005c4b] focus:ring-inset
                                        `}
                                    >
                                        <Icon className={`w-4 h-4 ${item.color}`} />
                                        <span>{item.label}</span>
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-[#1f2937]" />

                        {/* Info Footer */}
                        <div className="px-4 py-2 text-xs text-gray-500">
                            Menu v1.0
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
