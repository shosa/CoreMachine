'use client';

import { Box, Typography } from '@mui/material';
import Image from 'next/image';

interface LogoProps {
  collapsed?: boolean;
}

export default function Logo({ collapsed = false }: LogoProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 2,
      }}
    >
      <Image
        src="/logo.png"
        alt="CoreMachine Logo"
        width={32}
        height={32}
        style={{ filter: 'invert(1)' }}
      />
      {!collapsed && (
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontWeight: 700,
          }}
        >
          CoreMachine
        </Typography>
      )}
    </Box>
  );
}
