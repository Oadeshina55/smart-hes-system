import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

export const NHLogo: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 240 60">
      <defs>
        <linearGradient id="nhGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#1976d2', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#42a5f5', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="nhGradientGreen" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#4caf50', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#81c784', stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      {/* NH Shield/Badge Shape */}
      <path
        d="M 28 10 L 38 10 L 42 18 L 42 35 L 33 42 L 24 35 L 24 18 Z"
        fill="url(#nhGradient)"
        stroke="#1565c0"
        strokeWidth="1.5"
      />

      {/* Lightning bolt - Energy symbol */}
      <path
        d="M 33 16 L 30 24 L 34 24 L 31 32 L 36 24 L 33 24 L 36 16 Z"
        fill="white"
        opacity="0.95"
      />

      {/* IoT Connection nodes */}
      <circle cx="14" cy="20" r="2.5" fill="#4caf50"/>
      <circle cx="52" cy="20" r="2.5" fill="#4caf50"/>
      <circle cx="14" cy="38" r="2.5" fill="#4caf50"/>
      <circle cx="52" cy="38" r="2.5" fill="#4caf50"/>

      {/* Connection lines to center */}
      <line x1="14" y1="20" x2="24" y2="24" stroke="#4caf50" strokeWidth="1" opacity="0.6"/>
      <line x1="52" y1="20" x2="42" y2="24" stroke="#4caf50" strokeWidth="1" opacity="0.6"/>
      <line x1="14" y1="38" x2="24" y2="32" stroke="#4caf50" strokeWidth="1" opacity="0.6"/>
      <line x1="52" y1="38" x2="42" y2="32" stroke="#4caf50" strokeWidth="1" opacity="0.6"/>

      {/* Company Text */}
      <text x="60" y="28" fontFamily="'Segoe UI', Arial, sans-serif" fontSize="18" fontWeight="700" fill="#1976d2">
        New Hampshire
      </text>
      <text x="60" y="45" fontFamily="'Segoe UI', Arial, sans-serif" fontSize="11" fontWeight="500" fill="currentColor" opacity="0.8">
        Energy Management System
      </text>
    </SvgIcon>
  );
};

// Compact version for small spaces
export const NHLogoCompact: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 48 48">
      <defs>
        <linearGradient id="nhGradientCompact" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#1976d2', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#42a5f5', stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      {/* NH Shield Shape */}
      <path
        d="M 24 4 L 36 4 L 42 14 L 42 32 L 24 44 L 6 32 L 6 14 L 12 4 Z"
        fill="url(#nhGradientCompact)"
        stroke="#1565c0"
        strokeWidth="2"
      />

      {/* NH Letters */}
      <text x="24" y="32" fontFamily="'Segoe UI', Arial, sans-serif" fontSize="20" fontWeight="900" fill="white" textAnchor="middle">
        NH
      </text>

      {/* IoT dots */}
      <circle cx="24" cy="8" r="1.5" fill="#4caf50"/>
      <circle cx="36" cy="24" r="1.5" fill="#4caf50"/>
      <circle cx="24" cy="40" r="1.5" fill="#4caf50"/>
      <circle cx="12" cy="24" r="1.5" fill="#4caf50"/>
    </SvgIcon>
  );
};

// Keep backward compatibility exports
export const HESLogo = NHLogo;
export const HESLogoCompact = NHLogoCompact;
