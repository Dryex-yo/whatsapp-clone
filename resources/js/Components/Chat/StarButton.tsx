import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

export interface StarButtonProps {
    messageId: number;
    isStarred?: boolean;
    onStarToggle?: (isStarred: boolean) => void;
    className?: string;
    size?: number;
}

/**
 * StarButton Component
 * Allows users to star/unstar messages
 * Shows visual feedback during the toggle action
 */
export const StarButton: React.FC<StarButtonProps> = ({
    messageId,
    isStarred = false,
    onStarToggle,
    className = '',
    size = 18,
}) => {
    const [loading, setLoading] = useState(false);
    const [starred, setStarred] = useState(isStarred);

    const handleToggleStar = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        if (loading) return;

        setLoading(true);

        try {
            const response = await axios.post<{ is_starred: boolean }>(
                `/api/messages/${messageId}/star`
            );

            const newStarred = response.data.is_starred;
            setStarred(newStarred);
            onStarToggle?.(newStarred);
        } catch (error) {
            console.error('Failed to toggle star:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.button
            onClick={handleToggleStar}
            disabled={loading}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`relative p-1 text-gray-400 hover:text-yellow-400 transition-colors disabled:opacity-50 ${className}`}
            title={starred ? 'Remove from starred' : 'Add to starred'}
        >
            <motion.div
                animate={starred ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Star
                    size={size}
                    className={starred ? 'fill-yellow-400 text-yellow-400' : ''}
                />
            </motion.div>

            {/* Loading indicator */}
            {loading && (
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-transparent border-t-yellow-400"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
            )}
        </motion.button>
    );
};
