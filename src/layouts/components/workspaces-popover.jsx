'use client';

import { useState, useCallback } from 'react';
import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import Button, { buttonClasses } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomPopover } from 'src/components/custom-popover';
import { useWorkspace } from 'src/contexts/workspace-context';

// ----------------------------------------------------------------------

export function WorkspacesPopover({ sx, ...other }) {
  const mediaQuery = 'sm';
  const { open, anchorEl, onClose, onOpen } = usePopover();
  
  // 워크스페이스 컨텍스트 사용
  const { 
    currentSite, 
    changeSite, 
    loading, 
    availableSites,
    getCurrentSiteInfo 
  } = useWorkspace();
  
  // 현재 선택된 워크스페이스 정보
  const currentWorkspace = getCurrentSiteInfo();

  const handleChangeWorkspace = useCallback(
    async (newWorkspace) => {
      console.log('=== 워크스페이스 변경 시작 ===');
      console.log('이전 현장:', currentSite);
      console.log('새 현장:', newWorkspace.id, newWorkspace.name);
      
      try {
        await changeSite(newWorkspace.id);
        console.log('워크스페이스 변경 완료');
        onClose();
      } catch (error) {
        console.error('워크스페이스 변경 오류:', error);
      }
    },
    [changeSite, onClose, currentSite]
  );

  const buttonBg = {
    height: 1,
    zIndex: -1,
    opacity: 0,
    content: "''",
    borderRadius: 1,
    position: 'absolute',
    visibility: 'hidden',
    bgcolor: 'action.hover',
    width: 'calc(100% + 8px)',
    transition: (theme) =>
      theme.transitions.create(['opacity', 'visibility'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.shorter,
      }),
    ...(open && {
      opacity: 1,
      visibility: 'visible',
    }),
  };

  const renderButton = () => (
    <ButtonBase
      disableRipple
      onClick={onOpen}
      disabled={loading}
      sx={[
        {
          py: 0.5,
          gap: { xs: 0.5, [mediaQuery]: 1 },
          '&::before': buttonBg,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {loading ? (
        <CircularProgress size={24} />
      ) : (
        <Iconify 
          icon={currentWorkspace?.logo || 'mdi:factory'}
          sx={{ 
            width: 24, 
            height: 24, 
            borderRadius: '50%',
            bgcolor: 'primary.lighter',
            color: 'primary.main',
            p: 0.5
          }}
        />
      )}

      <Box
        component="span"
        sx={{ typography: 'subtitle2', display: { xs: 'none', [mediaQuery]: 'inline-flex' } }}
      >
        {currentWorkspace?.name || '현장 선택'}
      </Box>

      <Label
        color={
          currentWorkspace?.plan === 'Production' ? 'success' : 
          currentWorkspace?.plan === 'Quality' ? 'warning' : 
          currentWorkspace?.plan === 'Material' ? 'info' : 
          'default'
        }
        sx={{
          height: 22,
          cursor: 'inherit',
          display: { xs: 'none', [mediaQuery]: 'inline-flex' },
        }}
      >
        {currentWorkspace?.plan || 'Active'}
      </Label>

      <Iconify width={16} icon="carbon:chevron-sort" sx={{ color: 'text.disabled' }} />
    </ButtonBase>
  );

  const renderMenuList = () => (
    <CustomPopover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      slotProps={{
        arrow: { placement: 'top-left' },
        paper: { sx: { mt: 0.5, ml: -1.55, width: 280 } },
      }}
    >
      <Scrollbar sx={{ maxHeight: 320 }}>
        <MenuList>
          {availableSites.map((option) => (
            <MenuItem
              key={option.id}
              selected={option.id === currentSite}
              onClick={() => handleChangeWorkspace(option)}
              disabled={loading}
              sx={{ height: 56, px: 2 }}
            >
              <Iconify 
                icon={option.logo || 'mdi:factory'}
                sx={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%',
                  bgcolor: 'primary.lighter',
                  color: 'primary.main',
                  p: 0.5,
                  mr: 2
                }}
              />

              <Box sx={{ flexGrow: 1 }}>
                <Typography
                  noWrap
                  component="div"
                  variant="subtitle2"
                  sx={{ fontWeight: 'fontWeightMedium' }}
                >
                  {option.name}
                </Typography>
                <Typography
                  noWrap
                  component="div"
                  variant="caption"
                  sx={{ color: 'text.secondary' }}
                >
                  {option.description || option.location}
                </Typography>
              </Box>

              <Label 
                color={
                  option.plan === 'Production' ? 'success' : 
                  option.plan === 'Quality' ? 'warning' : 
                  option.plan === 'Material' ? 'info' : 
                  'default'
                }
                size="small"
              >
                {option.plan || 'Active'}
              </Label>
            </MenuItem>
          ))}
        </MenuList>
      </Scrollbar>

      <Divider sx={{ my: 0.5, borderStyle: 'dashed' }} />

      {/* 현장 정보 표시 */}
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">
          현재 현장: {currentWorkspace?.name || '선택된 현장 없음'}
        </Typography>
        <br />
        <Typography variant="caption" color="text.secondary">
          현장 코드: {currentWorkspace?.code || 'N/A'}
        </Typography>
        <br />
        <Typography variant="caption" color="text.secondary">
          DB 연결 상태: {loading ? '변경 중...' : '연결됨'}
        </Typography>
        <br />
        <Typography variant="caption" color="text.secondary">
          접근 가능한 현장: {availableSites.length}개
        </Typography>
      </Box>
    </CustomPopover>
  );

  return (
    <>
      {renderButton()}
      {renderMenuList()}
    </>
  );
}
