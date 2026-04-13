import { useRef, useCallback, useState, useEffect } from 'react';

interface UseInfiniteScrollOptions {
    onLoadMore: () => Promise<void>;
    hasMore: boolean;
    isLoading?: boolean;
}

/**
 * useInfiniteScroll Hook
 * Implements infinite scroll using the Intersection Observer API
 * Triggers onLoadMore when the sentinel element becomes visible
 */
export const useInfiniteScroll = ({
    onLoadMore,
    hasMore,
    isLoading = false,
}: UseInfiniteScrollOptions) => {
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [isObserving, setIsObserving] = useState(false);
    const isLoadingRef = useRef(false);

    useEffect(() => {
        isLoadingRef.current = isLoading;
    }, [isLoading]);

    useEffect(() => {
        if (!sentinelRef.current || !hasMore || isObserving) {
            return;
        }

        const observer = new IntersectionObserver(
            async (entries) => {
                // Check if sentinel is visible and we're not already loading
                if (entries[0].isIntersecting && !isLoadingRef.current && hasMore) {
                    isLoadingRef.current = true;
                    try {
                        await onLoadMore();
                    } catch (error) {
                        console.error('Error loading more messages:', error);
                    } finally {
                        isLoadingRef.current = false;
                    }
                }
            },
            {
                root: sentinelRef.current.parentElement,
                rootMargin: '100px', // Start loading 100px before reaching sentinel
                threshold: 0.01,
            }
        );

        observer.observe(sentinelRef.current);
        setIsObserving(true);

        return () => {
            observer.disconnect();
            setIsObserving(false);
        };
    }, [hasMore, onLoadMore, isObserving]);

    return sentinelRef;
};

/**
 * useScrollPosition Hook
 * Saves and restores scroll position when loading new messages
 */
export const useScrollPosition = (containerRef: React.RefObject<HTMLDivElement>) => {
    const scrollPositionRef = useRef(0);

    const saveScrollPosition = useCallback(() => {
        if (containerRef.current) {
            scrollPositionRef.current = containerRef.current.scrollHeight - containerRef.current.scrollTop;
        }
    }, [containerRef]);

    const restoreScrollPosition = useCallback(() => {
        if (containerRef.current) {
            const newScrollTop = containerRef.current.scrollHeight - scrollPositionRef.current;
            containerRef.current.scrollTop = newScrollTop;
        }
    }, [containerRef]);

    return {
        saveScrollPosition,
        restoreScrollPosition,
        scrollPositionRef,
    };
};
