'use client';

import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function CrossCheckTableToolbar({ filters, onFilters }) {
  return (
    <Stack
      spacing={2}
      alignItems={{ xs: 'flex-end', md: 'center' }}
      direction={{ xs: 'column', md: 'row' }}
      sx={{ p: 2.5, pr: { xs: 2.5, md: 1 } }}
    >
      <Stack
        alignItems="center"
        justifyContent="flex-end"
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 2, sm: 2 }}
        flexGrow={1}
      >
        <TextField
          value={filters.name}
          onChange={(event) => onFilters('name', event.target.value)}
          placeholder="검색..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="mingcute:search-line" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
          sx={{ width: { xs: 1, md: 260 } }}
        />
      </Stack>

      <Button
        variant="contained"
        startIcon={<Iconify icon="mingcute:add-line" />}
        sx={{ px: 3 }}
      >
        새 이종체크
      </Button>
    </Stack>
  );
}

CrossCheckTableToolbar.propTypes = {
  filters: PropTypes.object,
  onFilters: PropTypes.func,
}; 