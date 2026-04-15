import React, { useEffect, useState } from 'react';
import { WifiOff, Zap } from 'lucide-react';
import { useNetwork } from '@/contexts/NetworkContext';

export default function NetworkBanner() {
    const { isOnline, isSlowConnection } = useNetwork();
    const [showOfflineBanner, setShowOfflineBanner] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false);

    useEffect(() => {
        if (!isOnline) {
            setShowOfflineBanner(true);
            setIsReconnecting(true);
        } else if (showOfflineBanner) {
            // Show reconnected state briefly before hiding
            setIsReconnecting(false);
            const timer = setTimeout(() => {
                setShowOfflineBanner(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isOnline, showOfflineBanner]);

    // Only show banner when offline
    if (!showOfflineBanner && isOnline) {
        return null;
    }

    return (
        <div
            className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-3 px-4 transition-all duration-300 ${
                isOnline && !isReconnecting
                    ? 'bg-green-500 dark:bg-green-600'
                    : 'bg-orange-500 dark:bg-orange-600'
            }`}
        >
            <div className="flex items-center gap-2 max-w-md">
                {isOnline && !isReconnecting ? (
                    <>
                        <svg
                            className="w-5 h-5 text-white flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <span className="text-white font-medium text-sm">
                            You're back online
                        </span>
                    </>
                ) : (
                    <>
                        <WifiOff className="w-5 h-5 text-white flex-shrink-0 animate-pulse" />
                        <div className="flex-1">
                            <p className="text-white font-medium text-sm">
                                {isReconnecting
                                    ? 'Waiting for Network...'
                                    : 'No internet connection'}
                            </p>
                            <p className="text-orange-100 text-xs">
                                {isReconnecting
                                    ? 'Attempting to reconnect'
                                    : 'Messages will be sent when connected'}
                            </p>
                        </div>
                        {isReconnecting && (
                            <svg
                                className="w-5 h-5 text-white flex-shrink-0 animate-spin"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                        )}
                    </>
                )}
            </div>

            {/* Slow connection indicator */}
            {isOnline && isSlowConnection && (
                <div className="absolute right-4 flex items-center gap-1 text-orange-100">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs">Slow connection</span>
                </div>
            )}
        </div>
    );
}
