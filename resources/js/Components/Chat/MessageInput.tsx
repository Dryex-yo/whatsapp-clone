import React, { useState, useRef } from 'react';
import { Send, Paperclip, Smile, Mic } from 'lucide-react';
import { motion } from 'framer-motion';

export interface MessageInputProps {
    onSendMessage: (message: string, file?: File) => void;
    onTypingStart?: () => void;
    onTypingStop?: () => void;
    disabled?: boolean;
    isLoading?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
    onSendMessage,
    onTypingStart,
    onTypingStop,
    disabled = false,
    isLoading = false,
}) => {
    const [message, setMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textInputRef = useRef<HTMLTextAreaElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();

    const handleSendMessage = () => {
        if (message.trim()) {
            onSendMessage(message.trim());
            setMessage('');
            textInputRef.current?.focus();
            // Clear typing status
            clearTypingTimeout();
            onTypingStop?.();
        }
    };

    const clearTypingTimeout = () => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = undefined;
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setMessage(value);

        // Clear existing timeout
        clearTypingTimeout();

        if (value.trim().length > 0) {
            // Broadcast typing start
            onTypingStart?.();

            // Set timeout to broadcast typing stop
            typingTimeoutRef.current = setTimeout(() => {
                onTypingStop?.();
            }, 3000);
        } else {
            // Stop typing immediately if text is empty
            onTypingStop?.();
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleBlur = () => {
        clearTypingTimeout();
        onTypingStop?.();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onSendMessage(file.name, file);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            clearTypingTimeout();
            onTypingStop?.();
        }
    };

    const handleAttachFile = () => {
        fileInputRef.current?.click();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-3 bg-[#202c33] border-t border-[#1f2937] flex-shrink-0"
        >
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
                disabled={disabled || isLoading}
            />

            <div className="flex items-end gap-3">
                {/* Left Action Buttons */}
                <motion.div className="flex gap-2">
                    {/* Emoji Button */}
                    <motion.button
                        whileHover={{ scale: 1.1, color: '#00d084' }}
                        whileTap={{ scale: 0.95 }}
                        className="text-gray-400 transition p-2 hover:bg-[#1f2937] rounded-lg"
                        disabled={disabled || isLoading}
                        type="button"
                    >
                        <Smile className="w-5 h-5" />
                    </motion.button>

                    {/* Attachment Button */}
                    <motion.button
                        whileHover={{ scale: 1.1, color: '#00d084' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAttachFile}
                        className="text-gray-400 transition p-2 hover:bg-[#1f2937] rounded-lg"
                        disabled={disabled || isLoading}
                        type="button"
                    >
                        <Paperclip className="w-5 h-5" />
                    </motion.button>
                </motion.div>

                {/* Message Input Area */}
                <div className="flex-1 bg-[#1f2937] rounded-2xl px-4 py-2 flex items-center border border-[#101828] focus-within:border-[#005c4b] transition">
                    <textarea
                        ref={textInputRef}
                        value={message}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        onBlur={handleBlur}
                        placeholder="Type a message..."
                        disabled={disabled || isLoading}
                        rows={1}
                        className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none resize-none max-h-20 text-sm leading-5"
                        style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#005c4b transparent',
                        }}
                    />
                </div>

                {/* Right Action Buttons */}
                <motion.div className="flex gap-2">
                    {message.trim() ? (
                        // Send Button
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSendMessage}
                            disabled={disabled || isLoading || !message.trim()}
                            className="bg-[#005c4b] hover:bg-[#00704d] text-white p-2.5 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
                            type="button"
                        >
                            <Send className="w-5 h-5" fill="currentColor" />
                        </motion.button>
                    ) : (
                        // Microphone Button (for voice recording)
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onMouseDown={() => setIsRecording(true)}
                            onMouseUp={() => setIsRecording(false)}
                            onMouseLeave={() => setIsRecording(false)}
                            className={`${
                                isRecording
                                    ? 'bg-red-500 animate-pulse'
                                    : 'bg-[#005c4b] hover:bg-[#00704d]'
                            } text-white p-2.5 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed`}
                            disabled={disabled || isLoading}
                            type="button"
                        >
                            <Mic className="w-5 h-5" />
                        </motion.button>
                    )}
                </motion.div>
            </div>

            {/* Character Count (optional) */}
            {message.length > 0 && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-gray-500 mt-2 text-right"
                >
                    {message.length} characters
                </motion.p>
            )}
        </motion.div>
    );
};

/**
 * Minimal input component for mobile view
 */
export const MessageInputCompact: React.FC<MessageInputProps> = ({
    onSendMessage,
    disabled = false,
    isLoading = false,
}) => {
    const [message, setMessage] = useState('');

    const handleSendMessage = () => {
        if (message.trim()) {
            onSendMessage(message.trim());
            setMessage('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 py-2 bg-[#202c33] border-t border-[#1f2937] flex-shrink-0"
        >
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Message..."
                    disabled={disabled || isLoading}
                    className="flex-1 bg-[#1f2937] text-white placeholder-gray-500 outline-none rounded-lg px-3 py-2 border border-[#101828] focus:border-[#005c4b] transition text-sm"
                />
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendMessage}
                    disabled={disabled || isLoading || !message.trim()}
                    className="bg-[#005c4b] hover:bg-[#00704d] text-white p-2 rounded-lg transition disabled:opacity-50"
                >
                    <Send className="w-4 h-4" />
                </motion.button>
            </div>
        </motion.div>
    );
};
