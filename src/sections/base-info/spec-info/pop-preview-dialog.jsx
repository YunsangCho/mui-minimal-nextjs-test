'use client';

import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

const POP_SCREEN_OPTIONS = [
  { value: 'POP_F_Assembly_BarCode', label: 'Assembly BarCode (FR)' },
  { value: 'POP_F_Assembly_BarCode_RR', label: 'Assembly BarCode (RR)' },
  { value: 'POP_F_Monitoring_FR', label: 'Monitoring (FR)' },
  { value: 'POP_F_Monitoring_RR', label: 'Monitoring (RR)' },
  { value: 'POP_F_Picking_FR', label: 'Picking (FR)' },
  { value: 'POP_F_Picking_RR', label: 'Picking (RR)' },
];

// ----------------------------------------------------------------------

export function PopPreviewDialog({ open, onClose, data, filters }) {
  const [selectedScreen, setSelectedScreen] = useState('');
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);

  // 화면 타입 변경 시 컬럼 정보 로드
  const loadColumns = useCallback(async (screenType) => {
    if (!screenType) {
      setColumns([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/pop/columns?screenType=${screenType}`);
      const result = await response.json();
      
      if (response.ok) {
        setColumns(result.columns || []);
      } else {
        console.error('컬럼 정보 로드 실패:', result.error);
        setColumns([]);
      }
    } catch (error) {
      console.error('컬럼 정보 로드 오류:', error);
      setColumns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedScreen) {
      loadColumns(selectedScreen);
    }
  }, [selectedScreen, loadColumns]);

  const handleScreenChange = (event) => {
    setSelectedScreen(event.target.value);
  };

  const handleClose = () => {
    setSelectedScreen('');
    setColumns([]);
    onClose();
  };

  // 선택된 화면의 컬럼에 맞게 데이터 필터링
  const getFilteredData = () => {
    if (!columns.length || !data.length) return [];
    
    return data.map((row, index) => {
      const filteredRow = {};
      columns.forEach(col => {
        // COLUMN_NAME이 실제 데이터의 컬럼과 매칭되는지 확인
        const columnName = col.COLUMN_NAME;
        
        // 특정 컬럼에 고정값 설정
        if (columnName === 'WORKDATE') {
          filteredRow[columnName] = '00/00:00:00';
        } else if (columnName === 'CMNO') {
          // 0000부터 9999까지 순차적으로 할당 (4자리 패딩)
          filteredRow[columnName] = String(index).padStart(4, '0');
        } else if (columnName === 'EXT_COLOR') {
          filteredRow[columnName] = 'SWP';
        } else {
          // 데이터에 해당 컬럼이 존재하는지 확인하고, 없으면 공백으로 처리
          if (row.hasOwnProperty(columnName)) {
            filteredRow[columnName] = row[columnName] || '';
          } else {
            // 매칭되지 않는 컬럼은 공백으로 처리
            filteredRow[columnName] = '';
          }
        }
      });
      return filteredRow;
    });
  };

  const filteredData = getFilteredData();

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="xl"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          height: '90vh',
          maxHeight: '90vh',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          borderRadius: 2,
        },
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.7)', // 더 진한 배경
          backdropFilter: 'blur(4px)', // 블러 효과 추가
        }
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="material-symbols:preview" sx={{ color: 'primary.main' }} />
          <Typography variant="h6">POP 화면 미리보기</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 1 }}>
        <Stack spacing={3}>
          {/* 화면 선택 */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              POP 화면 선택
            </Typography>
            <TextField
              select
              fullWidth
              value={selectedScreen}
              onChange={handleScreenChange}
              placeholder="POP 화면을 선택하세요"
              size="small"
              sx={{ maxWidth: 400 }}
            >
              {POP_SCREEN_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Divider />

          {/* 필터 정보 표시 */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              적용된 필터
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              {filters.carType && (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  차종: <strong>{filters.carType}</strong>
                </Typography>
              )}
              {filters.type && (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  타입: <strong>{filters.type}</strong>
                </Typography>
              )}
              {filters.lineId && (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  라인: <strong>{filters.lineId}</strong>
                </Typography>
              )}
              {filters.name && (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  검색어: <strong>{filters.name}</strong>
                </Typography>
              )}
              {!filters.carType && !filters.type && !filters.lineId && !filters.name && (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  전체 데이터 ({data.length}건)
                </Typography>
              )}
            </Stack>
          </Box>

          {/* 미리보기 테이블 */}
          {selectedScreen && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                {POP_SCREEN_OPTIONS.find(opt => opt.value === selectedScreen)?.label} 미리보기
              </Typography>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : columns.length > 0 ? (
                <Paper
                  elevation={3}
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: '#1565c0', // 파란색 배경
                    maxHeight: '500px', // 최대 높이 설정
                  }}
                >
                  <Scrollbar sx={{ maxHeight: '500px' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {columns.map((column, index) => (
                            <TableCell
                              key={column.COLUMN_NAME}
                              sx={{
                                bgcolor: '#0d47a1', // 더 진한 파란색
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                borderRight: index < columns.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none',
                                py: 1.5,
                                px: 1,
                                minWidth: column.DISPLAY_WIDTH || 80,
                                textAlign: 'center',
                                position: 'sticky',
                                top: 0,
                                zIndex: 10,
                              }}
                            >
                              {column.DISPLAY_NAME || column.COLUMN_NAME}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredData.map((row, rowIndex) => (
                          <TableRow
                            key={rowIndex}
                            sx={{
                              '&:nth-of-type(odd)': {
                                bgcolor: 'rgba(255,255,255,0.1)',
                              },
                              '&:nth-of-type(even)': {
                                bgcolor: 'rgba(255,255,255,0.05)',
                              },
                            }}
                          >
                            {columns.map((column, colIndex) => (
                              <TableCell
                                key={column.COLUMN_NAME}
                                sx={{
                                  color: 'white',
                                  fontSize: '0.8rem',
                                  borderRight: colIndex < columns.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                                  py: 0.8,
                                  px: 1,
                                  textAlign: 'center',
                                }}
                              >
                                {row[column.COLUMN_NAME] || ''}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Scrollbar>
                  
                  <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.1)' }}>
                    <Typography variant="body2" sx={{ color: 'white', textAlign: 'center' }}>
                      총 {filteredData.length}건의 데이터가 표시됩니다.
                    </Typography>
                  </Box>
                </Paper>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    해당 화면의 컬럼 정보를 불러올 수 없습니다.
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {!selectedScreen && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Iconify 
                icon="material-symbols:display-settings" 
                sx={{ width: 64, height: 64, color: 'text.disabled', mb: 2 }} 
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                POP 화면을 선택하세요
              </Typography>
              <Typography variant="body2" color="text.disabled">
                위의 셀렉트 박스에서 미리보기할 POP 화면을 선택하면<br />
                해당 화면 형태로 데이터가 표시됩니다.
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} variant="outlined">
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  );
}

PopPreviewDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  data: PropTypes.array,
  filters: PropTypes.object,
}; 