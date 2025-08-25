'use client';

import PropTypes from 'prop-types';

import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import TableContainer from '@mui/material/TableContainer';

import { Scrollbar } from 'src/components/scrollbar';
import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

const TABLE_COLUMNS = [
  { id: 'CAR_TYPE', label: 'CAR_TYPE', width: 100 },
  { id: 'TYPE', label: 'TYPE', width: 120 },
  { id: 'LINE_ID', label: 'LINE_ID', width: 100 },
  { id: 'ALC_CODE', label: 'ALC_CODE', width: 120 },
  { id: 'ITEM_CD', label: 'ITEM_CD', width: 140 },
  { id: 'BODY_TYPE', label: 'BODY_TYPE', width: 100 },
  { id: 'ETC_TEXT01', label: 'ETC_TEXT01', width: 120 },
  { id: 'ETC_TEXT02', label: 'ETC_TEXT02', width: 120 },
  { id: 'ETC_TEXT03', label: 'ETC_TEXT03', width: 120 },
  { id: 'ETC_TEXT04', label: 'ETC_TEXT04', width: 120 },
  { id: 'ETC_TEXT05', label: 'ETC_TEXT05', width: 120 },
  { id: 'ETC_TEXT06', label: 'ETC_TEXT06', width: 120 },
  { id: 'ETC_TEXT07', label: 'ETC_TEXT07', width: 120 },
  { id: 'REMARK', label: 'REMARK', width: 200 },
  { id: 'INUSER', label: 'INUSER', width: 120 },
  { id: 'INDATE', label: 'INDATE', width: 180 },
  { id: 'UPTUSER', label: 'UPTUSER', width: 120 },
  { id: 'UPTDATE', label: 'UPTDATE', width: 180 },
];

// ----------------------------------------------------------------------

export function DataTable({ data }) {
  return (
    <Scrollbar>
      <TableContainer sx={{ minWidth: 1000, position: 'relative' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {TABLE_COLUMNS.map((column) => (
                <TableCell
                  key={column.id}
                  align="left"
                  sx={{ width: column.width, whiteSpace: 'nowrap' }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {data.map((row, index) => (
              <TableRow key={`${row.id || index}`} hover>
                <TableCell>{row.CAR_TYPE}</TableCell>
                <TableCell>{row.TYPE}</TableCell>
                <TableCell>{row.LINE_ID}</TableCell>
                <TableCell>{row.ALC_CODE}</TableCell>
                <TableCell>{row.ITEM_CD}</TableCell>
                <TableCell>{row.BODY_TYPE}</TableCell>
                <TableCell>{row.ETC_TEXT01}</TableCell>
                <TableCell>{row.ETC_TEXT02}</TableCell>
                <TableCell>{row.ETC_TEXT03}</TableCell>
                <TableCell>{row.ETC_TEXT04}</TableCell>
                <TableCell>{row.ETC_TEXT05}</TableCell>
                <TableCell>{row.ETC_TEXT06}</TableCell>
                <TableCell>{row.ETC_TEXT07}</TableCell>
                <TableCell>{row.REMARK}</TableCell>
                <TableCell>{row.INUSER}</TableCell>
                <TableCell>{row.INDATE}</TableCell>
                <TableCell>{row.UPTUSER}</TableCell>
                <TableCell>{row.UPTDATE}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Scrollbar>
  );
}

DataTable.propTypes = {
  data: PropTypes.array,
}; 