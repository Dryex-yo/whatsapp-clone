import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Search, MapPin, Mail, Phone, Plus, AlertCircle, Loader2, Users, X } from 'lucide-react';
import { scaleInVariants, slideUpVariants, containerVariants, itemVariants } from '@/utils/animationVariants';
import type { User } from '@/types/chat';

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

interface AddContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

/**
 * Add Contact Modal Component
 * 
 * Displays a modal with two tabs:
 * 1. Manual Search: Find users by Email/Phone/Name
 * 2. People Nearby: Auto-populate using geolocation
 */
export const AddContactModal: React.FC<AddContactModalProps> = ({ 
    isOpen, 
    onClose,
    onSuccess 
}) => {
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
        if (isOpen && activeTab === 'nearby' && isGeolocationSupported && !userLocation) {
            loadNearbyUsers();
        }
    }, [activeTab, isOpen, isGeolocationSupported, userLocation]);

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
     * Add selected contacts via API
     */
    const handleAddContacts = useCallback(async () => {
        if (selectedContacts.size === 0) return;

        setIsAddingContacts(true);

        try {
            const response = await fetch('/contacts/store', {
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

            // Clear selections and close modal
            setSelectedContacts(new Set());
            setSearchQuery('');
            setManualSearchResults([]);
            onClose();
            
            // Call success callback if provided
            if (onSuccess) {
                onSuccess();
            }
        } catch (err) {
            console.error('Add contacts error:', err);
            setManualError('Failed to add contacts. Please try again.');
        } finally {
            setIsAddingContacts(false);
        }
    }, [selectedContacts, onClose, onSuccess]);

    /**
     * Render user item
     */
    const renderUserItem = (user: SearchResult | NearbyUser, isNearby = false) => {
        const isSelected = selectedContacts.has(user.id);
        return (
            <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                    isSelected
                        ? 'bg-[#00a884]/10 border border-[#00a884]/30'
                        : 'bg-[#202c33] hover:bg-[#2a3a42] border border-[#2a3a42]'
                }`}
                onClick={() => toggleContact(user.id)}
            >
                {/* Checkbox */}
                <motion.div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected
                            ? 'bg-[#00a884] border-[#00a884]'
                            : 'border-gray-500'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {isSelected && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-white text-xs"
                        >
                            ✓
                        </motion.div>
                    )}
                </motion.div>

                {/* Avatar */}
                <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    {isNearby && (user as NearbyUser).distance ? (
                        <p className="text-xs text-gray-400">
                            {(user as NearbyUser).distance?.toFixed(1)} km away
                        </p>
                    ) : (
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    )}
                    {(user as NearbyUser).bio && (
                        <p className="text-xs text-gray-500 truncate">{(user as NearbyUser).bio}</p>
                    )}
                </div>

                {/* Plus icon */}
                <motion.div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected
                            ? 'bg-[#00a884] text-white'
                            : 'bg-gray-600 text-gray-400'
                    }`}
                    whileHover={{ scale: 1.15 }}
                >
                    <Plus className="w-3.5 h-3.5" />
                </motion.div>
            </motion.div>
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
                >
                    {/* Modal Background */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        variants={slideUpVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="relative w-full md:w-full md:max-w-2xl h-[90vh] md:h-[80vh] rounded-t-3xl md:rounded-2xl bg-[#111b21] border border-[#2a3a42] flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a3a42]">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-100 transition"
                            >
                                <X className="w-6 h-6" />
                            </motion.button>

                            <h2 className="text-lg font-bold text-white">
                                Tambah Kontak
                            </h2>

                            <div className="w-6" /> {/* Spacer */}
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-4 px-6 py-4 border-b border-[#2a3a42]">
                            {(['manual', 'nearby'] as const).map((tab) => (
                                <motion.button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`pb-2 font-medium text-sm transition-colors relative ${
                                        activeTab === tab
                                            ? 'text-[#00a884]'
                                            : 'text-gray-400 hover:text-gray-200'
                                    }`}
                                >
                                    {tab === 'manual' ? 'Cari' : 'Pengguna di Sekitar'}
                                    {activeTab === tab && (
                                        <motion.div
                                            layoutId="tab-underline"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00a884]"
                                        />
                                    )}
                                </motion.button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <AnimatePresence mode="wait">
                                {activeTab === 'manual' ? (
                                    <motion.div
                                        key="manual"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="p-6 space-y-4"
                                    >
                                        {/* Search Input */}
                                        <div className="relative">
                                            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                                            <input
                                                type="text"
                                                placeholder="Cari email, nomor, atau nama..."
                                                value={searchQuery}
                                                onChange={handleSearchChange}
                                                className="w-full pl-10 pr-4 py-2 bg-[#202c33] border border-[#2a3a42] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00a884]"
                                            />
                                        </div>

                                        {/* Error */}
                                        {manualError && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg"
                                            >
                                                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                                <p className="text-sm text-red-300">{manualError}</p>
                                            </motion.div>
                                        )}

                                        {/* Loading */}
                                        {isManualSearching && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex items-center justify-center py-8"
                                            >
                                                <Loader2 className="w-6 h-6 text-[#00a884] animate-spin" />
                                            </motion.div>
                                        )}

                                        {/* Results */}
                                        {!isManualSearching && manualSearchResults.length > 0 && (
                                            <motion.div
                                                variants={containerVariants}
                                                initial="hidden"
                                                animate="visible"
                                                className="space-y-3"
                                            >
                                                {manualSearchResults.map((user) =>
                                                    renderUserItem(user, false)
                                                )}
                                            </motion.div>
                                        )}

                                        {!isManualSearching && searchQuery.length >= 3 && manualSearchResults.length === 0 && !manualError && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex flex-col items-center justify-center py-8"
                                            >
                                                <Users className="w-12 h-12 text-gray-600 mb-2" />
                                                <p className="text-gray-400 text-sm">Tidak ada hasil ditemukan</p>
                                            </motion.div>
                                        )}

                                        {!isManualSearching && searchQuery.length < 3 && manualSearchResults.length === 0 && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex flex-col items-center justify-center py-8"
                                            >
                                                <Search className="w-12 h-12 text-gray-600 mb-2" />
                                                <p className="text-gray-400 text-sm">Ketik minimal 3 karakter untuk mencari</p>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="nearby"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="p-6 space-y-4"
                                    >
                                        {/* Radius Slider */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">
                                                Radius: {searchRadius} km
                                            </label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="50"
                                                value={searchRadius}
                                                onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                                                className="w-full accent-[#00a884]"
                                            />
                                        </div>

                                        {/* Refresh Button */}
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={loadNearbyUsers}
                                            disabled={isLoadingNearby}
                                            className="w-full py-2 bg-[#00a884] hover:bg-[#00a884]/90 text-white rounded-lg font-medium text-sm disabled:opacity-50"
                                        >
                                            {isLoadingNearby ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Loading...
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2">
                                                    <MapPin className="w-4 h-4" />
                                                    Refresh Lokasi
                                                </div>
                                            )}
                                        </motion.button>

                                        {/* Error */}
                                        {nearbyError && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg"
                                            >
                                                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                                <p className="text-sm text-red-300">{nearbyError}</p>
                                            </motion.div>
                                        )}

                                        {/* Loading */}
                                        {isLoadingNearby && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex items-center justify-center py-8"
                                            >
                                                <Loader2 className="w-6 h-6 text-[#00a884] animate-spin" />
                                            </motion.div>
                                        )}

                                        {/* Results */}
                                        {!isLoadingNearby && nearbyUsers.length > 0 && (
                                            <motion.div
                                                variants={containerVariants}
                                                initial="hidden"
                                                animate="visible"
                                                className="space-y-3"
                                            >
                                                {nearbyUsers.map((user) =>
                                                    renderUserItem(user, true)
                                                )}
                                            </motion.div>
                                        )}

                                        {!isLoadingNearby && nearbyUsers.length === 0 && !nearbyError && userLocation && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex flex-col items-center justify-center py-8"
                                            >
                                                <Users className="w-12 h-12 text-gray-600 mb-2" />
                                                <p className="text-gray-400 text-sm">Tidak ada pengguna di sekitar Anda</p>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-[#2a3a42] px-6 py-4 flex gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                className="flex-1 py-2 bg-[#202c33] hover:bg-[#2a3a42] text-white rounded-lg font-medium text-sm"
                            >
                                Batal
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleAddContacts}
                                disabled={selectedContacts.size === 0 || isAddingContacts}
                                className="flex-1 py-2 bg-[#00a884] hover:bg-[#00a884]/90 text-white rounded-lg font-medium text-sm disabled:opacity-50"
                            >
                                {isAddingContacts ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Menambahkan...
                                    </div>
                                ) : (
                                    `Tambah ({selectedContacts.size})`
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
