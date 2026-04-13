import { useCallback, useState } from 'react';
import type { UploadPreview, MediaUploadError } from '@/types/media';

interface MediaUploadState {
    preview: UploadPreview | null;
    loading: boolean;
    error: string | null;
}

interface UseMediaUploadReturn extends MediaUploadState {
    uploadFile: (file: File, conversationId: number) => Promise<UploadPreview | null>;
    createAttachment: (
        messageId: number,
        preview: UploadPreview
    ) => Promise<boolean>;
    clearPreview: () => void;
    clearError: () => void;
}

/**
 * Hook to manage media upload workflow:
 * 1. Upload file (returns preview)
 * 2. Show preview to user
 * 3. Create attachment after message is sent
 */
export function useMediaUpload(): UseMediaUploadReturn {
    const [preview, setPreview] = useState<UploadPreview | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uploadFile = useCallback(
        async (
            file: File,
            conversationId: number
        ): Promise<UploadPreview | null> => {
            setLoading(true);
            setError(null);

            try {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch(
                    `/api/conversations/${conversationId}/media/upload`,
                    {
                        method: 'POST',
                        body: formData,
                        headers: {
                            // Don't set Content-Type; browser will set it with boundary
                            Accept: 'application/json',
                        },
                    }
                );

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.message || 'Upload failed');
                }

                const uploadedPreview: UploadPreview =
                    await response.json();
                setPreview(uploadedPreview);
                setLoading(false);

                return uploadedPreview;
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : 'Upload failed';
                setError(errorMessage);
                setLoading(false);
                return null;
            }
        },
        []
    );

    const createAttachment = useCallback(
        async (messageId: number, uploadPreview: UploadPreview) => {
            try {
                const response = await fetch(
                    `/api/messages/${messageId}/attachments`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                        },
                        body: JSON.stringify({
                            path: uploadPreview.path,
                            file_name: uploadPreview.file_name,
                            mime_type: uploadPreview.mime_type,
                            size: uploadPreview.size,
                            type: uploadPreview.type,
                            width: uploadPreview.width,
                            height: uploadPreview.height,
                            duration: uploadPreview.duration,
                            thumbnail_path: uploadPreview.thumbnail_url
                                ?.replace(
                                    /^.*\/storage\//,
                                    ''
                                ) // Extract path from URL
                                .replace('^storage/', ''),
                        }),
                    }
                );

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(
                        data.message || 'Failed to create attachment'
                    );
                }

                // Clear preview on success
                setPreview(null);
                return true;
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : 'Operation failed';
                setError(errorMessage);
                return false;
            }
        },
        []
    );

    const clearPreview = useCallback(() => {
        setPreview(null);
        setError(null);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        preview,
        loading,
        error,
        uploadFile,
        createAttachment,
        clearPreview,
        clearError,
    };
}
