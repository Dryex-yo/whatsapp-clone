import { useState, useCallback } from 'react';
import axios from 'axios';
import type { Message, Conversation } from '@/types/chat';

interface StarredMessagesResponse {
    data: Message[];
    grouped_by_conversation: Array<{
        conversation: Conversation;
        messages: Message[];
    }>;
    pagination: {
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
    };
}

interface UseStarredMessages {
    starredMessages: Message[];
    groupedByConversation: Array<{
        conversation: Conversation;
        messages: Message[];
    }>;
    isLoading: boolean;
    error: string | null;
    totalCount: number;
    fetchStarredMessages: (perPage?: number) => Promise<void>;
    toggleStar: (messageId: number) => Promise<boolean>;
    toggleStarForConversation: (conversationId: number, messageId: number) => Promise<boolean>;
}

/**
 * Hook for managing starred messages
 * Provides functionality to fetch, star, and unstar messages
 */
export function useStarredMessages(): UseStarredMessages {
    const [starredMessages, setStarredMessages] = useState<Message[]>([]);
    const [groupedByConversation, setGroupedByConversation] = useState<
        Array<{ conversation: Conversation; messages: Message[] }>
    >([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);

    const fetchStarredMessages = useCallback(async (perPage: number = 50) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.get<StarredMessagesResponse>(
                '/api/messages/starred',
                {
                    params: { per_page: perPage },
                }
            );

            setStarredMessages(response.data.data);
            setGroupedByConversation(response.data.grouped_by_conversation);
            setTotalCount(response.data.pagination.total);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch starred messages';
            setError(message);
            console.error('Failed to fetch starred messages:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const toggleStar = useCallback(async (messageId: number): Promise<boolean> => {
        try {
            const response = await axios.post<{ is_starred: boolean }>(
                `/api/messages/${messageId}/star`
            );

            // Return the new starred status
            return response.data.is_starred;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to toggle star';
            console.error('Failed to toggle star:', err);
            throw new Error(message);
        }
    }, []);

    const toggleStarForConversation = useCallback(
        async (conversationId: number, messageId: number): Promise<boolean> => {
            const newStatus = await toggleStar(messageId);

            // If unstarred, remove from list if we're viewing starred messages
            if (!newStatus) {
                setStarredMessages((prev) => prev.filter((m) => m.id !== messageId));
                setGroupedByConversation((prev) =>
                    prev
                        .map((group) => ({
                            ...group,
                            messages: group.messages.filter((m) => m.id !== messageId),
                        }))
                        .filter((group) => group.messages.length > 0)
                );
            }

            return newStatus;
        },
        [toggleStar]
    );

    return {
        starredMessages,
        groupedByConversation,
        isLoading,
        error,
        totalCount,
        fetchStarredMessages,
        toggleStar,
        toggleStarForConversation,
    };
}
