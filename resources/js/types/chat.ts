export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    last_seen?: string;
}

export interface Message {
    id: number;
    conversation_id: number;
    user_id: number;
    body: string;
    type: 'text' | 'image' | 'file';
    read_at: string | null;
    created_at: string;
    user?: User;
}

export interface Conversation {
    id: number;
    name: string | null;
    is_group: boolean;
    participants?: User[];
    last_message?: Message;
    unread_count?: number;
}