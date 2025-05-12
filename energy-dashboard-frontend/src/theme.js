import { createTheme } from '@mui/material/styles';

export const getTheme = (mode, themeStyle = 'default') => {
    const baseTheme = {
        palette: {
            mode,
            primary: {
                main: '#1976d2',
            },
            secondary: {
                main: '#dc004e',
            },
            background: {
                default: mode === 'dark' ? '#121212' : '#f5f5f5',
                paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
            },
        },
        typography: {
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            h1: { fontSize: '2.5rem', fontWeight: 500 },
            h2: { fontSize: '2rem', fontWeight: 500 },
            h3: { fontSize: '1.75rem', fontWeight: 500 },
            h4: { fontSize: '1.5rem', fontWeight: 500 },
            h5: { fontSize: '1.25rem', fontWeight: 500 },
            h6: { fontSize: '1rem', fontWeight: 500 },
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        borderRadius: 8,
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                    },
                },
            },
            MuiAlert: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundColor: mode === 'dark' ? '#1e1e1e' : '#ffffff',
                        color: mode === 'dark' ? '#ffffff' : '#000000',
                    },
                },
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        backgroundColor: mode === 'dark' ? '#1e1e1e' : '#ffffff',
                    },
                },
            },
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        scrollbarColor: mode === 'dark' ? '#666 #1e1e1e' : '#666 #ffffff',
                        '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
                            backgroundColor: mode === 'dark' ? '#1e1e1e' : '#ffffff',
                            width: '8px',
                            height: '8px',
                        },
                        '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
                            borderRadius: 8,
                            backgroundColor: mode === 'dark' ? '#666' : '#666',
                            minHeight: 24,
                            border: mode === 'dark' ? '2px solid #1e1e1e' : '2px solid #ffffff',
                        },
                        '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
                            backgroundColor: mode === 'dark' ? '#959595' : '#959595',
                        },
                        '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
                            backgroundColor: mode === 'dark' ? '#959595' : '#959595',
                        },
                        '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
                            backgroundColor: mode === 'dark' ? '#959595' : '#959595',
                        },
                        '&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner': {
                            backgroundColor: mode === 'dark' ? '#1e1e1e' : '#ffffff',
                        },
                    },
                },
            },
        },
    };

    // Apply theme-specific customizations
    switch (themeStyle) {
        case 'modern':
            return createTheme({
                ...baseTheme,
                palette: {
                    ...baseTheme.palette,
                    primary: {
                        main: '#2196f3',
                    },
                    secondary: {
                        main: '#f50057',
                    },
                },
                components: {
                    ...baseTheme.components,
                    MuiButton: {
                        styleOverrides: {
                            root: {
                                ...baseTheme.components.MuiButton.styleOverrides.root,
                                borderRadius: 24,
                                padding: '8px 24px',
                            },
                        },
                    },
                    MuiPaper: {
                        styleOverrides: {
                            root: {
                                ...baseTheme.components.MuiPaper.styleOverrides.root,
                                borderRadius: 16,
                            },
                        },
                    },
                },
            });
        case 'minimal':
            return createTheme({
                ...baseTheme,
                palette: {
                    ...baseTheme.palette,
                    primary: {
                        main: '#424242',
                    },
                    secondary: {
                        main: '#757575',
                    },
                },
                components: {
                    ...baseTheme.components,
                    MuiButton: {
                        styleOverrides: {
                            root: {
                                ...baseTheme.components.MuiButton.styleOverrides.root,
                                borderRadius: 4,
                                boxShadow: 'none',
                            },
                        },
                    },
                    MuiPaper: {
                        styleOverrides: {
                            root: {
                                ...baseTheme.components.MuiPaper.styleOverrides.root,
                                borderRadius: 4,
                                boxShadow: 'none',
                            },
                        },
                    },
                },
            });
        default:
            return createTheme(baseTheme);
    }
};

// Export the default theme for use in index.js
export const theme = getTheme('light', 'default'); 