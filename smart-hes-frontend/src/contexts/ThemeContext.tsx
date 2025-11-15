import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

interface ThemeContextType {
  mode: PaletteMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleTheme: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

interface Props {
  children: React.ReactNode;
}

export const ThemeContextProvider: React.FC<Props> = ({ children }) => {
  const [mode, setMode] = useState<PaletteMode>(() => {
    const savedMode = localStorage.getItem('themeMode');
    return (savedMode as PaletteMode) || 'light';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light'
            ? {
                // Light mode colors - Professional IoT theme
                primary: {
                  main: '#0066CC',
                  light: '#3385D6',
                  dark: '#004C99',
                  contrastText: '#ffffff',
                },
                secondary: {
                  main: '#00A8E8',
                  light: '#33B9ED',
                  dark: '#007DB5',
                  contrastText: '#ffffff',
                },
                success: {
                  main: '#00C853',
                  light: '#5EFC82',
                  dark: '#009624',
                  contrastText: '#ffffff',
                },
                info: {
                  main: '#00B8D4',
                  light: '#62EBFF',
                  dark: '#0088A3',
                  contrastText: '#ffffff',
                },
                warning: {
                  main: '#FFB300',
                  light: '#FFE54C',
                  dark: '#C68400',
                  contrastText: '#000000',
                },
                error: {
                  main: '#D32F2F',
                  light: '#EF5350',
                  dark: '#C62828',
                  contrastText: '#ffffff',
                },
                background: {
                  default: '#F5F7FA',
                  paper: '#FFFFFF',
                },
                text: {
                  primary: '#1A2027',
                  secondary: '#4A5568',
                },
                divider: '#E2E8F0',
              }
            : {
                // Dark mode colors - Professional IoT theme
                primary: {
                  main: '#5BA3FF',
                  light: '#85BAFF',
                  dark: '#3D7ED9',
                  contrastText: '#000000',
                },
                secondary: {
                  main: '#4DD4FF',
                  light: '#7DDFFF',
                  dark: '#2AAFDA',
                  contrastText: '#000000',
                },
                success: {
                  main: '#69F0AE',
                  light: '#B9F6CA',
                  dark: '#00E676',
                  contrastText: '#000000',
                },
                info: {
                  main: '#40C4FF',
                  light: '#80D8FF',
                  dark: '#0091EA',
                  contrastText: '#000000',
                },
                warning: {
                  main: '#FFD54F',
                  light: '#FFE082',
                  dark: '#FFC107',
                  contrastText: '#000000',
                },
                error: {
                  main: '#FF5252',
                  light: '#FF8A80',
                  dark: '#D50000',
                  contrastText: '#000000',
                },
                background: {
                  default: '#0A1929',
                  paper: '#132F4C',
                },
                text: {
                  primary: '#FFFFFF',
                  secondary: '#B0BEC5',
                },
                divider: '#1E4976',
              }),
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica Neue", "Arial", sans-serif',
          h1: {
            fontSize: '3rem',
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
          },
          h2: {
            fontSize: '2.5rem',
            fontWeight: 700,
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
          },
          h3: {
            fontSize: '2rem',
            fontWeight: 600,
            lineHeight: 1.35,
          },
          h4: {
            fontSize: '1.75rem',
            fontWeight: 600,
            lineHeight: 1.4,
          },
          h5: {
            fontSize: '1.5rem',
            fontWeight: 600,
            lineHeight: 1.4,
          },
          h6: {
            fontSize: '1.25rem',
            fontWeight: 600,
            lineHeight: 1.5,
          },
          subtitle1: {
            fontSize: '1.125rem',
            fontWeight: 500,
            lineHeight: 1.6,
          },
          subtitle2: {
            fontSize: '1rem',
            fontWeight: 500,
            lineHeight: 1.6,
          },
          body1: {
            fontSize: '1rem',
            fontWeight: 400,
            lineHeight: 1.6,
          },
          body2: {
            fontSize: '0.875rem',
            fontWeight: 400,
            lineHeight: 1.6,
          },
          button: {
            fontSize: '0.9375rem',
            fontWeight: 600,
            lineHeight: 1.5,
            textTransform: 'none',
          },
          caption: {
            fontSize: '0.75rem',
            fontWeight: 400,
            lineHeight: 1.4,
          },
          overline: {
            fontSize: '0.75rem',
            fontWeight: 700,
            lineHeight: 2,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          },
        },
        shape: {
          borderRadius: 12,
        },
        shadows: [
          'none',
          mode === 'light'
            ? '0px 2px 4px rgba(0, 0, 0, 0.05)'
            : '0px 2px 4px rgba(0, 0, 0, 0.3)',
          mode === 'light'
            ? '0px 4px 8px rgba(0, 0, 0, 0.08)'
            : '0px 4px 8px rgba(0, 0, 0, 0.4)',
          mode === 'light'
            ? '0px 8px 16px rgba(0, 0, 0, 0.1)'
            : '0px 8px 16px rgba(0, 0, 0, 0.5)',
          mode === 'light'
            ? '0px 12px 24px rgba(0, 0, 0, 0.12)'
            : '0px 12px 24px rgba(0, 0, 0, 0.6)',
          mode === 'light'
            ? '0px 16px 32px rgba(0, 0, 0, 0.14)'
            : '0px 16px 32px rgba(0, 0, 0, 0.7)',
          ...Array(19).fill(mode === 'light'
            ? '0px 20px 40px rgba(0, 0, 0, 0.16)'
            : '0px 20px 40px rgba(0, 0, 0, 0.8)'),
        ],
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 10,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9375rem',
                padding: '10px 24px',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: mode === 'light'
                    ? '0px 8px 16px rgba(0, 0, 0, 0.15)'
                    : '0px 8px 16px rgba(0, 0, 0, 0.5)',
                },
              },
              containedPrimary: {
                background: mode === 'light'
                  ? 'linear-gradient(135deg, #0066CC 0%, #004C99 100%)'
                  : 'linear-gradient(135deg, #5BA3FF 0%, #3D7ED9 100%)',
                '&:hover': {
                  background: mode === 'light'
                    ? 'linear-gradient(135deg, #004C99 0%, #003366 100%)'
                    : 'linear-gradient(135deg, #7DBAFF 0%, #5BA3FF 100%)',
                },
              },
              containedSuccess: {
                background: mode === 'light'
                  ? 'linear-gradient(135deg, #00C853 0%, #009624 100%)'
                  : 'linear-gradient(135deg, #69F0AE 0%, #00E676 100%)',
              },
              containedError: {
                background: mode === 'light'
                  ? 'linear-gradient(135deg, #D32F2F 0%, #C62828 100%)'
                  : 'linear-gradient(135deg, #FF5252 0%, #D50000 100%)',
              },
              containedWarning: {
                background: mode === 'light'
                  ? 'linear-gradient(135deg, #FFB300 0%, #C68400 100%)'
                  : 'linear-gradient(135deg, #FFD54F 0%, #FFC107 100%)',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                boxShadow: mode === 'light'
                  ? '0px 4px 20px rgba(0, 0, 0, 0.08)'
                  : '0px 4px 20px rgba(0, 0, 0, 0.4)',
                border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                backdropFilter: mode === 'dark' ? 'blur(10px)' : 'none',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                backgroundImage: 'none',
              },
              elevation1: {
                boxShadow: mode === 'light'
                  ? '0px 2px 8px rgba(0, 0, 0, 0.05)'
                  : '0px 2px 8px rgba(0, 0, 0, 0.3)',
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 10,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    boxShadow: mode === 'light'
                      ? '0px 2px 8px rgba(0, 102, 204, 0.15)'
                      : '0px 2px 8px rgba(91, 163, 255, 0.3)',
                  },
                  '&.Mui-focused': {
                    boxShadow: mode === 'light'
                      ? '0px 4px 12px rgba(0, 102, 204, 0.25)'
                      : '0px 4px 12px rgba(91, 163, 255, 0.4)',
                  },
                },
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '0.8125rem',
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: {
                borderBottom: mode === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.1)'
                  : '1px solid rgba(0, 0, 0, 0.08)',
              },
              head: {
                fontWeight: 700,
                backgroundColor: mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.02)',
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                boxShadow: mode === 'light'
                  ? '0px 1px 3px rgba(0, 0, 0, 0.08)'
                  : '0px 1px 3px rgba(0, 0, 0, 0.3)',
              },
            },
          },
        },
      }),
    [mode]
  );

  const value = {
    mode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <MUIThemeProvider theme={theme}>{children}</MUIThemeProvider>
    </ThemeContext.Provider>
  );
};
