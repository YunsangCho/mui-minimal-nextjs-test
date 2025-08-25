import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import TablePagination from '@mui/material/TablePagination';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { Iconify } from '../iconify';

// ----------------------------------------------------------------------

export function TablePaginationCustom({
  sx,
  dense,
  onChangeDense,
  rowsPerPageOptions = [5, 10, 25],
  ...other
}) {
  return (
    <Box sx={[{ position: 'relative' }, ...(Array.isArray(sx) ? sx : [sx])]}>
      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        {...other}
        sx={{ borderTopColor: 'transparent' }}
      />

      {onChangeDense && (
        <Box
          sx={{
            pl: 2,
            py: 1.5,
            top: 0,
            position: { sm: 'absolute' },
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify 
              icon="material-symbols:density-small" 
              sx={{ 
                width: 18, 
                height: 18,
                color: dense ? 'primary.main' : 'text.disabled'
              }} 
            />
            <Typography 
              variant="body2" 
              sx={{ 
                color: dense ? 'text.primary' : 'text.disabled',
                fontWeight: dense ? 500 : 400,
                transition: 'all 0.2s ease-in-out'
              }}
            >
              컴팩트 모드
            </Typography>
            <Switch
              checked={dense}
              onChange={onChangeDense}
              size="small"
              sx={{
                '& .MuiSwitch-switchBase': {
                  '&.Mui-checked': {
                    color: 'primary.main',
                    '& + .MuiSwitch-track': {
                      bgcolor: 'primary.main',
                      opacity: 0.8,
                    },
                  },
                },
                '& .MuiSwitch-track': {
                  bgcolor: dense ? 'primary.main' : 'grey.400',
                  opacity: dense ? 0.8 : 0.4,
                  transition: 'all 0.2s ease-in-out',
                },
                '& .MuiSwitch-thumb': {
                  boxShadow: (theme) => theme.customShadows.z4,
                  transition: 'all 0.2s ease-in-out',
                },
              }}
              slotProps={{ 
                input: { id: 'dense-switch' },
              }}
            />
          </Stack>
        </Box>
      )}
    </Box>
  );
}
