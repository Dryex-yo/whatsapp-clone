import { useState, useCallback, useRef, useEffect } from 'react';

interface SearchConversation {
    id: number;
    name: string;
    display_name: string;
    type: 'group' | 'direct';
    avatar?: string;
    last_message?: any;
}

interface SearchMessage {
    id: number;
    body: string;
    conversation_id: number;
    user_id: number;
    user_name: string;
    created_at: string;
}

interface SearchResults {
    conversations: SearchConversation[];
    messages: SearchMessage[];
}

/**
 * useGlobalSearch Hook
 * Handles global search with debouncing across conversations and messages
 */
export const useGlobalSearch = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<SearchResults>({
        conversations: [],
        messages: [],
    });
    const [isLoading, setIsLoading] = useState(false);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Debounced search function
    const performSearch = useCallback(async (query: string) => {
        if (query.length < 2) {
            setResults({ conversations: [], messages: [] });
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Search failed');
            
            const data = await response.json();
            setResults(data);
        } catch (error) {
            console.error('Search error:', error);
            setResults({ conversations: [], messages: [] });
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounced search handler
    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);

        // Clear previous timeout
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new timeout for debounced search
        debounceTimerRef.current = setTimeout(() => {
            performSearch(query);
        }, 300); // 300ms debounce
    }, [performSearch]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    // Clear results when query is empty
    useEffect(() => {
        if (searchQuery.length === 0) {
            setResults({ conversations: [], messages: [] });
        }
    }, [searchQuery]);

    return {
        searchQuery,
        handleSearch,
        results,
        isLoading,
    };
};

/**
 * useChatSearch Hook
 * Searches messages within a specific conversation
 */
export const useChatSearch = (conversationId?: number) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<{ messages: any[]; total: number }>({
        messages: [],
        total: 0,
    });
    const [isLoading, setIsLoading] = useState(false);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    const performSearch = useCallback(async (query: string) => {
        if (!conversationId || query.length < 1) {
            setResults({ messages: [], total: 0 });
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(
                `/api/conversations/${conversationId}/search?q=${encodeURIComponent(query)}`
            );
            if (!response.ok) throw new Error('Search failed');
            
            const data = await response.json();
            setResults(data);
        } catch (error) {
            console.error('Chat search error:', error);
            setResults({ messages: [], total: 0 });
        } finally {
            setIsLoading(false);
        }
    }, [conversationId]);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            performSearch(query);
        }, 300);
    }, [performSearch]);

    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (searchQuery.length === 0) {
            setResults({ messages: [], total: 0 });
        }
    }, [searchQuery]);

    return {
        searchQuery,
        handleSearch,
        results,
        isLoading,
    };
};
