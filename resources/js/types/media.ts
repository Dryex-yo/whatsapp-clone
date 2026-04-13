/**
 * Media Upload Types
 */

export interface UploadPreview {
    file_name: string;
    path: string;
    url: string;
    thumbnail_url: string | null;
    type: 'image' | 'video' | 'audio' | 'document';
    mime_type: string;
    size: number;
    width?: number;
    height?: number;
    duration?: number;
}

export interface MediaUploadError {
    code: string;
    message: string;
    field?: string;
}
