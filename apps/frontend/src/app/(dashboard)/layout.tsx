'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { CircularProgress, Box } from '@mui/material';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Give Zustand time to rehydrate from localStorage
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Only check authentication after initial load
    if (!isLoading && !isAuthenticated && !token) {
      router.push('/login');
    }
  }, [isAuthenticated, token, router, isLoading]);

  // Show loading during rehydration
  if (isLoading || (!isAuthenticated && !token)) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
