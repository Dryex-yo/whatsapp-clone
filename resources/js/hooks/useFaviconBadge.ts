import { useEffect, useRef, useCallback } from 'react';

/**
 * useFaviconBadge Hook
 * 
 * Updates the favicon with a badge showing unread message count
 * Creates a canvas-based badge on the original favicon
 * Updates the browser tab icon dynamically
 */
export function useFaviconBadge() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const originalFaviconUrl = useRef<string>('');

    useEffect(() => {
        // Store original favicon
        const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
        if (link) {
            originalFaviconUrl.current = link.href;
        } else {
            // Use default favicon if not found
            originalFaviconUrl.current = '/favicon.ico';
        }

        // Create canvas if it doesn't exist
        if (!canvasRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            canvasRef.current = canvas;
        }
    }, []);

    const updateBadge = useCallback((count: number) => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Load and draw original favicon
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            if (count > 0) {
                // Draw red badge circle in top-right corner
                const badgeSize = 24;
                const badgeX = canvas.width - badgeSize / 2;
                const badgeY = badgeSize / 2;

                // Draw red circle background
                ctx.fillStyle = '#dc2626'; // Red color
                ctx.beginPath();
                ctx.arc(badgeX, badgeY, badgeSize / 2, 0, Math.PI * 2);
                ctx.fill();

                // Draw white border
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(badgeX, badgeY, badgeSize / 2, 0, Math.PI * 2);
                ctx.stroke();

                // Draw text (number or dot)
                const text = count > 9 ? '9+' : count.toString();
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(text, badgeX, badgeY);
            }

            // Update favicon
            const faviconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
            if (faviconLink) {
                faviconLink.href = canvas.toDataURL('image/png');
            }
        };

        // Start loading the original favicon
        img.src = originalFaviconUrl.current;
    }, []);

    const clearBadge = useCallback(() => {
        const faviconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
        if (faviconLink && originalFaviconUrl.current) {
            faviconLink.href = originalFaviconUrl.current;
        }
    }, []);

    const reset = useCallback(() => {
        clearBadge();
    }, [clearBadge]);

    return {
        updateBadge,
        clearBadge,
        reset,
    };
}
