'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

const ReceiveAlc2DataInquiryViewClient = dynamic(
  () => import('./receive-alc2-data-inquiry-view-client').then(mod => ({ default: mod.ReceiveAlc2DataInquiryViewClient })),
  { 
    ssr: false,
    loading: () => (
      <Card sx={{ p: 3, textAlign: 'center' }}>
        <Box sx={{ py: 5 }}>
          <Iconify 
            icon="eos-icons:loading" 
            width={48} 
            sx={{ 
              color: 'text.disabled',
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              }
            }} 
          />
          <Box sx={{ typography: 'h6', color: 'text.disabled', mt: 2 }}>
            페이지를 준비하고 있습니다...
          </Box>
        </Box>
      </Card>
    )
  }
);

// ----------------------------------------------------------------------

export function ReceiveAlc2DataInquiryView() {
  return (
    <>
      <CustomBreadcrumbs
        heading="서열수신현황 조회"
        links={[
          { name: '대시보드', href: paths.dashboard.root },
          { name: '서열수신현황 조회' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ReceiveAlc2DataInquiryViewClient />
    </>
  );
} 