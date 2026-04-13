import { useEffect, useState, useCallback } from 'react';

/**
 * useNotificationPermission Hook
 * 
 * Manages browser notification API permissions and displays notifications
 * Handles user permission requests and notification display
 */
export function useNotificationPermission() {
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        // Check if Notification API is supported
        const supported = 'Notification' in window;
        setIsSupported(supported);

        if (supported) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!isSupported) {
            console.warn('Notification API is not supported in this browser');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission === 'denied') {
            return false;
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }, [isSupported]);

    const showNotification = useCallback(
        (title: string, options?: NotificationOptions): Notification | null => {
            if (!isSupported) return null;

            if (permission !== 'granted') {
                return null;
            }

            try {
                const notification = new Notification(title, {
                    icon: '/logo.png',
                    badge: '/badge.png',
                    ...options,
                });

                return notification;
            } catch (error) {
                console.error('Error showing notification:', error);
                return null;
            }
        },
        [isSupported, permission]
    );

    const showMessageNotification = useCallback(
        (senderName: string, messageBody: string): Notification | null => {
            if (!isSupported || permission !== 'granted') {
                return null;
            }

            const title = `New message from ${senderName}`;
            const truncatedBody = messageBody.length > 100 ? messageBody.substring(0, 100) + '...' : messageBody;

            return showNotification(title, {
                body: truncatedBody,
                tag: `message-${senderName}`,
                requireInteraction: false,
            });
        },
        [isSupported, permission, showNotification]
    );

    return {
        isSupported,
        permission,
        requestPermission,
        showNotification,
        showMessageNotification,
        isNotificationEnabled: permission === 'granted',
    };
}
