/**
 * Echo - Laravel Echo Instance Setup with Offline/Reconnect Support
 * 
 * Configures Laravel Echo for real-time WebSocket communication with:
 * - Automatic reconnection on network recovery
 * - Offline event detection and handling
 * - Exponential backoff for reconnection attempts
 * 
 * Requires:
 * - composer require laravel/reverb
 * - npm install laravel-echo socket.io-client
 * - Set BROADCAST_DRIVER=reverb in .env
 */

import Echo from 'laravel-echo';
import io from 'socket.io-client';

declare global {
    interface Window {
        io: typeof io;
        Echo?: any;
    }
}

window.io = io;

// Track connection state
let isConnected = navigator.onLine;
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;
let reconnectTimeout: NodeJS.Timeout | null = null;

// Calculate exponential backoff (1s, 2s, 4s, 8s, 16s, etc. up to 60s)
function getReconnectDelay(attempts: number): number {
    const delay = Math.pow(2, Math.min(attempts, 5)) * 1000; // Max 32 seconds
    return Math.min(delay, 60000);
}

// Create the Echo instance
const echo: any = new Echo({
    broadcaster: 'socket.io',
    host: window.location.hostname,
    port: 8000,
    secure: window.location.protocol === 'https:',
    rejectUnauthorized: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    auth: {
        headers: {
            Authorization: `Bearer ${
                document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute('content') || ''
            }`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
    },
});

// Handle online/offline events
function handleOnline() {
    if (!isConnected) {
        isConnected = true;
        reconnectAttempts = 0;

        // Attempt to reconnect
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }

        // Force reconnection
        if (echo.connector?.socket) {
            echo.connector.socket.connect();
        }

        console.log('[Echo] Network recovered, attempting to reconnect...');
        dispatchNetworkEvent('echo:reconnecting');
    }
}

function handleOffline() {
    if (isConnected) {
        isConnected = false;
        console.log('[Echo] Network lost');
        dispatchNetworkEvent('echo:disconnected');
    }
}

// Monitor Socket.IO connection events
if (echo.connector?.socket) {
    // Connection established
    echo.connector.socket.on('connect', () => {
        isConnected = true;
        reconnectAttempts = 0;
        console.log('[Echo] Connected to WebSocket');
        dispatchNetworkEvent('echo:connected');
    });

    // Connection lost
    echo.connector.socket.on('disconnect', (reason: string) => {
        isConnected = false;
        console.log('[Echo] Disconnected from WebSocket:', reason);
        dispatchNetworkEvent('echo:disconnected');

        // If disconnected due to network issues, attempt manual reconnection
        if (navigator.onLine && reason === 'io server disconnect') {
            attemptReconnect();
        }
    });

    // Connection error
    echo.connector.socket.on('connect_error', (error: Error) => {
        console.warn('[Echo] Connection error:', error);
        dispatchNetworkEvent('echo:error', { error: error.message });

        // Attempt reconnection with exponential backoff
        if (navigator.onLine) {
            attemptReconnect();
        }
    });

    // Reconnection attempt
    echo.connector.socket.on('reconnect_attempt', () => {
        reconnectAttempts++;
        const delay = getReconnectDelay(reconnectAttempts);
        console.log(
            `[Echo] Reconnection attempt ${reconnectAttempts}/${maxReconnectAttempts}, delay: ${delay}ms`
        );
    });

    // Successful reconnection
    echo.connector.socket.on('reconnect', () => {
        reconnectAttempts = 0;
        isConnected = true;
        console.log('[Echo] Successfully reconnected');
        dispatchNetworkEvent('echo:reconnected');
    });

    // Clear reconnection timeout on successful reconnect
    echo.connector.socket.on('reconnect', () => {
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }
    });
}

// Implement manual reconnect logic with exponential backoff
function attemptReconnect() {
    if (!navigator.onLine) return;

    if (reconnectAttempts >= maxReconnectAttempts) {
        console.warn('[Echo] Max reconnection attempts reached');
        dispatchNetworkEvent('echo:max_attempts_reached');
        return;
    }

    if (reconnectTimeout) {
        return; // Already attempting to reconnect
    }

    const delay = getReconnectDelay(reconnectAttempts);
    reconnectAttempts++;

    console.log(
        `[Echo] Manual reconnect attempt ${reconnectAttempts}/${maxReconnectAttempts} in ${delay}ms`
    );

    reconnectTimeout = setTimeout(() => {
        if (navigator.onLine && echo.connector?.socket) {
            reconnectTimeout = null;
            echo.connector.socket.connect();
        }
    }, delay);
}

// Dispatch custom events for other parts of the app to listen to
function dispatchNetworkEvent(eventName: string, detail?: unknown) {
    window.dispatchEvent(
        new CustomEvent(eventName, { detail: detail || {} })
    );
}

// Listen to window online/offline events
window.addEventListener('online', handleOnline);
window.addEventListener('offline', handleOffline);

// Cleanup on unload
window.addEventListener('beforeunload', () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
    }
});

export default echo;

// Export utility functions for manual control if needed
export { attemptReconnect, isConnected };

