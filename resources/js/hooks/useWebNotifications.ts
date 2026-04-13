import { useEffect, useState, useCallback, useRef } from 'react';
import { useNotificationPermission } from './useNotificationPermission';
import { useSoundNotification } from './useSoundNotification';
import { useFaviconBadge } from './useFaviconBadge';
import type { Message, User, Conversation } from '@/types/chat';

interface WebNotificationOptions {
    enableBrowserNotifications?: boolean;
    enableSound?: boolean;
    enableFaviconBadge?: boolean;
    soundUrl?: string;
}

/**
 * useWebNotifications Hook
 * 
 * Comprehensive hook combining browser notifications, sound, and favicon badge
 * Handles incoming messages and updates all notification indicators
 * Manages user preferences and notification permissions
 */
export function useWebNotifications(
    currentUser: User | undefined,
    activeConversation: Conversation | undefined,
    options: WebNotificationOptions = {
        enableBrowserNotifications: true,
        enableSound: true,
        enableFaviconBadge: true,
        soundUrl: '/notification-ping.mp3',
    }
) {
    const [unreadCount, setUnreadCount] = useState(0);
    const [isPermissionRequested, setIsPermissionRequested] = useState(false);
    const notificationPerm = useNotificationPermission();
    const soundNotification = useSoundNotification(options.soundUrl || '/notification-ping.mp3');
    const faviconBadge = useFaviconBadge();
    const titleChangeRef = useRef<NodeJS.Timeout>();

    // Request notification permission on mount
    useEffect(() => {
        if (!isPermissionRequested && options.enableBrowserNotifications) {
            notificationPerm.requestPermission().then(() => {
                setIsPermissionRequested(true);
            });
        }
    }, [isPermissionRequested, options.enableBrowserNotifications, notificationPerm]);

    // Update favicon badge whenever unread count changes
    useEffect(() => {
        if (options.enableFaviconBadge) {
            if (unreadCount > 0) {
                faviconBadge.updateBadge(unreadCount);
                
                // Update document title to include unread count
                const originalTitle = document.title;
                document.title = `(${unreadCount}) ${originalTitle.replace(/^\(\d+\)\s/, '')}`;

                return () => {
                    if (titleChangeRef.current) {
                        clearTimeout(titleChangeRef.current);
                    }
                };
            } else {
                faviconBadge.clearBadge();
                
                // Restore original title
                document.title = document.title.replace(/^\(\d+\)\s/, '');
            }
        }
    }, [unreadCount, options.enableFaviconBadge, faviconBadge]);

    const notifyNewMessage = useCallback(
        (message: Message, sender: User) => {
            const shouldNotify = !activeConversation || activeConversation.id !== message.conversation_id;

            if (!shouldNotify) {
                return;
            }

            // Update unread count
            setUnreadCount(prev => prev + 1);

            // Show browser notification
            if (options.enableBrowserNotifications && notificationPerm.isNotificationEnabled) {
                const messageBody = message.body || (message.attachments?.length ? '📎 Attachment' : 'New message');
                notificationPerm.showMessageNotification(sender.name, messageBody);
            }

            // Play sound notification
            if (options.enableSound) {
                soundNotification.playSound();
            }
        },
        [
            activeConversation,
            options.enableBrowserNotifications,
            options.enableSound,
            notificationPerm,
            soundNotification,
        ]
    );

    const clearUnreadCount = useCallback(() => {
        setUnreadCount(0);
        faviconBadge.clearBadge();
        document.title = document.title.replace(/^\(\d+\)\s/, '');
    }, [faviconBadge]);

    const setUnreadCountToValue = useCallback((count: number) => {
        setUnreadCount(Math.max(0, count));
        if (count > 0 && options.enableFaviconBadge) {
            faviconBadge.updateBadge(count);
        } else {
            faviconBadge.clearBadge();
        }
    }, [options.enableFaviconBadge, faviconBadge]);

    const toggleSoundNotification = useCallback(() => {
        soundNotification.toggleSound();
    }, [soundNotification]);

    return {
        // State
        unreadCount,
        canNotify: notificationPerm.isNotificationEnabled,
        isSoundEnabled: soundNotification.isEnabled,
        
        // Methods
        notifyNewMessage,
        clearUnreadCount,
        setUnreadCountToValue,
        toggleSoundNotification,
        requestNotificationPermission: notificationPerm.requestPermission,
        
        // Utils
        faviconBadge,
    };
}
