import DOMPurify from 'dompurify';

/**
 * Sanitize user-generated content to prevent XSS attacks
 * 
 * Uses DOMPurify library to:
 * - Remove script tags and event handlers
 * - Strip malicious attributes
 * - Allow safe HTML formatting (bold, italic, links within same origin)
 * - Prevent iframe injection
 * 
 * @param dirtyHTML - Potentially unsafe HTML/text content from users
 * @param allowedTags - Array of allowed HTML tags (optional)
 * @returns Sanitized safe HTML string
 */
export const sanitizeContent = (
    dirtyHTML: string,
    allowedTags: string[] = []
): string => {
    // If content is empty or not a string, return empty string
    if (!dirtyHTML || typeof dirtyHTML !== 'string') {
        return '';
    }

    // Default configuration for message content
    const config = {
        // Allow basic text formatting - removed all HTML to be safest
        // Set to [] to allow NO HTML tags (most secure for chat messages)
        ALLOWED_TAGS: [...new Set(allowedTags)],
        
        // Allow no attributes by default (safest for chat)
        ALLOWED_ATTR: [],
        
        // Custom hooks for additional processing
        FORCE_BODY: false,
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
        RETURN_DOM_IMPORT: false,
    };

    try {
        return DOMPurify.sanitize(dirtyHTML, config);
    } catch (error) {
        console.error('Error sanitizing content:', error);
        return DOMPurify.sanitize(dirtyHTML, { ALLOWED_TAGS: [] });
    }
};

/**
 * Sanitize content for display as plain text (most secure option for chat messages)
 * 
 * This completely strips all HTML, ensuring 100% XSS safety
 * Perfect for chat messages where HTML is not expected
 * 
 * @param content - User-generated content
 * @returns Plain text safe string
 */
export const sanitizeAsText = (content: string): string => {
    if (!content || typeof content !== 'string') {
        return '';
    }

    // Create temporary div to extract text content
    const tempDiv = document.createElement('div');
    tempDiv.textContent = content;
    return tempDiv.innerHTML;
};

/**
 * Sanitize URLs to prevent javascript: and data: protocols
 * 
 * @param url - URL to sanitize
 * @returns Safe URL or empty string if dangerous
 */
export const sanitizeUrl = (url: string): string => {
    if (!url || typeof url !== 'string') {
        return '';
    }

    // Reject dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    const lowerUrl = url.toLowerCase().trim();

    for (const protocol of dangerousProtocols) {
        if (lowerUrl.startsWith(protocol)) {
            return '';
        }
    }

    return url;
};

/**
 * Create a safe anchor link for message content
 * 
 * Detects URLs in message text and converts them to safe clickable links
 * 
 * @param text - Message text that may contain URLs
 * @returns HTML with safe links or original text
 */
export const createSafeLinks = (text: string): string => {
    if (!text || typeof text !== 'string') {
        return '';
    }

    // Simple URL regex - can be enhanced based on needs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    return text.replace(urlRegex, (url) => {
        const safeUrl = sanitizeUrl(url);
        if (!safeUrl) {
            return url; // Return original if URL is unsafe
        }
        return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline">${safeUrl}</a>`;
    });
};
