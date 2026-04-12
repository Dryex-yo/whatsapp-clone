import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * useTypingIndicator Hook
 * 
 * Manages typing indicator broadcasting and listening
 * Broadcasts typing status via whisper and listens for other users typing
 */
export function useTypingIndicator(
    conversationId: number | undefined,
    currentUserId: number | undefined,
    debounceMs: number = 3000
) {
    const [typingUsers, setTypingUsers] = useState<Record<number, string>>({});
    const typingTimeouts = useRef<Record<number, NodeJS.Timeout>>({});
    const lastTypingBroadcast = useRef<number>(0);
    const isTyping = useRef<boolean>(false);

    // Broadcast typing start
    const broadcastTypingStart = useCallback(() => {
        if (!conversationId || !currentUserId) return;

        // Avoid broadcasting too frequently
        const now = Date.now();
        if (now - lastTypingBroadcast.current < 1000) {
            return;
        }

        lastTypingBroadcast.current = now;

        if (typeof window === 'undefined' || !window.Echo) {
            console.warn('Echo not available for typing broadcast');
            return;
        }

        try {
            window.Echo.private(`chat.${conversationId}`).whisper('typing.started', {
                user_id: currentUserId,
                timestamp: now,
            });

            isTyping.current = true;
        } catch (error) {
            console.error('Error broadcasting typing start:', error);
        }
    }, [conversationId, currentUserId]);

    // Broadcast typing stop
    const broadcastTypingStop = useCallback(() => {
        if (!conversationId || !currentUserId) return;

        if (typeof window === 'undefined' || !window.Echo) {
            return;
        }

        try {
            window.Echo.private(`chat.${conversationId}`).whisper('typing.stopped', {
                user_id: currentUserId,
            });

            isTyping.current = false;
        } catch (error) {
            console.error('Error broadcasting typing stop:', error);
        }
    }, [conversationId, currentUserId]);

    // Setup listening
    useEffect(() => {
        if (!conversationId || !currentUserId) return;

        if (typeof window === 'undefined' || !window.Echo) {
            console.warn('Echo not available for typing indicator');
            return;
        }

        try {
            const channel = window.Echo.private(`chat.${conversationId}`)
                .listenForWhisper('typing.started', (data: { user_id: number; timestamp: number }) => {
                    // Ignore own typing
                    if (data.user_id === currentUserId) return;

                    // Add user to typing list
                    setTypingUsers(prev => ({
                        ...prev,
                        [data.user_id]: `User ${data.user_id}`, // Replace with actual user name in component
                    }));

                    // Clear existing timeout for this user
                    if (typingTimeouts.current[data.user_id]) {
                        clearTimeout(typingTimeouts.current[data.user_id]);
                    }

                    // Set new timeout to remove typing indicator
                    typingTimeouts.current[data.user_id] = setTimeout(() => {
                        setTypingUsers(prev => {
                            const newUsers = { ...prev };
                            delete newUsers[data.user_id];
                            return newUsers;
                        });
                        delete typingTimeouts.current[data.user_id];
                    }, debounceMs);
                })
                .listenForWhisper('typing.stopped', (data: { user_id: number }) => {
                    // Ignore own typing
                    if (data.user_id === currentUserId) return;

                    // Clear timeout for this user
                    if (typingTimeouts.current[data.user_id]) {
                        clearTimeout(typingTimeouts.current[data.user_id]);
                        delete typingTimeouts.current[data.user_id];
                    }

                    // Remove user from typing list
                    setTypingUsers(prev => {
                        const newUsers = { ...prev };
                        delete newUsers[data.user_id];
                        return newUsers;
                    });
                });

            return () => {
                // Cleanup
                Object.values(typingTimeouts.current).forEach(timeout => clearTimeout(timeout));
                typingTimeouts.current = {};

                if (channel) {
                    channel.stopListeningForWhisper('typing.started');
                    channel.stopListeningForWhisper('typing.stopped');
                }
            };
        } catch (error) {
            console.error('Error setting up typing listener:', error);
        }
    }, [conversationId, currentUserId, debounceMs]);

    return {
        typingUsers,
        broadcastTypingStart,
        broadcastTypingStop,
        isAnyoneTyping: Object.keys(typingUsers).length > 0,
        typingCount: Object.keys(typingUsers).length,
    };
}

/**
 * useTypingState Hook
 * 
 * Manages local typing state with debounce logic
 * Combines broadcasting with text input tracking
 */
export function useTypingState(
    conversationId: number | undefined,
    currentUserId: number | undefined,
    debounceMs: number = 3000
) {
    const { broadcastTypingStart, broadcastTypingStop, ...typingData } = useTypingIndicator(
        conversationId,
        currentUserId,
        debounceMs
    );

    const typingTimeoutRef = useRef<NodeJS.Timeout>();

    const handleInputChange = useCallback(
        (text: string) => {
            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            if (text.trim().length > 0) {
                // Broadcast typing start if not already typing
                broadcastTypingStart();

                // Set timeout to broadcast typing stop
                typingTimeoutRef.current = setTimeout(() => {
                    broadcastTypingStop();
                }, debounceMs);
            } else {
                // Stop typing immediately if text is empty
                broadcastTypingStop();
            }
        },
        [broadcastTypingStart, broadcastTypingStop, debounceMs]
    );

    const handleInputBlur = useCallback(() => {
        // Stop typing when input loses focus
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        broadcastTypingStop();
    }, [broadcastTypingStop]);

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    return {
        handleInputChange,
        handleInputBlur,
        ...typingData,
    };
}
