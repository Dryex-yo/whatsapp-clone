import { useEffect, useState, useCallback } from 'react';

interface EchoStatus {
    isConnected: boolean;
    isConnecting: boolean;
    lastError: string | null;
    connectionAttempts: number;
}

/**
 * Hook to monitor Laravel Echo connection status
 * Listens to Echo-specific events dispatched from the Echo setup
 */
export function useEchoStatus() {
    const [status, setStatus] = useState<EchoStatus>({
        isConnected: true,
        isConnecting: false,
        lastError: null,
        connectionAttempts: 0,
    });

    useEffect(() => {
        // Handle Echo connected event
        const handleConnected = () => {
            setStatus((prev) => ({
                ...prev,
                isConnected: true,
                isConnecting: false,
                lastError: null,
            }));
        };

        // Handle Echo disconnected event
        const handleDisconnected = () => {
            setStatus((prev) => ({
                ...prev,
                isConnected: false,
                isConnecting: false,
            }));
        };

        // Handle Echo reconnecting event
        const handleReconnecting = () => {
            setStatus((prev) => ({
                ...prev,
                isConnecting: true,
                connectionAttempts: prev.connectionAttempts + 1,
            }));
        };

        // Handle Echo reconnected event
        const handleReconnected = () => {
            setStatus((prev) => ({
                ...prev,
                isConnected: true,
                isConnecting: false,
                connectionAttempts: 0,
                lastError: null,
            }));
        };

        // Handle Echo error event
        const handleError = (event: CustomEvent<{ error: string }>) => {
            setStatus((prev) => ({
                ...prev,
                lastError: event.detail?.error || 'Unknown error',
                isConnecting: true,
            }));
        };

        // Handle max attempts reached
        const handleMaxAttemptsReached = () => {
            setStatus((prev) => ({
                ...prev,
                lastError: 'Failed to reconnect after multiple attempts',
                isConnecting: false,
            }));
        };

        // Add event listeners
        window.addEventListener('echo:connected', handleConnected as EventListener);
        window.addEventListener('echo:disconnected', handleDisconnected as EventListener);
        window.addEventListener('echo:reconnecting', handleReconnecting as EventListener);
        window.addEventListener('echo:reconnected', handleReconnected as EventListener);
        window.addEventListener('echo:error', handleError as EventListener);
        window.addEventListener('echo:max_attempts_reached', handleMaxAttemptsReached as EventListener);

        // Cleanup
        return () => {
            window.removeEventListener('echo:connected', handleConnected as EventListener);
            window.removeEventListener('echo:disconnected', handleDisconnected as EventListener);
            window.removeEventListener('echo:reconnecting', handleReconnecting as EventListener);
            window.removeEventListener('echo:reconnected', handleReconnected as EventListener);
            window.removeEventListener('echo:error', handleError as EventListener);
            window.removeEventListener('echo:max_attempts_reached', handleMaxAttemptsReached as EventListener);
        };
    }, []);

    return status;
}

/**
 * Hook to subscribe to a channel and handle its events
 * @param channelName - Name of the channel to subscribe to
 * @param onEvent - Callback function for channel events
 */
export function useChannelSubscription(
    channelName: string,
    onEvent?: (data: unknown) => void
) {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const unsubscribe = useCallback(() => {
        if (window.Echo) {
            window.Echo.leave(channelName);
            setIsSubscribed(false);
        }
    }, [channelName]);

    useEffect(() => {
        if (!window.Echo) {
            setError('Echo not initialized');
            return;
        }

        try {
            const channel = window.Echo.channel(channelName);

            if (onEvent) {
                // Subscribe to all events on the channel
                channel.listen('.event', onEvent);
            }

            setIsSubscribed(true);
            setError(null);

            return unsubscribe;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return () => {};
        }
    }, [channelName, onEvent, unsubscribe]);

    return { isSubscribed, error, unsubscribe };
}

/**
 * Hook to listen for a specific broadcast event
 * @param channelName - Name of the channel
 * @param eventName - Name of the event to listen for
 * @param callback - Function to call when event is received
 */
export function useBroadcastEvent(
    channelName: string,
    eventName: string,
    callback: (data: unknown) => void
) {
    const [isListening, setIsListening] = useState(false);

    useEffect(() => {
        if (!window.Echo) {
            console.warn('Echo not initialized');
            return;
        }

        try {
            window.Echo.channel(channelName).listen(eventName, callback);
            setIsListening(true);

            return () => {
                window.Echo.leave(channelName);
                setIsListening(false);
            };
        } catch (err) {
            console.error('Failed to listen to broadcast event:', err);
            return () => {};
        }
    }, [channelName, eventName, callback]);

    return isListening;
}
