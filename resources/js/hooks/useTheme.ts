import { useTheme as useThemeContext } from '@/contexts/ThemeProvider';

export const useTheme = () => {
    return useThemeContext();
};
