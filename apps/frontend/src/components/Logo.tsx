'use client';

import { Box, Typography } from '@mui/material';
import { Build } from '@mui/icons-material';

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
      <Build sx={{ fontSize: 32, color: 'primary.main' }} />
      {!collapsed && (
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontWeight: 700,
            color: 'text.primary',
          }}
        >
          CoreMachine
        </Typography>
      )}
    </Box>
  );
}
