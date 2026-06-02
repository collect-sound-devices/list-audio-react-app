'use client';

import React, { useState, useMemo, ReactNode, useEffect } from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import { ThemeContext } from './themeContextUtils';
import { GlobalStyles } from '@mui/material';

interface ThemeProviderComponentProps {
    children: ReactNode;
    initialMode?: 'light' | 'dark';
}

const getInitialDarkMode = (initialMode?: 'light' | 'dark') => {
    if (initialMode) return initialMode === 'dark';
    if (typeof window === 'undefined') return false;

    try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || savedTheme === 'light') {
            return savedTheme === 'dark';
        }

        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
        return false;
    }
};

export const ThemeProviderComponent: React.FC<ThemeProviderComponentProps> = ({ children, initialMode }) => {
    // Initialize from SSR-provided initialMode to prevent hydration flicker.
    const [darkMode, setDarkMode] = useState<boolean>(() => getInitialDarkMode(initialMode));

    useEffect(() => {
        // Listen for system preference changes only when no explicit saved theme exists.
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (event: MediaQueryListEvent) => {
            try {
                if (!localStorage.getItem('theme')) {
                    setDarkMode(event.matches);
                }
            } catch {
                // ignore
            }
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, []);

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode: darkMode ? 'dark' : 'light',
                },
            }),
        [darkMode]
    );

    // Keep DOM in sync with the theme for UA rendering and CSS selectors.
    useEffect(() => {
        try {
            const mode = darkMode ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', mode);
            const meta: HTMLMetaElement | null = document.querySelector('meta[name="color-scheme"]');
            if (meta) meta.setAttribute('content', mode);
            // Keep the body background in sync until MUI GlobalStyles applies
            document.documentElement.style.setProperty('background-color', mode === 'dark' ? '#121212' : '#ffffff');
            if (document.body) document.body.style.setProperty('background-color', mode === 'dark' ? '#121212' : '#ffffff');
        } catch {
            // ignore
        }
    }, [darkMode]);

    const toggleTheme = () => {
        setDarkMode((prevMode) => {
            const newMode = !prevMode;
            try {
                localStorage.setItem('theme', newMode ? 'dark' : 'light');
                document.cookie = `theme-mode=${newMode ? 'dark' : 'light'}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
            } catch {
                // ignore
            }
            return newMode;
        });
    };

    return (
        <ThemeContext.Provider value={{ toggleTheme, theme }}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <GlobalStyles
                    styles={{
                        html: {
                            backgroundColor: theme.palette.background.default,
                        },
                        body: {
                            backgroundColor: theme.palette.background.default,
                        },
                    }}
                />
                {children}
            </ThemeProvider>
        </ThemeContext.Provider>
    );
};
