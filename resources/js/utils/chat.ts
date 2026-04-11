// resources/js/utils/chat.ts

import type { Message, User, Conversation } from '@/types/chat';

/**
 * Format file size to human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted size string (e.g., "2.5 MB", "500 KB")
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format timestamp to display time
 * @param dateString - ISO 8601 date string
 * @returns Formatted time (e.g., "14:30", "Yesterday", "Monday")
 */
export const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Same day: return time
    if (targetDate.getTime() === today.getTime()) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    }

    // Yesterday
    if (targetDate.getTime() === yesterday.getTime()) {
        return 'Yesterday';
    }

    // This week (within 7 days)
    const daysAgo = Math.floor((today.getTime() - targetDate.getTime()) / (24 * 60 * 60 * 1000));
    if (daysAgo < 7) {
        return date.toLocaleString('en-US', { weekday: 'long' });
    }

    // Older: return date
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
};

/**
 * Format full date with day separator
 * @param dateString - ISO 8601 date string
 * @returns Formatted date (e.g., "Today", "Monday, April 12", "April 12, 2026")
 */
export const formatDateSeparator = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (targetDate.getTime() === today.getTime()) {
        return 'Today';
    }

    if (targetDate.getTime() === yesterday.getTime()) {
        return 'Yesterday';
    }

    const daysAgo = Math.floor((today.getTime() - targetDate.getTime()) / (24 * 60 * 60 * 1000));
    if (daysAgo < 7) {
        return date.toLocaleString('en-US', { weekday: 'long' });
    }

    const sameYear = date.getFullYear() === now.getFullYear();
    return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        ...(sameYear ? {} : { year: 'numeric' }),
    });
};

/**
 * Check if a file is an image
 * @param file - File object
 * @returns Boolean
 */
export const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/');
};

/**
 * Check if a file is a valid attachment
 * @param file - File object
 * @param maxSize - Max file size in bytes (default: 50MB)
 * @returns Object with isValid boolean and optional error message
 */
export const validateFile = (
    file: File,
    maxSize: number = 50 * 1024 * 1024, // 50MB
): { isValid: boolean; error?: string } => {
    // Check file size
    if (file.size > maxSize) {
        return {
            isValid: false,
            error: `File size exceeds ${formatFileSize(maxSize)}`,
        };
    }

    // Check file type
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'application/zip',
    ];

    if (!allowedTypes.includes(file.type)) {
        return {
            isValid: false,
            error: 'File type not allowed',
        };
    }

    return { isValid: true };
};

/**
 * Group consecutive messages from the same sender
 * @param messages - Array of messages
 * @param consecutiveThreshold - Time threshold in minutes (default: 1)
 * @returns Array of message groups
 */
export const groupConsecutiveMessages = (
    messages: Message[],
    consecutiveThreshold: number = 1,
): Array<{ messages: Message[]; isConsecutive: boolean }> => {
    if (messages.length === 0) return [];

    const groups: Array<{ messages: Message[]; isConsecutive: boolean }> = [];
    let currentGroup: Message[] = [messages[0]];

    for (let i = 1; i < messages.length; i++) {
        const currentMsg = messages[i];
        const previousMsg = messages[i - 1];

        // Check if same sender and within threshold
        const isSameSender = currentMsg.user_id === previousMsg.user_id;
        const timeDiff =
            (new Date(previousMsg.created_at || '').getTime() -
                new Date(currentMsg.created_at || '').getTime()) /
            (1000 * 60);
        const isWithinThreshold = timeDiff < consecutiveThreshold;

        if (isSameSender && isWithinThreshold) {
            currentGroup.push(currentMsg);
        } else {
            groups.push({
                messages: currentGroup,
                isConsecutive: currentGroup.length > 1,
            });
            currentGroup = [currentMsg];
        }
    }

    // Add last group
    if (currentGroup.length > 0) {
        groups.push({
            messages: currentGroup,
            isConsecutive: currentGroup.length > 1,
        });
    }

    return groups;
};

/**
 * Get date groups for messages (for separators)
 * @param messages - Array of messages
 * @returns Array of dates (ISO format)
 */
export const getMessageDateGroups = (messages: Message[]): string[] => {
    const dates = new Set<string>();

    messages.forEach((msg) => {
        if (msg.created_at) {
            const date = new Date(msg.created_at);
            dates.add(date.toISOString().split('T')[0]); // YYYY-MM-DD
        }
    });

    return Array.from(dates).reverse(); // Newest first
};

/**
 * Get the display name for a conversation
 * @param conversation - Conversation object
 * @param currentUser - Current user
 * @returns Display name
 */
export const getConversationDisplayName = (conversation: Conversation, currentUser: User): string => {
    if (conversation.is_group && conversation.name) {
        return conversation.name;
    }

    // For 1-on-1, get other user's name
    if (!conversation.is_group && conversation.users && conversation.users.length > 0) {
        const otherUser = conversation.users.find((u) => u.id !== currentUser.id);
        return otherUser?.name || 'Unknown User';
    }

    return 'Conversation';
};

/**
 * Get the display avatar for a conversation
 * @param conversation - Conversation object
 * @param currentUser - Current user
 * @returns Avatar URL or null
 */
export const getConversationDisplayAvatar = (conversation: Conversation, currentUser: User): string | null => {
    if (conversation.is_group && conversation.avatar) {
        return conversation.avatar;
    }

    // For 1-on-1, get other user's avatar
    if (!conversation.is_group && conversation.users && conversation.users.length > 0) {
        const otherUser = conversation.users.find((u) => u.id !== currentUser.id);
        return otherUser?.avatar || null;
    }

    return null;
};

/**
 * Get other user in 1-on-1 conversation
 * @param conversation - Conversation object
 * @param currentUser - Current user
 * @returns Other user or null
 */
export const getOtherUser = (conversation: Conversation, currentUser: User): User | null => {
    if (conversation.is_group || !conversation.users) {
        return null;
    }

    return conversation.users.find((u) => u.id !== currentUser.id) || null;
};

/**
 * Get user status text
 * @param user - User object
 * @returns Status text (e.g., "Online", "Last seen 5 minutes ago")
 */
export const getUserStatusText = (user: User): string => {
    if (!user.last_seen) return 'Offline';

    const lastSeen = new Date(user.last_seen);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    // Within 5 minutes = online
    if (diffMinutes < 5) {
        return 'Online';
    }

    if (diffMinutes < 60) {
        return `Last seen ${diffMinutes}m ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
        return `Last seen ${diffHours}h ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
        return `Last seen ${diffDays}d ago`;
    }

    return `Last seen ${lastSeen.toLocaleDateString()}`;
};

/**
 * Check if user is online
 * @param user - User object
 * @returns Boolean
 */
export const isUserOnline = (user: User): boolean => {
    if (!user.last_seen) return false;

    const lastSeen = new Date(user.last_seen);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);

    return diffMinutes < 5;
};

/**
 * Get user initials for avatar placeholder
 * @param user - User object
 * @returns Initials (e.g., "AB" for "Alice Bob")
 */
export const getUserInitials = (user: User): string => {
    return user.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

/**
 * Format message preview for sidebar
 * @param message - Message object
 * @param currentUserId - Current user ID
 * @returns Preview text
 */
export const getMessagePreview = (message: Message, currentUserId: number): string => {
    const prefix = message.user_id === currentUserId ? 'You: ' : '';

    switch (message.type) {
        case 'image':
            return prefix + '📷 Image';
        case 'file':
            return prefix + '📎 File';
        default:
            return prefix + message.body;
    }
};

/**
 * Escape HTML special characters
 * @param text - Text to escape
 * @returns Escaped text
 */
export const escapeHtml = (text: string): string => {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
};

/**
 * Debounce function
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number,
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            func(...args);
        }, wait);
    };
};

/**
 * Throttle function
 * @param func - Function to throttle
 * @param limit - Throttle limit in milliseconds
 * @returns Throttled function
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number,
): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean = false;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
};

/**
 * Get attachment file name from path
 * @param filePath - File path
 * @returns File name
 */
export const getFileNameFromPath = (filePath: string): string => {
    return filePath.split('/').pop() || 'attachment';
};

/**
 * Get file extension
 * @param fileName - File name
 * @returns File extension
 */
export const getFileExtension = (fileName: string): string => {
    return fileName.split('.').pop()?.toUpperCase() || 'FILE';
};
