export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    profile_photo_url: string; // Always has value (default UI-Avatar or uploaded)
    profile_photo_path?: string;
    about?: string; // User bio/status
    phone?: string; // User phone number
    bio?: string; // Alias for about
    theme?: 'light' | 'dark' | 'system';
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
};
