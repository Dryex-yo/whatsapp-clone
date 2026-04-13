import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    effectiveTheme: 'light' | 'dark';
    setTheme: (theme: Theme) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: React.ReactNode;
    initialTheme: Theme;
}

/**
 * Helper untuk mendapatkan preferensi tema OS
 */
const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, initialTheme }) => {
    const [theme, setThemeState] = useState<Theme>(initialTheme);
    const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');
    const [isHydrated, setIsHydrated] = useState(false);

    // 1. Sinkronisasi tema efektif (berdasarkan pilihan user atau sistem)
    useEffect(() => {
        const resolveTheme = () => (theme === 'system' ? getSystemTheme() : (theme as 'light' | 'dark'));
        
        setEffectiveTheme(resolveTheme());

        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => setEffectiveTheme(getSystemTheme());
            
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    // 2. Manipulasi DOM & Hydration
    useEffect(() => {
        const html = document.documentElement;
        if (effectiveTheme === 'dark') {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
        setIsHydrated(true);
    }, [effectiveTheme]);

    // 3. Handler untuk update tema ke Backend
    const setTheme = async (newTheme: Theme) => {
        const previousTheme = theme;
        setThemeState(newTheme);

        try {
            const response = await fetch('/api/user/theme', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
                },
                body: JSON.stringify({ theme: newTheme }),
            });

            if (!response.ok) throw new Error('Failed to update server-side theme');
        } catch (error) {
            console.error('Theme sync error:', error);
            setThemeState(previousTheme); // Rollback jika gagal
        }
    };

    // 4. Memoize value untuk menghindari re-render yang tidak perlu
    const value = useMemo(() => ({
        theme,
        effectiveTheme,
        setTheme,
    }), [theme, effectiveTheme]);

    return (
        <ThemeContext.Provider value={value}>
            {/* Penting: Provider HARUS membungkus children segera. 
                Gunakan opacity atau container agar tidak terjadi 'flicker' saat loading.
            */}
            <div style={{ visibility: isHydrated ? 'visible' : 'hidden' }}>
                {children}
            </div>
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};