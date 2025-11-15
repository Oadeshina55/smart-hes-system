import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';

/**
 * Reusable background component for Auth pages (Login, Register, etc.)
 * Displays a cycling slideshow of images with overlay pattern.
 */
const AuthBackground: React.FC = () => {
  // Background slideshow images
  const bgImages = [
    'https://images.unsplash.com/photo-1694551073674-f8809f1685f4?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8d2luZG1pbGx8ZW58MHx8MHx8fDA%3D&fm=jpg&q=60&w=3000',
    'https://www.digi.com/getattachment/Blog/post/What-Is-the-Smart-Grid-and-How-Is-It-Enabled-by-Io/GettyImages-1145255159-1280x720.jpg?lang=en-US',
    'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cG93ZXIlMjBsaW5lfGVufDB8fDB8fHww&fm=jpg&q=60&w=3000',
  ];

  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setBgIndex((i) => (i + 1) % bgImages.length);
    }, 6000); // change every 6s
    return () => clearInterval(t);
  }, [bgImages.length]);

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
      }}
    >
      {bgImages.map((img, i) => (
        <Box
          key={img}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url('${img}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transition: 'opacity 1s ease-in-out',
            opacity: i === bgIndex ? 1 : 0,
            filter: 'brightness(0.55) contrast(0.95)',
          }}
        />
      ))}
      {/* subtle pattern overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
        }}
      />
    </Box>
  );
};

export default AuthBackground;
