'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

export function ReceiveAlc2DataTableRow({ row, rowNumber, selected, onDoubleClick, ...other }) {
  // PROD_DTTM을 날짜/시간으로 포맷팅 (YYYYMMDDHHMMSS 형식)
  const formatProdDttm = (prodDttm) => {
    if (!prodDttm) return '-';
    const str = prodDttm.toString();
    if (str.length >= 14) {
      const year = str.substring(0, 4);
      const month = str.substring(4, 6);
      const day = str.substring(6, 8);
      const hour = str.substring(8, 10);
      const minute = str.substring(10, 12);
      const second = str.substring(12, 14);
      return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    }
    return str;
  };

  // PROD_DATE를 날짜로 포맷팅 (YYYYMMDD 형식)
  const formatProdDate = (prodDate) => {
    if (!prodDate) return '-';
    const str = prodDate.toString();
    if (str.length >= 8) {
      const year = str.substring(0, 4);
      const month = str.substring(4, 6);
      const day = str.substring(6, 8);
      return `${year}-${month}-${day}`;
    }
    return str;
  };

  // WORK_FLAG 상태 표시
  const renderWorkFlag = (workFlag) => {
    const statusConfig = {
      'T': { color: 'success', label: '완료' },
      'F': { color: 'error', label: '미완료' },
      'P': { color: 'warning', label: '진행중' },
    };

    const config = statusConfig[workFlag] || { color: 'default', label: workFlag || '-' };
    
    return (
      <Chip
        variant="soft"
        size="small"
        color={config.color}
        label={config.label}
      />
    );
  };

  // 조립완료 상태 표시
  const renderAssemblyComplete = (assemblyComplete) => {
    const statusConfig = {
      '완료': { color: 'success', label: '완료' },
      '미완료': { color: 'error', label: '미완료' },
    };

    const config = statusConfig[assemblyComplete] || { color: 'default', label: assemblyComplete || '-' };
    
    return (
      <Chip
        variant="soft"
        size="small"
        color={config.color}
        label={config.label}
      />
    );
  };

  // DATA_SOURCE 표시
  const renderDataSource = (dataSource) => {
    const statusConfig = {
      'LIVE': { color: 'primary', label: '운영' },
      'BACKUP': { color: 'secondary', label: '백업' },
    };

    const config = statusConfig[dataSource] || { color: 'default', label: dataSource || '-' };
    
    return (
      <Chip
        variant="soft"
        size="small"
        color={config.color}
        label={config.label}
      />
    );
  };

  return (
    <TableRow hover selected={selected} onDoubleClick={onDoubleClick} {...other}>
      {/* No. */}
      <TableCell align="center">
        <Typography 
          variant="body2" 
          sx={{ 
            fontSize: { xs: '0.75rem', md: '0.875rem' },
            fontWeight: 500,
            color: 'text.secondary',
            lineHeight: 1.4
          }}
        >
          {rowNumber}
        </Typography>
      </TableCell>

      {/* 서열수신시각 */}
      <TableCell align="center">
        <Typography 
          variant="body2" 
          noWrap 
          sx={{ 
            fontSize: { xs: '0.75rem', md: '0.875rem' },
            lineHeight: 1.4
          }}
        >
          {formatProdDttm(row.PROD_DTTM)}
        </Typography>
      </TableCell>

      {/* 생산일자 */}
      <TableCell align="center">
        <Typography 
          variant="body2" 
          noWrap
          sx={{ 
            fontSize: { xs: '0.75rem', md: '0.875rem' },
            lineHeight: 1.4
          }}
        >
          {formatProdDate(row.PROD_DATE)}
        </Typography>
      </TableCell>

      {/* C/N */}
      <TableCell align="center">
        <Typography 
          variant="body2" 
          noWrap 
          sx={{ 
            fontFamily: 'monospace',
            fontSize: { xs: '0.75rem', md: '0.875rem' },
            lineHeight: 1.4
          }}
        >
          {row.COMMIT_NO}
        </Typography>
      </TableCell>

      {/* BODY_TYPE */}
      <TableCell align="center">
        <Typography 
          variant="body2" 
          noWrap
          sx={{ 
            fontSize: { xs: '0.75rem', md: '0.875rem' },
            lineHeight: 1.4
          }}
        >
          {row.BODY_TYPE}
        </Typography>
      </TableCell>

      {/* ALC_FRONT */}
      <TableCell align="center">
        <Typography 
          variant="body2" 
          noWrap
          sx={{ 
            fontSize: { xs: '0.75rem', md: '0.875rem' },
            lineHeight: 1.4
          }}
        >
          {row.ALC_FRONT}
        </Typography>
      </TableCell>

      {/* ALC_REAR */}
      <TableCell align="center">
        <Typography 
          variant="body2" 
          noWrap
          sx={{ 
            fontSize: { xs: '0.75rem', md: '0.875rem' },
            lineHeight: 1.4
          }}
        >
          {row.ALC_REAR}
        </Typography>
      </TableCell>

      {/* 외장색 */}
      <TableCell align="center">
        <Typography 
          variant="body2" 
          noWrap
          sx={{ 
            fontSize: { xs: '0.75rem', md: '0.875rem' },
            lineHeight: 1.4
          }}
        >
          {row.EXT_COLOR}
        </Typography>
      </TableCell>

      {/* BODY_NO */}
      <TableCell align="center">
        <Typography 
          variant="body2" 
          noWrap 
          sx={{ 
            fontFamily: 'monospace',
            fontWeight: 'bold',
            fontSize: { xs: '0.75rem', md: '0.875rem' },
            lineHeight: 1.4
          }}
        >
          {row.BODY_NO}
        </Typography>
      </TableCell>

      {/* VIN_NO */}
      <TableCell align="center">
        <Typography 
          variant="body2" 
          noWrap 
          sx={{ 
            fontFamily: 'monospace',
            fontWeight: 'bold',
            fontSize: { xs: '0.75rem', md: '0.875rem' },
            lineHeight: 1.4
          }}
        >
          {row.VIN_NO}
        </Typography>
      </TableCell>

      {/* 작업지시 */}
      <TableCell align="center">
        {renderWorkFlag(row.WORK_FLAG)}
      </TableCell>

      {/* 조립완료 */}
      <TableCell align="center">
        {renderAssemblyComplete(row.ASSEMBLY_COMPLETE)}
      </TableCell>

      {/* 데이터소스 */}
      <TableCell align="center">
        {renderDataSource(row.DATA_SOURCE)}
      </TableCell>
    </TableRow>
  );
}
