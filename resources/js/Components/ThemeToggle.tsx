import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Zap } from 'lucide-react';
import { useTheme } from '../contexts/ThemeProvider';

export const ThemeToggle: React.FC = () => {
    const { theme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    const themes = [
        { value: 'light' as const, label: 'Light', icon: Sun },
        { value: 'dark' as const, label: 'Dark', icon: Moon },
        { value: 'system' as const, label: 'System', icon: Zap },
    ];

    const currentTheme = themes.find((t) => t.value === theme);
    const CurrentIcon = currentTheme?.icon || Sun;

    const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
        await setTheme(newTheme);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#2a3942] transition-colors text-gray-600 dark:text-gray-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={`Current theme: ${currentTheme?.label}`}
            >
                <CurrentIcon className="w-5 h-5" />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-[#202c33] rounded-lg shadow-lg dark:shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
                    >
                        <div className="p-2">
                            {themes.map((t) => {
                                const Icon = t.icon;
                                const isSelected = theme === t.value;

                                return (
                                    <motion.button
                                        key={t.value}
                                        onClick={() => handleThemeChange(t.value)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                            isSelected
                                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a3942]'
                                        }`}
                                        whileHover={{ x: 4 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Icon className="w-5 h-5 flex-shrink-0" />
                                        <span className="flex-1 text-left font-medium text-sm">
                                            {t.label}
                                        </span>
                                        {isSelected && (
                                            <motion.div
                                                layoutId="activeTheme"
                                                className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400"
                                                transition={{ duration: 0.2 }}
                                            />
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Close menu when clicking outside */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};
