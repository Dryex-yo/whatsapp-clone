/**
 * Text highlighting utilities for search within chat
 */

/**
 * Highlights text by wrapping matches with a special marker
 * @param text - Text to highlight
 * @param searchTerm - Term to search for (regex-safe)
 * @returns Text with matches wrapped in special markers for React rendering
 */
export function highlightText(text: string, searchTerm: string): string[] {
    if (!searchTerm || !text) {
        return [text];
    }

    try {
        // Escape special regex characters in the search term
        const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Create a case-insensitive regex
        const regex = new RegExp(`(${escapedTerm})`, 'gi');
        
        // Split the text by the regex pattern
        const parts = text.split(regex);
        
        return parts;
    } catch (error) {
        console.error('Error highlighting text:', error);
        return [text];
    }
}

/**
 * React component that renders highlighted text
 */
import React from 'react';

export interface HighlightedTextProps {
    text: string;
    searchTerm: string;
    className?: string;
    highlightClassName?: string;
}

/**
 * HighlightedText Component
 * Renders text with search terms highlighted
 */
export const HighlightedText: React.FC<HighlightedTextProps> = ({
    text,
    searchTerm,
    className = '',
    highlightClassName = 'bg-yellow-400 bg-opacity-60 font-semibold rounded',
}) => {
    const parts = highlightText(text, searchTerm);

    if (parts.length === 1) {
        return <span className={className}>{text}</span>;
    }

    return (
        <span className={className}>
            {parts.map((part, index) => {
                // Check if this part is a match (case-insensitive comparison)
                const isMatch = part.toLowerCase() === searchTerm.toLowerCase() && searchTerm.length > 0;
                
                if (isMatch) {
                    return (
                        <span key={index} className={highlightClassName}>
                            {part}
                        </span>
                    );
                }
                
                return <span key={index}>{part}</span>;
            })}
        </span>
    );
};

/**
 * Get all matches of a search term in text (case-insensitive)
 * @param text - Text to search
 * @param searchTerm - Term to search for
 * @returns Number of matches
 */
export function getMatchCount(text: string, searchTerm: string): number {
    if (!searchTerm || !text) {
        return 0;
    }

    try {
        const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedTerm, 'gi');
        const matches = text.match(regex);
        return matches ? matches.length : 0;
    } catch (error) {
        console.error('Error counting matches:', error);
        return 0;
    }
}

/**
 * Find the index of the first match in text
 * @param text - Text to search
 * @param searchTerm - Term to search for
 * @returns Index of first match or -1 if not found
 */
export function findFirstMatchIndex(text: string, searchTerm: string): number {
    if (!searchTerm || !text) {
        return -1;
    }

    try {
        const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedTerm, 'i');
        const match = text.match(regex);
        
        if (!match) return -1;
        
        return text.indexOf(match[0]);
    } catch (error) {
        console.error('Error finding match:', error);
        return -1;
    }
}
