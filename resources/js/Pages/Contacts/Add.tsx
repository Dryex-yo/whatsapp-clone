import React, { useState, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Search, Mail, Phone, Check, Loader2 } from 'lucide-react';
import type { User } from '@/types/chat';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';

interface PageProps extends InertiaPageProps {
    auth: { user: User };
}

interface SearchResult {
    id: number;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
}

/**
 * Add Contact Page
 * Allows users to search for and add contacts by phone number or email
 */
export default function AddContactPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set());
    const [isAddingContacts, setIsAddingContacts] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Handle search input change
    const handleSearchChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const query = e.target.value;
            setSearchQuery(query);
            setError(null);

            if (!query.trim()) {
                setSearchResults([]);
                return;
            }

            // Only search if input is at least 3 characters
            if (query.length < 3) {
                setSearchResults([]);
                return;
            }

            searchUsers(query);
        },
        []
    );

    // Search for users
    const searchUsers = useCallback(async (query: string) => {
        setIsSearching(true);
        try {
            const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error('Search failed');
            }

            const data = await response.json();
            setSearchResults(data.results || []);
            if (data.results.length === 0) {
                setError('No users found matching your search');
            }
        } catch (err) {
            console.error('Search error:', err);
            setError('Failed to search users. Please try again.');
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Toggle contact selection
    const toggleContact = useCallback((userId: number) => {
        setSelectedContacts((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
    }, []);

    // Add selected contacts
    const handleAddContacts = useCallback(async () => {
        if (selectedContacts.size === 0) return;

        setIsAddingContacts(true);
        try {
            const response = await fetch('/api/contacts/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    user_ids: Array.from(selectedContacts),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to add contacts');
            }

            // Navigate back to chat page
            router.visit('/chat', {
                preserveScroll: true,
            });
        } catch (err) {
            console.error('Add contacts error:', err);
            setError('Failed to add contacts. Please try again.');
        } finally {
            setIsAddingContacts(false);
        }
    }, [selectedContacts]);

    // Handle back button
    const handleBack = useCallback(() => {
        router.visit('/chat', {
            preserveScroll: true,
        });
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 w-screen h-screen bg-[#0b141a] overflow-hidden"
        >
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-[60px] px-6 bg-[#202c33] border-b border-[#1f2937] flex items-center justify-between flex-shrink-0"
            >
                <div className="flex items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleBack}
                        className="text-gray-400 hover:text-gray-100 transition"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </motion.button>
                    <h2 className="text-[15px] font-600 text-gray-100">Tambah Kontak</h2>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddContacts}
                    disabled={selectedContacts.size === 0 || isAddingContacts}
                    className={`px-4 py-2 rounded-lg font-500 text-sm transition-all ${
                        selectedContacts.size > 0 && !isAddingContacts
                            ? 'bg-[#005c4b] text-white hover:bg-[#00a884]'
                            : 'bg-[#2a3a42] text-gray-500 cursor-not-allowed'
                    }`}
                >
                    {isAddingContacts ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        `Tambah (${selectedContacts.size})`
                    )}
                </motion.button>
            </motion.header>

            {/* Main Content */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex-1 flex flex-col overflow-hidden"
            >
                {/* Search Bar */}
                <motion.div
                    className="px-4 py-4 bg-[#111b21] border-b border-[#202c33] flex-shrink-0"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="relative flex items-center">
                        <Search className="absolute left-3 w-4 h-4 text-gray-500 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Cari nomor telepon atau email..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="w-full pl-10 pr-4 py-2.5 bg-[#202c33] border border-[#2a3a42] rounded-lg focus:ring-2 focus:ring-[#005c4b] focus:border-transparent text-white placeholder-gray-500 outline-none transition-all"
                        />
                        {isSearching && (
                            <Loader2 className="absolute right-3 w-4 h-4 text-[#005c4b] animate-spin" />
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Masukkan minimal 3 karakter untuk mencari
                    </p>
                </motion.div>

                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="px-4 py-3 mx-4 mt-4 bg-red-500/20 border border-red-500/40 rounded-lg text-red-300 text-sm"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Search Results */}
                <motion.div
                    className="flex-1 overflow-y-auto custom-scrollbar"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                >
                    {searchQuery.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center h-full px-4"
                        >
                            <Search className="w-16 h-16 text-[#005c4b] opacity-30 mb-4" />
                            <p className="text-gray-400 text-center">
                                Mulai ketik nomor telepon atau email untuk mencari pengguna
                            </p>
                        </motion.div>
                    ) : searchResults.length === 0 && !isSearching ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center h-full px-4"
                        >
                            <Search className="w-16 h-16 text-[#005c4b] opacity-30 mb-4" />
                            <p className="text-gray-400 text-center">
                                Tidak ada pengguna ditemukan dengan pencarian: <span className="font-600 text-white">{searchQuery}</span>
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div className="space-y-2 p-4">
                            <AnimatePresence>
                                {searchResults.map((user, index) => (
                                    <motion.button
                                        key={user.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => toggleContact(user.id)}
                                        className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                                            selectedContacts.has(user.id)
                                                ? 'bg-[#2a3a42] border-[#005c4b]'
                                                : 'bg-[#202c33] border-[#2a3a42] hover:border-[#005c4b]/30'
                                        }`}
                                    >
                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
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
                                            <div className="flex gap-3 mt-1">
                                                {user.email && (
                                                    <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
                                                        <Mail className="w-3 h-3 flex-shrink-0" />
                                                        <span className="truncate">{user.email}</span>
                                                    </p>
                                                )}
                                                {user.phone && (
                                                    <p className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Phone className="w-3 h-3 flex-shrink-0" />
                                                        <span>{user.phone}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Selection Checkbox */}
                                        <motion.div
                                            initial={{ scale: 0.8 }}
                                            animate={{ scale: 1 }}
                                            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                                                selectedContacts.has(user.id)
                                                    ? 'bg-[#005c4b]'
                                                    : 'bg-[#2a3a42]'
                                            }`}
                                        >
                                            {selectedContacts.has(user.id) && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                >
                                                    <Check className="w-4 h-4 text-white" />
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    </motion.button>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>
        </motion.div>
    );
}
