import { Stack, Typography, Breadcrumbs } from '@mui/material';
import React from 'react';
import { Home } from '@mui/icons-material';
import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  breadcrumbs?: string[];
  renderRight?: React.ReactNode;
}

export const PageHeader = ({ title, breadcrumbs, renderRight }: PageHeaderProps) => {
  const breadcrumbsList = breadcrumbs?.map((breadcrumb) => (
    <Typography key={breadcrumb} color='text.primary' fontSize={14}>
      {breadcrumb}
    </Typography>
  ));

  return (
    <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} marginBottom={2}>
      <Stack spacing={2} marginBottom={2}>
        <Typography
          variant='h1'
          sx={{
            fontSize: (theme) => theme.typography.fontSize * 2.5,
            fontWeight: (theme) => theme.typography.fontWeightBold
          }}
        >
          {title}
        </Typography>
        {breadcrumbs ? (
          <Breadcrumbs separator='•' aria-label='breadcrumb'>
            <Link href="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Typography fontSize={14} alignItems={'center'} display={'flex'} color='text.primary'>
                <Home fontSize={'inherit'} sx={{ marginRight: 0.5 }} /> CoreMachine
              </Typography>
            </Link>
            {breadcrumbsList}
          </Breadcrumbs>
        ) : null}
      </Stack>
      {renderRight ? <div>{renderRight}</div> : null}
    </Stack>
  );
};
