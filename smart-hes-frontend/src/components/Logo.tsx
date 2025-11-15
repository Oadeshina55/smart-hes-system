import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

export const HESLogo: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 200 60">
      {/* Main energy/circuit symbol */}
      <defs>
        <linearGradient id="hesGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#0066CC', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#00A8E8', stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      {/* Circular energy icon */}
      <circle cx="25" cy="30" r="20" fill="none" stroke="url(#hesGradient)" strokeWidth="3" opacity="0.3"/>
      <circle cx="25" cy="30" r="15" fill="none" stroke="url(#hesGradient)" strokeWidth="2.5"/>

      {/* Lightning bolt in center */}
      <path
        d="M 25 18 L 21 28 L 26 28 L 23 42 L 32 26 L 27 26 L 30 18 Z"
        fill="url(#hesGradient)"
      />

      {/* Connection dots/nodes (IoT representation) */}
      <circle cx="15" cy="15" r="2" fill="#00A8E8"/>
      <circle cx="35" cy="15" r="2" fill="#00A8E8"/>
      <circle cx="15" cy="45" r="2" fill="#00A8E8"/>
      <circle cx="35" cy="45" r="2" fill="#00A8E8"/>

      {/* Connecting lines (network) */}
      <line x1="15" y1="15" x2="25" y2="30" stroke="#0066CC" strokeWidth="1" opacity="0.4"/>
      <line x1="35" y1="15" x2="25" y2="30" stroke="#0066CC" strokeWidth="1" opacity="0.4"/>
      <line x1="15" y1="45" x2="25" y2="30" stroke="#0066CC" strokeWidth="1" opacity="0.4"/>
      <line x1="35" y1="45" x2="25" y2="30" stroke="#0066CC" strokeWidth="1" opacity="0.4"/>

      {/* Text: HES */}
      <text x="60" y="25" fontFamily="Inter, sans-serif" fontSize="24" fontWeight="700" fill="url(#hesGradient)">
        HES
      </text>

      {/* Text: Core */}
      <text x="60" y="45" fontFamily="Inter, sans-serif" fontSize="18" fontWeight="500" fill="currentColor">
        Core
      </text>

      {/* Subtitle */}
      <text x="125" y="35" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="400" fill="currentColor" opacity="0.7">
        IoT Energy Management
      </text>
    </SvgIcon>
  );
};

// Compact version for small spaces
export const HESLogoCompact: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 60 60">
      <defs>
        <linearGradient id="hesGradientCompact" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#0066CC', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#00A8E8', stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      <circle cx="30" cy="30" r="25" fill="none" stroke="url(#hesGradientCompact)" strokeWidth="3" opacity="0.3"/>
      <circle cx="30" cy="30" r="18" fill="none" stroke="url(#hesGradientCompact)" strokeWidth="3"/>

      <path
        d="M 30 20 L 25 32 L 31 32 L 27 48 L 38 30 L 32 30 L 36 20 Z"
        fill="url(#hesGradientCompact)"
      />

      <circle cx="18" cy="18" r="2.5" fill="#00A8E8"/>
      <circle cx="42" cy="18" r="2.5" fill="#00A8E8"/>
      <circle cx="18" cy="42" r="2.5" fill="#00A8E8"/>
      <circle cx="42" cy="42" r="2.5" fill="#00A8E8"/>

      <line x1="18" y1="18" x2="30" y2="30" stroke="#0066CC" strokeWidth="1.5" opacity="0.4"/>
      <line x1="42" y1="18" x2="30" y2="30" stroke="#0066CC" strokeWidth="1.5" opacity="0.4"/>
      <line x1="18" y1="42" x2="30" y2="30" stroke="#0066CC" strokeWidth="1.5" opacity="0.4"/>
      <line x1="42" y1="42" x2="30" y2="30" stroke="#0066CC" strokeWidth="1.5" opacity="0.4"/>
    </SvgIcon>
  );
};
