import React, { useState } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatSearch } from '@/hooks/useSearch';
import type { Message } from '@/types/chat';

export interface SearchInChatProps {
    conversationId?: number;
    onSelectMessage?: (message: Message) => void;
    onClose?: () => void;
}

/**
 * SearchInChat Component
 * Allows searching for specific messages within the active conversation
 * Shows match count and navigation controls
 */
export const SearchInChat: React.FC<SearchInChatProps> = ({
    conversationId,
    onSelectMessage,
    onClose,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const { searchQuery, handleSearch, results, isLoading } = useChatSearch(conversationId);

    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (isOpen) {
            setSelectedIndex(0);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setSelectedIndex(0);
        onClose?.();
    };

    const navigateNext = () => {
        if (results.messages.length > 0) {
            setSelectedIndex((prev) => (prev + 1) % results.messages.length);
        }
    };

    const navigatePrev = () => {
        if (results.messages.length > 0) {
            setSelectedIndex((prev) => (prev - 1 + results.messages.length) % results.messages.length);
        }
    };

    const selectedMessage = results.messages[selectedIndex];

    const handleSelectMessage = () => {
        if (selectedMessage && onSelectMessage) {
            onSelectMessage(selectedMessage);
            handleClose();
        }
    };

    return (
        <>
            {/* Floating Search Button */}
            <motion.button
                onClick={handleToggle}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-[#005c4b] hover:bg-[#00a884] text-white transition-colors"
                title="Search in conversation (Ctrl+F)"
            >
                <Search className="w-5 h-5" />
            </motion.button>

            {/* Search Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-0 left-0 right-0 z-30 bg-[#202c33] border-b border-[#1f2937] shadow-lg"
                    >
                        <div className="p-4 flex gap-2 items-center">
                            {/* Search Input */}
                            <div className="flex-1 relative">
                                <div className="flex items-center bg-[#111b21] rounded-lg px-3 py-2">
                                    <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="Search messages..."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            handleSearch(e.target.value);
                                            setSelectedIndex(0);
                                        }}
                                        autoFocus
                                        className="bg-transparent border-none focus:ring-0 text-sm w-full text-white placeholder-gray-500 outline-none ml-2"
                                    />
                                </div>
                            </div>

                            {/* Results Info */}
                            {searchQuery && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-xs text-gray-400 whitespace-nowrap"
                                >
                                    {isLoading ? (
                                        <span>Searching...</span>
                                    ) : results.total > 0 ? (
                                        <span>{selectedIndex + 1} of {results.total}</span>
                                    ) : (
                                        <span>No matches</span>
                                    )}
                                </motion.div>
                            )}

                            {/* Navigation Buttons */}
                            {searchQuery && results.messages.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex gap-1"
                                >
                                    <button
                                        onClick={navigatePrev}
                                        className="p-2 hover:bg-[#2a3942] rounded transition-colors text-gray-400 hover:text-gray-200"
                                        title="Previous match"
                                    >
                                        <ChevronUp className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={navigateNext}
                                        className="p-2 hover:bg-[#2a3942] rounded transition-colors text-gray-400 hover:text-gray-200"
                                        title="Next match"
                                    >
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            )}

                            {/* Close Button */}
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-[#2a3942] rounded transition-colors text-gray-400 hover:text-gray-200"
                                title="Close search (Esc)"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Selected Message Preview */}
                        {selectedMessage && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="px-4 py-2 border-t border-[#1f2937] bg-[#111b21]"
                            >
                                <button
                                    onClick={handleSelectMessage}
                                    className="w-full text-left p-3 rounded-lg bg-[#2a3942] hover:bg-[#3a4952] transition-colors"
                                >
                                    <div className="text-xs text-gray-500 mb-1">
                                        {selectedMessage.user?.name || 'Unknown'}
                                    </div>
                                    <div className="text-sm text-white truncate">
                                        {selectedMessage.body}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {new Date(selectedMessage.created_at!).toLocaleString()}
                                    </div>
                                </button>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

/**
 * useSearchInChat Hook
 * Provides keyboard shortcuts for search (Ctrl+F)
 */
export const useSearchInChat = () => {
    const [isSearchOpen, setIsSearchOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+F or Cmd+F to open search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
            // Esc to close search
            if (e.key === 'Escape') {
                setIsSearchOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return { isSearchOpen, setIsSearchOpen, searchQuery, setSearchQuery };
};
