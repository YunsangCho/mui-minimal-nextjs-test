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
import { Label } from 'src/components/label';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { useBoolean } from 'src/hooks';
import { fDate } from 'src/utils/format-time';

// ----------------------------------------------------------------------

export function CrossCheckTableRow({ row, selected, onSelectRow, onDeleteRow }) {
  const router = useRouter();

  const { id, checkCode, checkName, category, status, priority, updatedAt } = row;

  const confirm = useBoolean();

  const handleClick = () => {
    router.push(paths.dashboard.baseInfo.crossCheck);
  };

  return (
    <>
      <TableRow hover selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onClick={onSelectRow} />
        </TableCell>

        <TableCell sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            noWrap
            variant="inherit"
            component={RouterLink}
            href={paths.dashboard.baseInfo.crossCheck}
            sx={{ color: 'text.primary', cursor: 'pointer' }}
          >
            {checkCode}
          </Typography>
        </TableCell>

        <TableCell>{checkName}</TableCell>

        <TableCell align="center">{category}</TableCell>

        <TableCell align="center">
          <Label
            variant="soft"
            color={
              (priority === '높음' && 'error') ||
              (priority === '중간' && 'warning') ||
              'info'
            }
          >
            {priority}
          </Label>
        </TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={
              (status === 'active' && 'success') ||
              (status === 'warning' && 'warning') ||
              'error'
            }
          >
            {status === 'active' && '활성화'}
            {status === 'warning' && '주의'}
            {status === 'inactive' && '비활성화'}
          </Label>
        </TableCell>

        <TableCell>
          <Typography noWrap variant="body2">
            {fDate(updatedAt)}
          </Typography>
        </TableCell>

        <TableCell align="right">
          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Tooltip title="편집">
              <IconButton color="primary" onClick={handleClick}>
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>

            <Tooltip title="삭제">
              <IconButton color="error" onClick={confirm.onTrue}>
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
            onDeleteRow();
            confirm.onFalse();
          }}>
            <Iconify icon="solar:trash-bin-trash-bold" />
          </IconButton>
        }
      />
    </>
  );
}

CrossCheckTableRow.propTypes = {
  onDeleteRow: PropTypes.func,
  onSelectRow: PropTypes.func,
  row: PropTypes.object,
  selected: PropTypes.bool,
}; 