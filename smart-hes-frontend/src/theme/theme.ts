import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#344767',
      light: '#495361',
      dark: '#2C3E50',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#8392AB',
      light: '#A0AAB8',
      dark: '#667085',
      contrastText: '#ffffff',
    },
    success: {
      main: '#82d616',
      light: '#95DC39',
      dark: '#6BAA0F',
      contrastText: '#ffffff',
    },
    info: {
      main: '#17c1e8',
      light: '#4DD0ED',
      dark: '#1197BA',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#fbcf33',
      light: '#FCD652',
      dark: '#F8B425',
      contrastText: '#344767',
    },
    error: {
      main: '#ea0606',
      light: '#ED3838',
      dark: '#BB0505',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#67748e',
      secondary: '#8392AB',
    },
  },
  typography: {
    fontFamily: '"Open Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
      lineHeight: 1.25,
      color: '#344767',
    },
    h2: {
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: 1.3,
      color: '#344767',
    },
    h3: {
      fontSize: '1.875rem',
      fontWeight: 700,
      lineHeight: 1.375,
      color: '#344767',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 700,
      lineHeight: 1.375,
      color: '#344767',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.375,
      color: '#344767',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.625,
      color: '#344767',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.625,
      color: '#67748e',
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.6,
      color: '#67748e',
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.625,
      color: '#67748e',
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.6,
      color: '#67748e',
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 700,
      lineHeight: 1.5,
      textTransform: 'uppercase',
      color: '#344767',
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.25,
      color: '#8392AB',
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 700,
      lineHeight: 1.5,
      textTransform: 'uppercase',
      color: '#8392AB',
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 1px 5px 0 rgba(0, 0, 0, 0.12)',
    '0 3px 4px 0 rgba(0, 0, 0, 0.14), 0 3px 3px -2px rgba(0, 0, 0, 0.2), 0 1px 8px 0 rgba(0, 0, 0, 0.12)',
    '0 3px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
    '0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12)',
    '0 3px 5px -1px rgba(0, 0, 0, 0.2), 0 5px 8px 0 rgba(0, 0, 0, 0.14), 0 1px 14px 0 rgba(0, 0, 0, 0.12)',
    '0 3px 5px -1px rgba(0, 0, 0, 0.2), 0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0, 0.12)',
    '0 4px 5px -2px rgba(0, 0, 0, 0.2), 0 7px 10px 1px rgba(0, 0, 0, 0.14), 0 2px 16px 1px rgba(0, 0, 0, 0.12)',
    '0 5px 5px -3px rgba(0, 0, 0, 0.2), 0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12)',
    '0 5px 6px -3px rgba(0, 0, 0, 0.2), 0 9px 12px 1px rgba(0, 0, 0, 0.14), 0 3px 16px 2px rgba(0, 0, 0, 0.12)',
    '0 6px 6px -3px rgba(0, 0, 0, 0.2), 0 10px 14px 1px rgba(0, 0, 0, 0.14), 0 4px 18px 3px rgba(0, 0, 0, 0.12)',
    '0 6px 7px -4px rgba(0, 0, 0, 0.2), 0 11px 15px 1px rgba(0, 0, 0, 0.14), 0 4px 20px 3px rgba(0, 0, 0, 0.12)',
    '0 7px 8px -4px rgba(0, 0, 0, 0.2), 0 12px 17px 2px rgba(0, 0, 0, 0.14), 0 5px 22px 4px rgba(0, 0, 0, 0.12)',
    '0 7px 8px -4px rgba(0, 0, 0, 0.2), 0 13px 19px 2px rgba(0, 0, 0, 0.14), 0 5px 24px 4px rgba(0, 0, 0, 0.12)',
    '0 7px 9px -4px rgba(0, 0, 0, 0.2), 0 14px 21px 2px rgba(0, 0, 0, 0.14), 0 5px 26px 4px rgba(0, 0, 0, 0.12)',
    '0 8px 9px -5px rgba(0, 0, 0, 0.2), 0 15px 22px 2px rgba(0, 0, 0, 0.14), 0 6px 28px 5px rgba(0, 0, 0, 0.12)',
    '0 8px 10px -5px rgba(0, 0, 0, 0.2), 0 16px 24px 2px rgba(0, 0, 0, 0.14), 0 6px 30px 5px rgba(0, 0, 0, 0.12)',
    '0 8px 11px -5px rgba(0, 0, 0, 0.2), 0 17px 26px 2px rgba(0, 0, 0, 0.14), 0 6px 32px 5px rgba(0, 0, 0, 0.12)',
    '0 9px 11px -5px rgba(0, 0, 0, 0.2), 0 18px 28px 2px rgba(0, 0, 0, 0.14), 0 7px 34px 6px rgba(0, 0, 0, 0.12)',
    '0 9px 12px -6px rgba(0, 0, 0, 0.2), 0 19px 29px 2px rgba(0, 0, 0, 0.14), 0 7px 36px 6px rgba(0, 0, 0, 0.12)',
    '0 10px 13px -6px rgba(0, 0, 0, 0.2), 0 20px 31px 3px rgba(0, 0, 0, 0.14), 0 8px 38px 7px rgba(0, 0, 0, 0.12)',
    '0 10px 13px -6px rgba(0, 0, 0, 0.2), 0 21px 33px 3px rgba(0, 0, 0, 0.14), 0 8px 40px 7px rgba(0, 0, 0, 0.12)',
    '0 10px 14px -6px rgba(0, 0, 0, 0.2), 0 22px 35px 3px rgba(0, 0, 0, 0.14), 0 8px 42px 7px rgba(0, 0, 0, 0.12)',
    '0 11px 14px -7px rgba(0, 0, 0, 0.2), 0 23px 36px 3px rgba(0, 0, 0, 0.14), 0 9px 44px 8px rgba(0, 0, 0, 0.12)',
    '0 11px 15px -7px rgba(0, 0, 0, 0.2), 0 24px 38px 3px rgba(0, 0, 0, 0.14), 0 9px 46px 8px rgba(0, 0, 0, 0.12)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          padding: '10px 24px',
          background: 'linear-gradient(195deg, #42424a 0%, #191919 100%)',
          color: '#fff',
          boxShadow: '0 3px 3px 0 rgba(0, 0, 0, 0.15), 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 1px 5px 0 rgba(0, 0, 0, 0.15)',
          '&:hover': {
            boxShadow: '0 14px 26px -12px rgba(0, 0, 0, 0.4), 0 4px 23px 0 rgba(0, 0, 0, 0.15), 0 8px 10px -5px rgba(0, 0, 0, 0.2)',
            background: 'linear-gradient(195deg, #42424a 0%, #191919 100%)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(195deg, #49a3f1 0%, #1A73E8 100%)',
          '&:hover': {
            background: 'linear-gradient(195deg, #49a3f1 0%, #1A73E8 100%)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(195deg, #747b8a 0%, #495361 100%)',
          '&:hover': {
            background: 'linear-gradient(195deg, #747b8a 0%, #495361 100%)',
          },
        },
        containedSuccess: {
          background: 'linear-gradient(195deg, #66BB6A 0%, #43A047 100%)',
          '&:hover': {
            background: 'linear-gradient(195deg, #66BB6A 0%, #43A047 100%)',
          },
        },
        containedError: {
          background: 'linear-gradient(195deg, #EC407A 0%, #D81B60 100%)',
          '&:hover': {
            background: 'linear-gradient(195deg, #EC407A 0%, #D81B60 100%)',
          },
        },
        containedWarning: {
          background: 'linear-gradient(195deg, #FFA726 0%, #FB8C00 100%)',
          '&:hover': {
            background: 'linear-gradient(195deg, #FFA726 0%, #FB8C00 100%)',
          },
        },
        containedInfo: {
          background: 'linear-gradient(195deg, #26C6DA 0%, #00ACC1 100%)',
          '&:hover': {
            background: 'linear-gradient(195deg, #26C6DA 0%, #00ACC1 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 20px 27px 0 rgba(0, 0, 0, 0.05)',
          padding: '16px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
  },
});

export default theme;
