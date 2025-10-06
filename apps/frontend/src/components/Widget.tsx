import { Box, Paper, Typography, BoxProps } from '@mui/material';
import { ReactNode } from 'react';

export interface WidgetProps {
  title: string;
  children?: ReactNode;
  sx?: BoxProps['sx'];
  contentHeight?: string;
}

export const Widget = ({ title, children, sx, contentHeight }: WidgetProps) => {
  return (
    <Box
      component={Paper}
      sx={{
        border: (theme) => `1px solid ${theme.palette.divider}`,
        padding: 2,
        borderRadius: (theme) => theme.shape.borderRadius,
        flex: 1,
        justifyContent: 'space-between',
        flexDirection: 'column',
        height: '100%',
        display: 'flex',
        ...sx,
      }}
    >
      <Box sx={{ marginBottom: 2 }}>
        <Typography
          sx={{
            fontSize: (theme) => theme.typography.h6.fontSize,
            fontWeight: (theme) => theme.typography.h6.fontWeight,
            color: (theme) => theme.palette.text.primary,
          }}
        >
          {title}
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1, height: contentHeight }}>
        <Box height={'100%'}>{children}</Box>
      </Box>
    </Box>
  );
};
