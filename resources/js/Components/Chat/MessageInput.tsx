import React, { useState, useRef } from 'react';
import { Send, Paperclip, Smile, Mic } from 'lucide-react';
import { motion } from 'framer-motion';
import { ImagePreview } from '@/Components/ImagePreview';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import type { UploadPreview } from '@/types/media';

export interface MessageInputProps {
    conversationId: number;
    onSendMessage: (message: string, file?: File) => void;
    onTypingStart?: () => void;
    onTypingStop?: () => void;
    disabled?: boolean;
    isLoading?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
    conversationId,
    onSendMessage,
    onTypingStart,
    onTypingStop,
    disabled = false,
    isLoading = false,
}) => {
    const [message, setMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textInputRef = useRef<HTMLTextAreaElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();

    // Media upload hook
    const { preview, loading: uploadLoading, error, uploadFile, clearPreview, clearError } = useMediaUpload();

    const handleSendMessage = () => {
        if (message.trim()) {
            onSendMessage(message.trim());
            setMessage('');
            setIsSubmitting(false);
            textInputRef.current?.focus();
            // Clear typing status
            clearTypingTimeout();
            onTypingStop?.();
        }
    };

    const handleConfirmPreview = async () => {
        if (preview) {
            // The message body will be empty for media-only messages
            // In a real app, you might want to require a caption
            handleSendMessage();
        }
    };

    const clearTypingTimeout = () => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = undefined;
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.currentTarget.value;
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
            
            // If preview is shown, sending confirms the preview
            if (preview && !message.trim()) {
                handleConfirmPreview();
            } else {
                handleSendMessage();
            }
        }
    };

    const handleBlur = () => {
        clearTypingTimeout();
        onTypingStop?.();
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.currentTarget.files?.[0];
        if (file) {
            setIsSubmitting(true);
            const uploadedPreview = await uploadFile(file, conversationId);
            if (uploadedPreview) {
                // Preview will be shown via ImagePreview modal
                // User must confirm before sending
            }
            setIsSubmitting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            clearTypingTimeout();
            onTypingStop?.();
        }
    };

    const handleAttachFile = () => {
        clearError();
        fileInputRef.current?.click();
    };

    const handleCancelPreview = () => {
        clearPreview();
    };

    return (
        <>
            {/* Image Preview Modal */}
            <ImagePreview
                preview={preview}
                loading={uploadLoading}
                onConfirm={handleConfirmPreview}
                onCancel={handleCancelPreview}
                isSubmitting={isSubmitting}
            />

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
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                    disabled={disabled || isLoading || uploadLoading || isSubmitting}
                />

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/20 border border-red-500/50 rounded-lg p-2 mb-2 flex items-center justify-between text-sm text-red-300"
                    >
                        <span>{error}</span>
                        <button
                            onClick={clearError}
                            className="text-red-300 hover:text-red-200"
                            type="button"
                        >
                            ✕
                        </button>
                    </motion.div>
                )}

                <div className="flex items-end gap-3">
                    {/* Left Action Buttons */}
                    <motion.div className="flex gap-2">
                        {/* Emoji Button */}
                        <motion.button
                            whileHover={{ scale: 1.1, color: '#00d084' }}
                            whileTap={{ scale: 0.95 }}
                            className="text-gray-400 transition p-2 hover:bg-[#1f2937] rounded-lg"
                            disabled={disabled || isLoading || uploadLoading || isSubmitting}
                            type="button"
                        >
                            <Smile className="w-5 h-5" />
                        </motion.button>

                        {/* Attachment Button */}
                        <motion.button
                            whileHover={{ scale: 1.1, color: '#00d084' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleAttachFile}
                            className="text-gray-400 transition p-2 hover:bg-[#1f2937] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={disabled || isLoading || uploadLoading || isSubmitting}
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
                            placeholder={preview ? "Add a caption..." : "Type a message..."}
                            disabled={disabled || isLoading || uploadLoading || isSubmitting}
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
                        {message.trim() || preview ? (
                            // Send Button
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={preview && !message.trim() ? handleConfirmPreview : handleSendMessage}
                                disabled={disabled || isLoading || uploadLoading || isSubmitting}
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
                                disabled={disabled || isLoading || uploadLoading || isSubmitting}
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
        </>
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
