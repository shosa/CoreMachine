'use client';

import { ReactNode } from 'react';
import { Card, CardContent, Box, Typography, alpha } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  trend?: number;
  subtitle?: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  color = 'primary',
  trend,
  subtitle,
}: StatsCardProps) {
  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'visible',
        background: theme =>
          `linear-gradient(135deg, ${alpha(theme.palette[color].light, 0.3)}, ${alpha(theme.palette[color].main, 0.3)})`,
        borderLeft: theme => `4px solid ${theme.palette[color].main}`,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme => `0 12px 24px ${alpha(theme.palette[color].main, 0.25)}`,
        },
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              fontWeight={600}
              gutterBottom
              sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem' }}
            >
              {title}
            </Typography>
            <Typography variant="h3" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: theme => alpha(theme.palette[color].main, 0.15),
              color: `${color}.main`,
            }}
          >
            {icon}
          </Box>
        </Box>

        {trend !== undefined && (
          <Box
            display="flex"
            alignItems="center"
            gap={0.5}
            mt={2}
            sx={{
              color: trend >= 0 ? 'success.main' : 'error.main',
            }}
          >
            {trend >= 0 ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
            <Typography variant="body2" fontWeight={600}>
              {trend >= 0 ? '+' : ''}
              {trend}% rispetto al mese scorso
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
