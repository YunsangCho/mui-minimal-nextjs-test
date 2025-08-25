'use client';

import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function CrossCheckTableFiltersResult({
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

  return (
    <Stack spacing={1.5} {...other}>
      <Box sx={{ typography: 'body2' }}>
        <strong>{results.length}</strong>
        <Box component="span" sx={{ color: 'text.secondary', ml: 0.25 }}>
          결과
        </Box>
      </Box>

      <Stack flexGrow={1} spacing={1} direction="row" flexWrap="wrap" alignItems="center">
        {!!filters.name && (
          <Block label="검색:">
            <Chip size="small" label={filters.name} onDelete={handleRemoveKeyword} />
          </Block>
        )}

        {filters.status !== 'all' && (
          <Block label="상태:">
            <Chip
              size="small"
              label={
                filters.status === 'active'
                  ? '활성화'
                  : filters.status === 'warning'
                  ? '주의'
                  : '비활성화'
              }
              onDelete={handleRemoveStatus}
            />
          </Block>
        )}

        <Button
          color="error"
          onClick={onResetFilters}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
        >
          필터 초기화
        </Button>
      </Stack>
    </Stack>
  );
}

CrossCheckTableFiltersResult.propTypes = {
  filters: PropTypes.object,
  onFilters: PropTypes.func,
  onResetFilters: PropTypes.func,
  results: PropTypes.array,
};

// ----------------------------------------------------------------------

function Block({ label, children, sx, ...other }) {
  return (
    <Stack
      component={Chip}
      variant="outlined"
      clickable={false}
      onDelete={null}
      sx={{
        m: 0,
        pl: 1,
        height: 36,
        borderRadius: 1,
        '& .MuiChip-label': {
          p: 0,
        },
        '& .MuiChip-deleteIcon': {
          opacity: 0.8,
          color: 'text.disabled',
        },
        ...sx,
      }}
      label={
        <Stack direction="row" alignItems="center" divider={<Box sx={{ mx: 1, width: 2, height: 24, bgcolor: 'divider' }} />}>
          <Box sx={{ typography: 'caption', color: 'text.secondary' }}>{label}</Box>
          {children}
        </Stack>
      }
      {...other}
    />
  );
}

Block.propTypes = {
  children: PropTypes.node,
  label: PropTypes.string,
  sx: PropTypes.object,
}; 