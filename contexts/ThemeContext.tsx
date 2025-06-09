import React, { createContext, useState, useEffect, ReactNode, useContext, ReactElement } from 'react';
import { useColorScheme as useDeviceColorScheme, Appearance } from 'react-native';
import Colors, { ColorScheme } from '../constants/Colors';

interface ThemeContextType {
    theme: 'light' | 'dark';
    colors: ColorScheme;
    toggleTheme: () => void;
    isDark: boolean;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps): ReactElement => {
    const deviceScheme = useDeviceColorScheme();
    const [theme, setTheme] = useState<'light' | 'dark'>(deviceScheme || 'light');

    useEffect(() => {
        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
            setTheme(colorScheme || 'light');
        });
        return () => subscription.remove();
    }, []);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const colors = theme === 'light' ? Colors.light : Colors.dark;
    const isDark = theme === 'dark';

    return (
        <ThemeContext.Provider value={{ theme, colors, toggleTheme, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
};


export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
