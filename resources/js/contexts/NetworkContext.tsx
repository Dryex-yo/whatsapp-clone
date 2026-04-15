import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';

interface NetworkContextType {
    isOnline: boolean;
    isSlowConnection: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: PropsWithChildren) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSlowConnection, setIsSlowConnection] = useState(false);

    useEffect(() => {
        // Handle online/offline events
        const handleOnline = () => {
            setIsOnline(true);
            setIsSlowConnection(false);
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check connection quality via resource loading
        const checkConnectionQuality = () => {
            if (!navigator.onLine) {
                setIsSlowConnection(false);
                return;
            }

            // Try to load a small resource to measure connection
            const img = new Image();
            const startTime = Date.now();

            img.onload = () => {
                const loadTime = Date.now() - startTime;
                // Consider > 2000ms as slow
                setIsSlowConnection(loadTime > 2000);
            };

            img.onerror = () => {
                setIsSlowConnection(true);
            };

            // Use a small 1px image
            img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICEAEAOw==';
        };

        // Check connection quality periodically
        const connectionCheckInterval = setInterval(checkConnectionQuality, 30000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(connectionCheckInterval);
        };
    }, []);

    return (
        <NetworkContext.Provider value={{ isOnline, isSlowConnection }}>
            {children}
        </NetworkContext.Provider>
    );
}

export function useNetwork() {
    const context = useContext(NetworkContext);
    if (context === undefined) {
        throw new Error('useNetwork must be used within a NetworkProvider');
    }
    return context;
}
