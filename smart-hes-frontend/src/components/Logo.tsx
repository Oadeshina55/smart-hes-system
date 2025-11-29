import React from 'react';
import { Box, BoxProps } from '@mui/material';

interface LogoProps extends BoxProps {
  compact?: boolean;
}

export const NHLogo: React.FC<LogoProps> = ({ compact, ...props }) => {
  return (
    <Box
      component="img"
      src="/logo.png"
      alt="New Hampshire Capital"
      sx={{
        height: compact ? 40 : 50,
        width: 'auto',
        objectFit: 'contain',
        ...props.sx,
      }}
      {...props}
    />
  );
};

// Compact version for small spaces
export const NHLogoCompact: React.FC<BoxProps> = (props) => {
  return (
    <Box
      component="img"
      src="/logo.png"
      alt="NH"
      sx={{
        height: 40,
        width: 'auto',
        objectFit: 'contain',
        ...props.sx,
      }}
      {...props}
    />
  );
};

// Keep backward compatibility exports
export const HESLogo = NHLogo;
export const HESLogoCompact = NHLogoCompact;
