/**
 * User Type - Represents a user in the system
 */
export interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    bio?: string;
    last_seen?: string; // ISO 8601 timestamp
    last_seen_privacy?: 'everyone' | 'contacts' | 'nobody';
    created_at?: string;
    updated_at?: string;
}

/**
 * Conversation Type - Represents a chat conversation
 * Can be 1-on-1 or group
 */
export interface Conversation {
    id: number;
    name?: string; // Group name or null for 1-on-1
    is_group: boolean;
    avatar?: string; // Group avatar
    created_by?: number; // User ID of creator
    admin_id?: number; // User ID of group admin
    description?: string; // Group description
    created_at?: string;
    updated_at?: string;
    // Pivot data when fetched via users relationship
    pivot?: {
        user_id: number;
        conversation_id: number;
        role: 'admin' | 'moderator' | 'member';
        is_muted: boolean;
        is_pinned: boolean;
        joined_at: string;
        last_read_message_id?: number;
    };
    // Related data
    users?: User[] | Record<string, any>;  // Can be array or object from Resource
    last_message?: Message;
    other_user?: User; // For 1-on-1 chats (the other participant)
    unread_count?: number;
}

/**
 * Message Attachment Type - Represents a file attached to a message
 */
export interface MessageAttachment {
    id: number;
    message_id: number;
    file_name: string;
    type: 'image' | 'video' | 'audio' | 'document';
    mime_type: string;
    size: number;
    human_size: string; // Human-readable size (e.g., "2.5 MB")
    url: string; // Full URL to the file
    thumbnail_url?: string | null; // Thumbnail URL for images/videos
    width?: number; // Image width in pixels
    height?: number; // Image height in pixels
    duration?: number; // Duration in seconds for audio/video
    status: 'pending' | 'processing' | 'completed' | 'failed';
    created_at?: string;
    updated_at?: string;
}

/**
 * Message Type - Represents a single message
 */
export interface Message {
    id: number;
    conversation_id: number;
    user_id: number;
    body: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'file'; // Message type (legacy)
    status: 'sent' | 'delivered' | 'read'; // Message delivery status
    file_path?: string; // File path if type is 'image', 'audio', 'video' or 'file' (legacy)
    file_size?: number; // File size in bytes (legacy)
    mime_type?: string; // MIME type (e.g., 'image/jpeg', 'audio/webm', 'application/pdf') (legacy)
    read_at?: string | null; // ISO 8601 timestamp when read
    edited_at?: string | null; // ISO 8601 timestamp when edited
    deleted_at?: string | null; // ISO 8601 timestamp when soft deleted
    created_at?: string;
    updated_at?: string;
    // Related data
    sender?: User;
    user?: User; // Alias for sender
    conversation?: Conversation;
    attachments?: MessageAttachment[]; // New: Media attachments
    // Computed properties
    is_read?: boolean;
    is_edited?: boolean;
    is_starred?: boolean; // Whether this message is starred by the current user
    formatted_file_size?: string; // Human readable (e.g., "2.5 MB")
    formatted_time?: string; // e.g., "14:30", "Yesterday", "Monday"
}

/**
 * Message Input Payload - What we send when creating a message
 */
export interface SendMessagePayload {
    body: string;
    file?: File; // Optional file attachment
    conversation_id: number;
}

/**
 * Conversation List Item - For sidebar display
 */
export interface ConversationListItem extends Conversation {
    other_user?: User; // For 1-on-1 chats (the other participant)
    unread_count: number;
}

/**
 * API Response Types
 */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        current_page: number;
        from: number;
        last_page: number;
        per_page: number;
        to: number;
        total: number;
    };
    links: {
        first: string;
        last: string;
        next?: string;
        prev?: string;
    };
}

/**
 * WebSocket Event Types
 */
export interface WebSocketMessage {
    type: 'new_message' | 'message_edited' | 'message_deleted' | 'typing' | 'user_online' | 'user_offline';
    data: Record<string, unknown>;
}

export interface TypingEvent {
    conversation_id: number;
    user_id: number;
    user_name: string;
}

export interface OnlineStatusEvent {
    user_id: number;
    status: 'online' | 'offline';
    last_seen?: string;
}

/**
 * Component Props Types
 */

export interface ChatHeaderProps {
    conversation: Conversation | null;
    currentUser: User;
    onCall?: () => void;
    onVideoCall?: () => void;
    onMenu?: () => void;
}

export interface MessageBubbleProps {
    message: Message;
    currentUser: User;
    isConsecutive?: boolean;
}

export interface MessageGroupProps {
    messages: Message[];
    currentUser: User;
}

export interface DateSeparatorProps {
    date: Date;
}

export interface TypingIndicatorProps {}

export interface MessageInputProps {
    conversationId: number;
    onSendMessage: (message: string, file?: File) => void;
    onTypingStart?: () => void;
    onTypingStop?: () => void;
    disabled?: boolean;
    isLoading?: boolean;
}

export interface ChatWindowProps {
    conversation?: Conversation | null;
    currentUser: User;
    messages?: Message[];
    isLoading?: boolean;
    onSendMessage?: (message: string, file?: File) => Promise<void>;
    onTypingStart?: () => void;
    onTypingStop?: () => void;
    isTyping?: boolean;
    typingUsers?: Record<number, string>;
    onlineUsers?: Record<number, User>;
}

export interface ConversationSidebarProps {
    conversations: ConversationListItem[];
    activeConversationId?: number;
    currentUser: User;
    onSelectConversation: (id: number) => void;
    onSearchChange: (query: string) => void;
    onCreateNew?: () => void;
}

export interface ConversationItemProps {
    conversation: ConversationListItem;
    isActive: boolean;
    currentUser: User;
    onClick: () => void;
}

/**
 * Page Props (from Inertia.js)
 */
export interface ChatPageProps {
    currentUser: User;
    conversations: ConversationListItem[];
    initialConversation?: Conversation;
    initialMessages?: Message[];
}

/**
 * State Management Types
 */
export interface ChatState {
    conversations: ConversationListItem[];
    activeConversationId: number | null;
    activeConversation: Conversation | null;
    messages: Message[];
    isLoadingConversations: boolean;
    isLoadingMessages: boolean;
    isSendingMessage: boolean;
    isTyping: boolean;
    typingUsers: string[];
    searchQuery: string;
    filteredConversations: ConversationListItem[];
    error: string | null;
}

/**
 * Filter & Search Types
 */
export interface ConversationFilter {
    query: string;
    status?: 'active' | 'archived' | 'all';
    sortBy?: 'recent' | 'unread' | 'alphabetical';
}

export interface MessageFilter {
    conversationId: number;
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
    type?: 'text' | 'image' | 'file' | 'all';
    limit?: number;
    offset?: number;
}

/**
 * Utility Types
 */
export type MessageType = 'text' | 'image' | 'file';
export type UserRole = 'admin' | 'moderator' | 'member';
export type ConversationStatus = 'active' | 'archived' | 'muted';

/**
 * Error Types
 */
export interface ApiError {
    status: number;
    message: string;
    errors?: Record<string, string[]>;
}

export class ChatError extends Error {
    constructor(
        public code: string,
        message: string,
        public originalError?: unknown,
    ) {
        super(message);
        this.name = 'ChatError';
    }
}

/**
 * Enum for common constants
 */
export enum MessageStatus {
    SENDING = 'sending',
    SENT = 'sent',
    DELIVERED = 'delivered',
    READ = 'read',
    FAILED = 'failed',
}

export enum UserStatus {
    ONLINE = 'online',
    OFFLINE = 'offline',
    AWAY = 'away',
    DO_NOT_DISTURB = 'do_not_disturb',
}

/**
 * Type Guards
 */
export const isUser = (obj: unknown): obj is User => {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'id' in obj &&
        'name' in obj &&
        'email' in obj
    );
};

export const isConversation = (obj: unknown): obj is Conversation => {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'id' in obj &&
        'is_group' in obj
    );
};

export const isMessage = (obj: unknown): obj is Message => {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'id' in obj &&
        'conversation_id' in obj &&
        'body' in obj
    );
};