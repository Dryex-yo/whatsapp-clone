import React from 'react';
import { motion } from 'framer-motion';
import { 
    MessageCircle, 
    Phone, 
    FileText, 
    Users,
    Sparkles,
    Star,
} from 'lucide-react';

interface NavigationRailProps {
    activeTab: 'chats' | 'calls' | 'status' | 'communities';
    onTabChange: (tab: 'chats' | 'calls' | 'status' | 'communities') => void;
    userAvatar?: string;
    userName?: string;
    onProfileClick?: () => void;
    onStarredClick?: () => void;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
    activeTab,
    onTabChange,
    userAvatar,
    userName,
    onProfileClick,
    onStarredClick,
}) => {
    const topIcons = [
        {
            id: 'chats',
            icon: MessageCircle,
            label: 'Chats',
            tooltip: 'Chats',
        },
        {
            id: 'calls',
            icon: Phone,
            label: 'Calls',
            tooltip: 'Calls',
        },
        {
            id: 'status',
            icon: FileText,
            label: 'Status',
            tooltip: 'Status',
        },
        {
            id: 'communities',
            icon: Users,
            label: 'Communities',
            tooltip: 'Communities',
        },
    ];

    return (
        <div className="w-16 bg-[#202c33] flex flex-col items-center justify-between py-4 border-r border-[#111b21] h-screen shadow-lg">
            {/* Top Navigation Items */}
            <div className="flex flex-col gap-3 items-center">
                {topIcons.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <motion.div
                            key={item.id}
                            className="relative group"
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                        >
                            {/* Active indicator bar - Left side - Enhanced */}
                            {isActive && (
                                <motion.div
                                    layoutId="activeIndicator"
                                    className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-1.5 h-9 bg-[#00d084] rounded-r-full shadow-lg shadow-[#00d084]/50"
                                    transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                                />
                            )}

                            {/* Icon Button with enhanced active state */}
                            <motion.button
                                onClick={() => onTabChange(item.id as any)}
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 relative overflow-hidden group/btn ${
                                    isActive
                                        ? 'bg-[#00d084] text-[#202c33] shadow-lg shadow-[#00d084]/40 scale-110'
                                        : 'bg-transparent text-gray-300 hover:bg-[#2a3a42] hover:text-white'
                                }`}
                                whileHover={{
                                    backgroundColor: isActive ? '#00d084' : '#2a3a42',
                                }}
                                whileTap={{ scale: 0.9 }}
                            >
                                {/* Ripple effect background for inactive state */}
                                {!isActive && (
                                    <motion.div
                                        className="absolute inset-0 bg-white rounded-full opacity-0"
                                        whileHover={{ opacity: 0.1 }}
                                    />
                                )}
                                <Icon className="w-5 h-5 relative z-10" strokeWidth={isActive ? 2.5 : 2} />
                            </motion.button>

                            {/* Tooltip with enhanced styling */}
                            <motion.div
                                className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-[#111b21] border border-[#2a3a42] text-white px-3 py-1.5 rounded text-xs whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg"
                                initial={{ x: -5, opacity: 0 }}
                                whileHover={{ x: 0, opacity: 1 }}
                            >
                                {item.tooltip}
                                {isActive && (
                                    <span className="ml-1 text-[#00d084] font-semibold">●</span>
                                )}
                            </motion.div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Bottom Navigation Items */}
            <div className="flex flex-col gap-3 items-center">
                {/* Meta AI Icon - Enhanced */}
                <motion.div
                    className="group relative"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                >
                    <motion.button
                        className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-200 group/btn relative overflow-hidden"
                        whileHover={{
                            scale: 1.05,
                        }}
                        whileTap={{ scale: 0.9 }}
                    >
                        {/* Animated background glow */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-0"
                            whileHover={{ opacity: 0.3 }}
                        />
                        <Sparkles className="w-5 h-5 relative z-10" strokeWidth={2} />
                    </motion.button>
                    <motion.div
                        className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1.5 rounded text-xs whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg shadow-purple-500/50"
                        initial={{ x: -5, opacity: 0 }}
                        whileHover={{ x: 0, opacity: 1 }}
                    >
                        Meta AI
                    </motion.div>
                </motion.div>

                {/* Starred Messages Icon - Enhanced */}
                <motion.div
                    className="group relative"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                >
                    <motion.button
                        onClick={onStarredClick}
                        className="w-12 h-12 rounded-full flex items-center justify-center bg-transparent text-gray-300 hover:bg-[#2a3a42] hover:text-yellow-400 transition-all duration-200 group/btn relative overflow-hidden"
                        whileHover={{
                            backgroundColor: '#2a3a42',
                        }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <motion.div
                            className="absolute inset-0 bg-white rounded-full opacity-0"
                            whileHover={{ opacity: 0.1 }}
                        />
                        <Star className="w-5 h-5 relative z-10" strokeWidth={2} />
                    </motion.button>
                    <motion.div
                        className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-[#111b21] border border-[#2a3a42] text-white px-3 py-1.5 rounded text-xs whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg"
                        initial={{ x: -5, opacity: 0 }}
                        whileHover={{ x: 0, opacity: 1 }}
                    >
                        Starred Messages
                    </motion.div>
                </motion.div>

                {/* Divider */}
                <div className="w-8 h-px bg-[#2a3a42] my-2" />

                {/* User Profile Avatar - Enhanced */}
                <motion.div
                    className="group relative"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                >
                    <motion.button
                        onClick={onProfileClick}
                        className="w-12 h-12 rounded-full overflow-hidden border-2 border-transparent hover:border-[#00d084] transition-all duration-200 flex items-center justify-center bg-gray-400 shadow-md hover:shadow-lg hover:shadow-[#00d084]/40 group/btn relative"
                        whileHover={{
                            borderColor: '#00d084',
                        }}
                        whileTap={{ scale: 0.9 }}
                    >
                        {userAvatar ? (
                            <img
                                src={userAvatar}
                                alt={userName || 'Profile'}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#00d084] to-[#005c4b] flex items-center justify-center text-white font-bold text-lg">
                                {(userName || 'U').charAt(0).toUpperCase()}
                            </div>
                        )}
                    </motion.button>
                    <motion.div
                        className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-[#111b21] border border-[#2a3a42] text-white px-3 py-1.5 rounded text-xs whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg"
                        initial={{ x: -5, opacity: 0 }}
                        whileHover={{ x: 0, opacity: 1 }}
                    >
                        Profile
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};
