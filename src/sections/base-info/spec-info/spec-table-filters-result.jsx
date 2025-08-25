'use client';

import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function SpecTableFiltersResult({
  filters,
  onFilters,
  onResetFilters,
  results,
  ...other
}) {
  const handleRemoveKeyword = () => {
    onFilters('name', '');
  };

  const handleRemoveStatus = () => {
    onFilters('status', 'all');
  };

  const handleRemoveCarType = () => {
    onFilters('carType', '');
    // 차종 제거 시 타입도 초기화
    if (filters.type) {
      onFilters('type', '');
    }
  };

  const handleRemoveType = () => {
    onFilters('type', '');
  };

  const hasActiveFilters = !!(filters.name || filters.carType || filters.type || (filters.status && filters.status !== 'all'));

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        mx: 2,
        mb: 1,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: (theme) => `1px solid ${theme.palette.divider}`,
        ...other.sx,
      }}
      {...other}
    >
      {/* 결과 헤더 */}
      <Stack 
        direction="row" 
        alignItems="center" 
        justifyContent="space-between"
        sx={{ mb: hasActiveFilters ? 2 : 0 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify 
            icon="material-symbols:search-insights" 
            sx={{ 
              color: 'primary.main',
              width: 20,
              height: 20
            }} 
          />
          <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 600 }}>
            검색 결과
          </Typography>
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              typography: 'caption',
              fontWeight: 600,
            }}
          >
            {results.length.toLocaleString()}건
          </Box>
        </Stack>

        {hasActiveFilters && (
          <Button
            color="error"
            variant="outlined"
            size="small"
            onClick={onResetFilters}
            startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
            sx={{
              borderRadius: 1.5,
              px: 2,
              '&:hover': {
                bgcolor: 'error.main',
                color: 'error.contrastText',
                borderColor: 'error.main',
              }
            }}
          >
            전체 초기화
          </Button>
        )}
      </Stack>

      {/* 활성 필터 표시 */}
      {hasActiveFilters && (
        <>
          <Divider sx={{ mb: 2 }} />
          
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Iconify 
              icon="material-symbols:filter-alt" 
              sx={{ 
                color: 'text.secondary',
                width: 16,
                height: 16
              }} 
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              적용된 필터:
            </Typography>
          </Stack>

          <Stack direction="row" flexWrap="wrap" spacing={1} alignItems="center">
            {!!filters.carType && (
              <FilterChip
                icon="material-symbols:directions-car"
                label="차종"
                value={filters.carType}
                onDelete={handleRemoveCarType}
                color="primary"
              />
            )}

            {!!filters.type && (
              <FilterChip
                icon="material-symbols:category-outline"
                label="타입"
                value={filters.type}
                onDelete={handleRemoveType}
                color="secondary"
              />
            )}

            {!!filters.name && (
              <FilterChip
                icon="mingcute:search-line"
                label="검색어"
                value={filters.name}
                onDelete={handleRemoveKeyword}
                color="info"
              />
            )}

            {filters.status !== 'all' && (
              <FilterChip
                icon="material-symbols:toggle-on"
                label="상태"
                value={
                  filters.status === 'active'
                    ? '활성화'
                    : filters.status === 'pending'
                    ? '검토중'
                    : '비활성화'
                }
                onDelete={handleRemoveStatus}
                color="warning"
              />
            )}

            {/* LINE_ID 필터 */}
            {filters.lineId && (
              <Chip
                size="small"
                label={
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Iconify icon="mdi:factory" sx={{ width: 14, height: 14 }} />
                    <Typography variant="caption">라인: {filters.lineId}</Typography>
                  </Stack>
                }
                onDelete={() => onFilters('lineId', '')}
                color="success"
                variant="outlined"
                sx={{
                  borderColor: 'success.main',
                  color: 'success.main',
                  '& .MuiChip-deleteIcon': {
                    color: 'success.main',
                    '&:hover': { color: 'success.dark' }
                  }
                }}
              />
            )}
          </Stack>
        </>
      )}
    </Paper>
  );
}

SpecTableFiltersResult.propTypes = {
  filters: PropTypes.object,
  onFilters: PropTypes.func,
  onResetFilters: PropTypes.func,
  results: PropTypes.array,
};

// ----------------------------------------------------------------------

function FilterChip({ icon, label, value, onDelete, color = 'default' }) {
  return (
    <Chip
      variant="outlined"
      size="small"
      color={color}
      onDelete={onDelete}
      sx={{
        height: 32,
        borderRadius: 2,
        bgcolor: (theme) => `${theme.palette[color].main}08`,
        border: (theme) => `1px solid ${theme.palette[color].main}30`,
        '& .MuiChip-label': {
          px: 1,
          py: 0.5,
          fontWeight: 500,
        },
        '& .MuiChip-deleteIcon': {
          width: 16,
          height: 16,
          color: (theme) => theme.palette[color].main,
          '&:hover': {
            color: (theme) => theme.palette[color].dark,
          }
        },
        '&:hover': {
          bgcolor: (theme) => `${theme.palette[color].main}15`,
          borderColor: (theme) => `${theme.palette[color].main}50`,
        }
      }}
      label={
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Iconify 
            icon={icon} 
            sx={{ 
              width: 14, 
              height: 14,
              color: (theme) => theme.palette[color].main
            }} 
          />
          <Typography variant="caption" sx={{ fontWeight: 500 }}>
            {label}:
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              maxWidth: 100,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: 600
            }}
          >
            {value}
          </Typography>
        </Stack>
      }
    />
  );
}

FilterChip.propTypes = {
  icon: PropTypes.string,
  label: PropTypes.string,
  value: PropTypes.string,
  onDelete: PropTypes.func,
  color: PropTypes.string,
}; 