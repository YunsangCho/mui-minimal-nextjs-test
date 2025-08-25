'use client';

import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { useBoolean } from 'src/hooks';
import { fDate } from 'src/utils/format-time';

// ----------------------------------------------------------------------

export function SpecTableRow({ row, selected, onSelectRow, onDeleteRow, onEditRow, dense = false }) {
  const router = useRouter();

  const { 
    CAR_TYPE, LINE_ID, ALC_CODE, TYPE, ITEM_CD, BODY_TYPE, 
    ETC_TEXT01, ETC_TEXT02, ETC_TEXT03, ETC_TEXT04, ETC_TEXT05, ETC_TEXT06, ETC_TEXT07,
    REMARK, INUSER, INDATE, UPTUSER, UPTDATE 
  } = row;

  const confirm = useBoolean();

  const handleEdit = () => {
    onEditRow(row);
  };

  const handleClick = () => {
    router.push(paths.dashboard.baseInfo.specInfo);
  };

  return (
    <>
      <TableRow 
        hover 
        selected={selected}
        sx={{
          height: dense ? 48 : 56,
          '& .MuiTableCell-root': {
            py: dense ? 0.5 : 1,
          }
        }}
      >
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onClick={onSelectRow} />
        </TableCell>

        <TableCell>
          <Typography
            noWrap
            variant="inherit"
            component={RouterLink}
            href={paths.dashboard.baseInfo.specInfo}
            sx={{ color: 'text.primary', cursor: 'pointer' }}
          >
            {CAR_TYPE}
          </Typography>
        </TableCell>

        <TableCell>{TYPE}</TableCell>

        <TableCell>{LINE_ID}</TableCell>
        
        <TableCell>{ALC_CODE}</TableCell>
        
        <TableCell>{ITEM_CD}</TableCell>
        
        <TableCell>{BODY_TYPE}</TableCell>
        
        <TableCell>{ETC_TEXT01}</TableCell>
        
        <TableCell>{ETC_TEXT02}</TableCell>
        
        <TableCell>{ETC_TEXT03}</TableCell>
        
        <TableCell>{ETC_TEXT04}</TableCell>
        
        <TableCell>{ETC_TEXT05}</TableCell>
        
        <TableCell>{ETC_TEXT06}</TableCell>
        
        <TableCell>{ETC_TEXT07}</TableCell>

        <TableCell>
          {REMARK && REMARK.length > 10 ? (
            <Tooltip title={REMARK} arrow placement="top">
              <Typography
                variant="inherit"
                sx={{
                  maxWidth: 100,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  cursor: 'help'
                }}
              >
                {REMARK.substring(0, 10)}...
              </Typography>
            </Tooltip>
          ) : (
            <Typography variant="inherit">
              {REMARK || ''}
            </Typography>
          )}
        </TableCell>

        <TableCell>{INUSER}</TableCell>

        <TableCell>
          <Typography noWrap variant="body2">
            {fDate(INDATE)}
          </Typography>
        </TableCell>

        <TableCell>{UPTUSER}</TableCell>

        <TableCell>
          <Typography noWrap variant="body2">
            {fDate(UPTDATE)}
          </Typography>
        </TableCell>

        <TableCell align="right">
          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Tooltip title="편집">
              <IconButton color="primary" onClick={handleEdit} size={dense ? 'small' : 'medium'}>
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>

            <Tooltip title="삭제">
              <IconButton color="error" onClick={confirm.onTrue} size={dense ? 'small' : 'medium'}>
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Tooltip>
          </Stack>
        </TableCell>
      </TableRow>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="삭제"
        content="이 항목을 삭제하시겠습니까?"
        action={
          <IconButton color="error" onClick={() => {
            onDeleteRow(row);
            confirm.onFalse();
          }}>
            <Iconify icon="solar:trash-bin-trash-bold" />
          </IconButton>
        }
      />
    </>
  );
}

SpecTableRow.propTypes = {
  onDeleteRow: PropTypes.func,
  onEditRow: PropTypes.func,
  onSelectRow: PropTypes.func,
  row: PropTypes.object,
  selected: PropTypes.bool,
  dense: PropTypes.bool,
}; 