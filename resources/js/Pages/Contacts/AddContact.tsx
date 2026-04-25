import React, { useState, useCallback, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Search, MapPin, Mail, Phone, Plus, AlertCircle, Loader2, Users } from 'lucide-react';
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

interface NearbyUser extends SearchResult {
    bio?: string;
    distance?: number;
    latitude?: number;
    longitude?: number;
}

type TabType = 'manual' | 'nearby';

/**
 * Add Contact Page
 * 
 * Features two sections:
 * 1. Manual Search: Find users by Email/Phone
 * 2. People Nearby: Auto-populate using geolocation with radar animation
 */
export default function AddContactPage() {
    // Tab management
    const [activeTab, setActiveTab] = useState<TabType>('manual');

    // Manual search state
    const [searchQuery, setSearchQuery] = useState('');
    const [manualSearchResults, setManualSearchResults] = useState<SearchResult[]>([]);
    const [isManualSearching, setIsManualSearching] = useState(false);
    const [manualError, setManualError] = useState<string | null>(null);

    // Nearby users state
    const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
    const [isLoadingNearby, setIsLoadingNearby] = useState(false);
    const [nearbyError, setNearbyError] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isGeolocationSupported, setIsGeolocationSupported] = useState(true);
    const [searchRadius, setSearchRadius] = useState(5); // km

    // Global state
    const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set());
    const [isAddingContacts, setIsAddingContacts] = useState(false);

    // Check geolocation support on mount
    useEffect(() => {
        if (!navigator.geolocation) {
            setIsGeolocationSupported(false);
        }
    }, []);

    // Auto-load nearby users when nearby tab is opened
    useEffect(() => {
        if (activeTab === 'nearby' && isGeolocationSupported && !userLocation) {
            loadNearbyUsers();
        }
    }, [activeTab]);

    /**
     * Get user's current location and fetch nearby users
     */
    const loadNearbyUsers = useCallback(() => {
        if (!isGeolocationSupported) {
            setNearbyError('Geolocation is not supported on your device');
            return;
        }

        setIsLoadingNearby(true);
        setNearbyError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ lat: latitude, lng: longitude });
                fetchNearbyUsers(latitude, longitude);
            },
            (error) => {
                console.error('Geolocation error:', error);
                let errorMessage = 'Unable to get your location';

                if (error.code === error.PERMISSION_DENIED) {
                    errorMessage = 'Location permission denied. Please enable location services.';
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    errorMessage = 'Location information is unavailable.';
                } else if (error.code === error.TIMEOUT) {
                    errorMessage = 'The request to get user location timed out.';
                }

                setNearbyError(errorMessage);
                setIsLoadingNearby(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    }, [isGeolocationSupported]);

    /**
     * Fetch nearby users from API
     */
    const fetchNearbyUsers = useCallback(async (lat: number, lng: number) => {
        try {
            // First, update the user's location on the server
            // This ensures the current user appears in other users' nearby searches
            const updateResponse = await fetch('/api/user/location', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    latitude: lat,
                    longitude: lng,
                }),
            });

            if (!updateResponse.ok) {
                console.warn('Failed to update user location on server');
                // Continue anyway - we can still fetch nearby users
            }

            // Now fetch nearby users
            const response = await fetch('/api/users/nearby', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    lat,
                    lng,
                    radius: searchRadius,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch nearby users');
            }

            const data = await response.json();

            if (data.success) {
                setNearbyUsers(data.data || []);
                if (data.data.length === 0) {
                    setNearbyError('No users found nearby');
                }
            } else {
                setNearbyError(data.message || 'Failed to fetch nearby users');
            }
        } catch (err) {
            console.error('Nearby users fetch error:', err);
            setNearbyError('Failed to fetch nearby users. Please try again.');
        } finally {
            setIsLoadingNearby(false);
        }
    }, [searchRadius]);

    /**
     * Handle manual search input change
     */
    const handleSearchChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const query = e.target.value;
            setSearchQuery(query);
            setManualError(null);

            if (!query.trim()) {
                setManualSearchResults([]);
                return;
            }

            if (query.length < 3) {
                setManualSearchResults([]);
                return;
            }

            searchUsers(query);
        },
        []
    );

    /**
     * Search for users by email or phone
     */
    const searchUsers = useCallback(async (query: string) => {
        setIsManualSearching(true);
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
            setManualSearchResults(data.results || []);

            if (data.results.length === 0) {
                setManualError('No users found matching your search');
            }
        } catch (err) {
            console.error('Search error:', err);
            setManualError('Failed to search users. Please try again.');
            setManualSearchResults([]);
        } finally {
            setIsManualSearching(false);
        }
    }, []);

    /**
     * Toggle contact selection
     */
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

    /**
     * Add selected contacts via Inertia
     */
    const handleAddContacts = useCallback(() => {
        if (selectedContacts.size === 0) return;

        setIsAddingContacts(true);

        router.post('/contacts/store', {
            user_ids: Array.from(selectedContacts),
        }, {
            preserveScroll: true,
            onSuccess: () => {
                router.visit('/chat', {
                    preserveScroll: true,
                });
            },
            onError: () => {
                setIsAddingContacts(false);
            },
        });
    }, [selectedContacts]);

    /**
     * Handle back button
     */
    const handleBack = useCallback(() => {
        router.visit('/chat', {
            preserveScroll: true,
        });
    }, []);

    /**
     * Retry nearby users search
     */
    const handleRetryNearby = useCallback(() => {
        setNearbyUsers([]);
        setUserLocation(null);
        setNearbyError(null);
        loadNearbyUsers();
    }, [loadNearbyUsers]);

    // User list item component
    const UserListItem = ({ user, isNearby = false }: { user: SearchResult | NearbyUser; isNearby?: boolean }) => {
        const isSelected = selectedContacts.has(user.id);
        const nearbyUser = isNearby ? user as NearbyUser : null;

        return (
            <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-between p-4 border-b border-[#202c33] hover:bg-[#0f1418] transition-colors group"
            >
                <div className="flex-1 flex items-center gap-3">
                    {user.avatar ? (
                        <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-[#005c4b] flex items-center justify-center flex-shrink-0">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-500 truncate">{user.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-400 truncate">
                            {user.phone && (
                                <>
                                    <Phone className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{user.phone}</span>
                                </>
                            )}
                            {user.email && user.phone && <span>•</span>}
                            {user.email && (
                                <>
                                    <Mail className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{user.email}</span>
                                </>
                            )}
                        </div>
                        {nearbyUser?.distance !== undefined && (
                            <div className="flex items-center gap-1 text-xs text-[#005c4b] mt-1">
                                <MapPin className="w-3 h-3" />
                                <span>{nearbyUser.distance} km away</span>
                            </div>
                        )}
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleContact(user.id)}
                    className={`ml-3 p-2 rounded-full flex-shrink-0 transition-all ${
                        isSelected
                            ? 'bg-[#005c4b] text-white'
                            : 'bg-[#202c33] text-gray-400 hover:bg-[#2a3a42]'
                    }`}
                >
                    <Plus className="w-5 h-5" />
                </motion.button>
            </motion.div>
        );
    };

    // Radar animation component
    const RadarPulse = () => (
        <div className="flex flex-col items-center justify-center py-12 gap-6">
            <div className="relative w-24 h-24">
                {/* Outer pulse */}
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-[#005c4b]"
                    animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />

                {/* Middle pulse */}
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-[#005c4b]"
                    animate={{ scale: [1, 1.3], opacity: [1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                />

                {/* Center circle */}
                <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-[#005c4b] to-[#00a884] flex items-center justify-center"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                    <MapPin className="w-6 h-6 text-white" />
                </motion.div>
            </div>

            <p className="text-gray-400 text-sm text-center">Scanning for nearby users...</p>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 w-screen h-screen bg-[#0b141a] flex flex-col overflow-hidden"
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
                    <h2 className="text-[15px] font-600 text-gray-100">Add Contacts</h2>
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
                        `Add (${selectedContacts.size})`
                    )}
                </motion.button>
            </motion.header>

            {/* Tab Navigation */}
            <motion.div
                className="flex bg-[#111b21] border-b border-[#202c33] flex-shrink-0"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <button
                    onClick={() => setActiveTab('manual')}
                    className={`flex-1 py-3 px-4 text-sm font-500 transition-all border-b-2 ${
                        activeTab === 'manual'
                            ? 'text-[#00a884] border-[#00a884]'
                            : 'text-gray-400 border-transparent hover:text-gray-300'
                    }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <Search className="w-4 h-4" />
                        <span>Search</span>
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('nearby')}
                    className={`flex-1 py-3 px-4 text-sm font-500 transition-all border-b-2 ${
                        activeTab === 'nearby'
                            ? 'text-[#00a884] border-[#00a884]'
                            : 'text-gray-400 border-transparent hover:text-gray-300'
                    }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>Nearby</span>
                    </div>
                </button>
            </motion.div>

            {/* Content Area */}
            <motion.div
                className="flex-1 flex flex-col overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
            >
                <AnimatePresence mode="wait">
                    {activeTab === 'manual' && (
                        <motion.div
                            key="manual-tab"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col flex-1 overflow-hidden"
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
                                        placeholder="Search by email or phone..."
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        autoFocus
                                        className="w-full pl-10 pr-4 py-2.5 bg-[#202c33] border border-[#2a3a42] rounded-lg focus:ring-2 focus:ring-[#005c4b] focus:border-transparent text-white placeholder-gray-500 outline-none transition-all"
                                    />
                                    {isManualSearching && (
                                        <Loader2 className="absolute right-3 w-4 h-4 text-[#005c4b] animate-spin" />
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Enter at least 3 characters to search
                                </p>
                            </motion.div>

                            {/* Error Message */}
                            <AnimatePresence>
                                {manualError && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="px-4 py-3 mx-4 mt-4 bg-red-500/20 border border-red-500/40 rounded-lg text-red-300 text-sm flex items-start gap-2"
                                    >
                                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <span>{manualError}</span>
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
                                            Start typing an email or phone number to search
                                        </p>
                                    </motion.div>
                                ) : manualSearchResults.length === 0 && !isManualSearching ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center justify-center h-full px-4"
                                    >
                                        <Search className="w-16 h-16 text-[#005c4b] opacity-30 mb-4" />
                                        <p className="text-gray-400 text-center">
                                            No users found
                                        </p>
                                    </motion.div>
                                ) : (
                                    <AnimatePresence>
                                        <div className="divide-y divide-[#202c33]">
                                            {manualSearchResults.map((user) => (
                                                <UserListItem key={user.id} user={user} isNearby={false} />
                                            ))}
                                        </div>
                                    </AnimatePresence>
                                )}
                            </motion.div>
                        </motion.div>
                    )}

                    {activeTab === 'nearby' && (
                        <motion.div
                            key="nearby-tab"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col flex-1 overflow-hidden"
                        >
                            {/* Radius Control */}
                            {userLocation && !isLoadingNearby && nearbyUsers.length > 0 && (
                                <motion.div
                                    className="px-4 py-4 bg-[#111b21] border-b border-[#202c33] flex-shrink-0"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <label className="text-xs font-500 text-gray-300 mb-2 block">
                                        Search Radius: {searchRadius} km
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="20"
                                        value={searchRadius}
                                        onChange={(e) => {
                                            const newRadius = Number(e.target.value);
                                            setSearchRadius(newRadius);
                                            if (userLocation) {
                                                fetchNearbyUsers(userLocation.lat, userLocation.lng);
                                            }
                                        }}
                                        className="w-full h-2 bg-[#202c33] rounded-lg appearance-none cursor-pointer accent-[#005c4b]"
                                    />
                                </motion.div>
                            )}

                            {/* Error Message */}
                            <AnimatePresence>
                                {nearbyError && !isLoadingNearby && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="px-4 py-3 mx-4 mt-4 bg-red-500/20 border border-red-500/40 rounded-lg text-red-300 text-sm flex items-start gap-2"
                                    >
                                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p>{nearbyError}</p>
                                            {isGeolocationSupported && (
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={handleRetryNearby}
                                                    className="mt-2 text-xs bg-red-500/30 hover:bg-red-500/50 px-3 py-1 rounded transition-colors"
                                                >
                                                    Retry
                                                </motion.button>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Nearby Users List */}
                            <motion.div
                                className="flex-1 overflow-y-auto custom-scrollbar"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.15 }}
                            >
                                {isLoadingNearby ? (
                                    <RadarPulse />
                                ) : nearbyUsers.length === 0 && !nearbyError ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center justify-center h-full px-4"
                                    >
                                        <MapPin className="w-16 h-16 text-[#005c4b] opacity-30 mb-4" />
                                        <p className="text-gray-400 text-center">
                                            No users found nearby
                                        </p>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleRetryNearby}
                                            className="mt-4 px-4 py-2 bg-[#005c4b] hover:bg-[#00a884] text-white rounded-lg text-sm font-500 transition-colors"
                                        >
                                            Try Again
                                        </motion.button>
                                    </motion.div>
                                ) : (
                                    <AnimatePresence>
                                        <div className="divide-y divide-[#202c33]">
                                            {nearbyUsers.map((user) => (
                                                <UserListItem key={user.id} user={user} isNearby={true} />
                                            ))}
                                        </div>
                                    </AnimatePresence>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}
