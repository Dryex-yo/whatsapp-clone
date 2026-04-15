import { useEffect, useState } from 'react';

interface ConnectionStatus {
    isOnline: boolean;
    type: 'offline' | '4g' | '3g' | '2g' | 'unknown';
    downlink?: number;
    effectiveType?: string;
    saveData?: boolean;
}

/**
 * Hook to monitor internet connection status and quality
 * Uses Navigator.connection API when available for detailed info
 */
export function useConnectionStatus(): ConnectionStatus {
    const [status, setStatus] = useState<ConnectionStatus>({
        isOnline: navigator.onLine,
        type: 'unknown',
    });

    useEffect(() => {
        // Get initial connection info
        const updateConnectionInfo = () => {
            const connection =
                (navigator as any).connection ||
                (navigator as any).mozConnection ||
                (navigator as any).webkitConnection;

            const type = connection?.effectiveType || 'unknown';

            setStatus({
                isOnline: navigator.onLine,
                type: type === '4g' ? '4g' : type === '3g' ? '3g' : type === '2g' ? '2g' : 'unknown',
                downlink: connection?.downlink,
                effectiveType: connection?.effectiveType,
                saveData: connection?.saveData,
            });
        };

        // Handle online/offline events
        const handleOnline = () => {
            updateConnectionInfo();
        };

        const handleOffline = () => {
            setStatus((prev) => ({
                ...prev,
                isOnline: false,
            }));
        };

        // Listen to connection change events
        const connection =
            (navigator as any).connection ||
            (navigator as any).mozConnection ||
            (navigator as any).webkitConnection;

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        if (connection) {
            connection.addEventListener('change', updateConnectionInfo);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);

            if (connection) {
                connection.removeEventListener('change', updateConnectionInfo);
            }
        };
    }, []);

    return status;
}

/**
 * Hook to detect slow/slow-start network connections
 * Useful for adapting UI/UX based on connection quality
 */
export function useIsSlowConnection(): boolean {
    const [isSlowConnection, setIsSlowConnection] = useState(false);
    const { effectiveType, saveData } = useConnectionStatus();

    useEffect(() => {
        const slow = effectiveType === '2g' || effectiveType === '3g' || saveData === true;
        setIsSlowConnection(slow);
    }, [effectiveType, saveData]);

    return isSlowConnection;
}

/**
 * Hook to monitor network changes and perform actions
 * @param callback - Function to call when network status changes
 */
export function useOnNetworkChange(
    callback: (isOnline: boolean, type: ConnectionStatus['type']) => void
) {
    const { isOnline, type } = useConnectionStatus();

    useEffect(() => {
        callback(isOnline, type);
    }, [isOnline, type, callback]);
}
