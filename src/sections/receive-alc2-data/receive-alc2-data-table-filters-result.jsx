'use client';

import PropTypes from 'prop-types';
import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';
import { fDate } from 'src/utils/format-time';

// ----------------------------------------------------------------------

export function ReceiveAlc2DataTableFiltersResult({
  filters,
  onFilters,
  onResetFilters,
  results,
  sx,
  ...other
}) {
  const handleRemoveKeyword = useCallback(
    (key) => {
      if (key === 'dateRange') {
        onFilters('startDate', null);
        onFilters('endDate', null);
      } else if (key === 'commitNoRange') {
        onFilters('commitNoStart', '');
        onFilters('commitNoEnd', '');
      } else {
        onFilters(key, '');
      }
    },
    [onFilters]
  );

  const handleRemoveDate = useCallback(() => {
    onFilters('startDate', null);
    onFilters('endDate', null);
  }, [onFilters]);

  const handleRemoveBodyType = useCallback(() => {
    onFilters('bodyType', '');
  }, [onFilters]);

  const handleRemoveCommitNoRange = useCallback(() => {
    onFilters('commitNoStart', '');
    onFilters('commitNoEnd', '');
  }, [onFilters]);

  return (
    <Stack spacing={1.5} sx={{ px: 1, py: 1, ...sx }} {...other}>
      <Box sx={{ typography: 'body2' }}>
        <strong>{results}</strong>
        <Box component="span" sx={{ color: 'text.secondary', ml: 0.25 }}>
          건의 결과가 검색되었습니다
        </Box>
      </Box>

      <Stack flexGrow={1} spacing={1} direction="row" flexWrap="wrap" alignItems="center">
        {filters.startDate && filters.endDate && (
          <Block label="생산일시:">
            <Chip
              size="small"
              label={`${fDate(filters.startDate)} - ${fDate(filters.endDate)}`}
              onDelete={handleRemoveDate}
              sx={{ maxWidth: 300 }}
            />
          </Block>
        )}

        {filters.bodyType && (
          <Block label="차체타입:">
            <Chip size="small" label={filters.bodyType} onDelete={handleRemoveBodyType} />
          </Block>
        )}

        {(filters.commitNoStart || filters.commitNoEnd) && (
          <Block label="COMMIT_NO:">
            <Chip
              size="small"
              label={`${filters.commitNoStart || '0'} - ${filters.commitNoEnd || '∞'}`}
              onDelete={handleRemoveCommitNoRange}
            />
          </Block>
        )}

        <Button
          color="error"
          onClick={onResetFilters}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
          sx={{ flexShrink: 0 }}
        >
          전체 초기화
        </Button>
      </Stack>
    </Stack>
  );
}

ReceiveAlc2DataTableFiltersResult.propTypes = {
  filters: PropTypes.object,
  onFilters: PropTypes.func,
  onResetFilters: PropTypes.func,
  results: PropTypes.number,
  sx: PropTypes.object,
};

// ----------------------------------------------------------------------

function Block({ label, children, sx, ...other }) {
  return (
    <Stack
      component={Paper}
      variant="outlined"
      spacing={1}
      direction="row"
      sx={{
        p: 1,
        borderRadius: 1,
        overflow: 'hidden',
        borderStyle: 'dashed',
        ...sx,
      }}
      {...other}
    >
      <Box component="span" sx={{ typography: 'subtitle2' }}>
        {label}
      </Box>

      <Stack spacing={1} direction="row" flexWrap="wrap">
        {children}
      </Stack>
    </Stack>
  );
}

Block.propTypes = {
  children: PropTypes.node,
  label: PropTypes.string,
  sx: PropTypes.object,
}; 