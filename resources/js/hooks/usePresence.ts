import { useEffect, useState, useCallback, useRef } from 'react';
import type { User } from '@/types/chat';

/**
 * usePresence Hook
 * 
 * Manages presence channel subscriptions and tracks online users
 * Automatically updates user presence when entering a conversation
 * Requires Laravel Echo and presence channels to be configured
 */
export function usePresence(conversationId: number | undefined, currentUser: User | undefined) {
    const [onlineUsers, setOnlineUsers] = useState<Record<number, User>>({});
    const presenceRef = useRef<any>(null);
    const presenceUpdateRef = useRef<boolean>(false);

    // Update presence on server
    const updatePresence = useCallback(async () => {
        if (!conversationId || !currentUser?.id || presenceUpdateRef.current) {
            return;
        }

        presenceUpdateRef.current = true;

        try {
            const response = await fetch(`/api/conversations/${conversationId}/presence`, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                console.error('Failed to update presence:', response.statusText);
            }
        } catch (error) {
            console.error('Error updating presence:', error);
        } finally {
            presenceUpdateRef.current = false;
        }
    }, [conversationId, currentUser?.id]);

    useEffect(() => {
        if (!conversationId || !currentUser?.id) return;

        // Update presence on server
        updatePresence();

        // Check if Echo is available
        if (typeof window === 'undefined' || !window.Echo) {
            console.warn('Echo not available for presence channel');
            return;
        }

        try {
            // Join presence channel
            presenceRef.current = window.Echo.join(`chat.presence.${conversationId}`)
                // Called when current user joins
                .here((users: User[]) => {
                    const userMap = users.reduce((acc: Record<number, User>, user: User) => {
                        acc[user.id] = user;
                        return acc;
                    }, {});
                    setOnlineUsers(userMap);
                })
                // Called when another user joins
                .joining((user: User) => {
                    setOnlineUsers(prev => ({
                        ...prev,
                        [user.id]: user,
                    }));
                })
                // Called when another user leaves
                .leaving((user: User) => {
                    setOnlineUsers(prev => {
                        const newUsers = { ...prev };
                        delete newUsers[user.id];
                        return newUsers;
                    });
                })
                // Called when another user's presence data updates
                .updating((user: User) => {
                    setOnlineUsers(prev => ({
                        ...prev,
                        [user.id]: user,
                    }));
                });
        } catch (error) {
            console.error('Error joining presence channel:', error);
        }

        // Cleanup on unmount
        return () => {
            if (presenceRef.current) {
                presenceRef.current.leave();
                presenceRef.current = null;
            }
        };
    }, [conversationId, currentUser?.id, updatePresence]);

    return {
        onlineUsers,
        isUserOnline: useCallback((userId: number) => {
            return userId in onlineUsers;
        }, [onlineUsers]),
    };
}

/**
 * usePresenceChannel Hook (Alternative)
 * 
 * Lower-level hook for direct presence channel access
 * Use this if you need more control over presence events
 */
export function usePresenceChannel(
    conversationId: number | undefined,
    callbacks?: {
        onUserJoined?: (user: User) => void;
        onUserLeft?: (user: User) => void;
        onUserUpdated?: (user: User) => void;
    }
) {
    const channelRef = useRef<any>(null);

    useEffect(() => {
        if (!conversationId) return;

        if (typeof window === 'undefined' || !window.Echo) {
            console.warn('Echo not available for presence channel');
            return;
        }

        try {
            channelRef.current = window.Echo.join(`chat.presence.${conversationId}`)
                .joining((user: User) => {
                    callbacks?.onUserJoined?.(user);
                })
                .leaving((user: User) => {
                    callbacks?.onUserLeft?.(user);
                })
                .updating((user: User) => {
                    callbacks?.onUserUpdated?.(user);
                });
        } catch (error) {
            console.error('Error with presence channel:', error);
        }

        return () => {
            if (channelRef.current) {
                channelRef.current.leave();
                channelRef.current = null;
            }
        };
    }, [conversationId, callbacks]);

    return {
        leave: () => {
            if (channelRef.current) {
                channelRef.current.leave();
            }
        },
    };
}
