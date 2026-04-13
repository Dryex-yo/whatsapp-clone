import React from 'react';
import { Check } from 'lucide-react';
import type { Message } from '@/types/chat';

export interface MessageStatusProps {
    status: string;
    className?: string;
}

/**
 * MessageStatus Component
 * Displays message delivery status using tick icons based on message status
 * 
 * States:
 * - sent: One gray tick (message sent to server)
 * - delivered: Two gray ticks (message received by recipient's device)
 * - read: Two blue ticks (message read by recipient)
 */
export const MessageStatus: React.FC<MessageStatusProps> = ({ 
    status = 'sent',
    className = 'w-4 h-4',
}) => {
    // Gray tick color
    const grayColor = '#8a8a8a';
    // Blue tick color (WhatsApp green-blue equivalent)
    const blueColor = '#31a24c';

    switch (status) {
        case 'delivered':
            return (
                <div className="flex items-center gap-px">
                    <Check 
                        className={className} 
                        color={grayColor}
                        strokeWidth={3}
                    />
                    <Check 
                        className={className}
                        style={{ marginLeft: '-0.4rem' }}
                        color={grayColor}
                        strokeWidth={3}
                    />
                </div>
            );
        case 'read':
            return (
                <div className="flex items-center gap-px">
                    <Check 
                        className={className}
                        color={blueColor}
                        strokeWidth={3}
                    />
                    <Check 
                        className={className}
                        style={{ marginLeft: '-0.4rem' }}
                        color={blueColor}
                        strokeWidth={3}
                    />
                </div>
            );
        case 'sent':
        default:
            return (
                <Check 
                    className={className}
                    color={grayColor}
                    strokeWidth={3}
                />
            );
    }
};

/**
 * Message component wrapper that includes status indicator
 * Shows the status indicator for sent messages only (current user's messages)
 */
export interface MessageStatusIndicatorProps {
    message: Message;
    currentUserId: number;
}

export const MessageStatusIndicator: React.FC<MessageStatusIndicatorProps> = ({
    message,
    currentUserId,
}) => {
    const isSent = message.user_id === currentUserId;

    if (!isSent) {
        return null;
    }

    return (
        <MessageStatus 
            status={message.status || 'sent'}
            className="w-4 h-4"
        />
    );
};
