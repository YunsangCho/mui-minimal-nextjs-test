'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';

import { useSetState } from 'src/hooks/use-set-state';
import { useWorkspace } from 'src/contexts/workspace-context';

import { Iconify } from 'src/components/iconify';

import { ReceiveAlc2DataTableToolbar } from '../receive-alc2-data-table-toolbar';
import { ReceiveAlc2DataTableRow } from '../receive-alc2-data-table-row';
import { ExcelDownloadProgress } from '../components/excel-download-progress';
import { ReceiveAlc2DataDetailDialog } from '../components/receive-alc2-data-detail-dialog';
import { useGetReceiveAlc2Data } from 'src/actions/receive-alc2-data';
import { endpoints, axiosInstance } from 'src/lib/axios';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'ROW_NUMBER', label: 'No.', width: 60 },
  { id: 'PROD_DTTM', label: '서열수신시각', width: 160 },
  { id: 'PROD_DATE', label: '생산일자', width: 120 },
  { id: 'COMMIT_NO', label: 'C/N', width: 100 },
  { id: 'BODY_TYPE', label: 'BODY_TYPE', width: 120 },
  { id: 'ALC_FRONT', label: 'ALC_FRONT', width: 120 },
  { id: 'ALC_REAR', label: 'ALC_REAR', width: 120 },
  { id: 'EXT_COLOR', label: '외장색', width: 120 },
  { id: 'BODY_NO', label: 'BODY_NO', width: 120 },
  { id: 'VIN_NO', label: 'VIN_NO', width: 160 },
  { id: 'WORK_FLAG', label: '작업지시', width: 120 },
  { id: 'ASSEMBLY_COMPLETE', label: '조립완료', width: 100 },
  { id: 'DATA_SOURCE', label: '데이터소스', width: 100 },
];

// 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const defaultFilters = {
  startDate: getTodayDate(),
  endDate: getTodayDate(),
  bodyType: '',
  commitNoStart: '',
  commitNoEnd: '',
  vinNo: '',
  bodyNo: '',
  page: 1,
  pageSize: 25,
};

// ----------------------------------------------------------------------

export function ReceiveAlc2DataInquiryViewClient() {
  const { currentSite } = useWorkspace();

  const { state: filters, setState: setFilters } = useSetState(defaultFilters);
  const [searchFilters, setSearchFilters] = useState(defaultFilters);
  const [hasSearched, setHasSearched] = useState(true);
  const [dense, setDense] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState(null);
  
  // 성능 최적화: totalCount 캐시
  const [cachedTotalCount, setCachedTotalCount] = useState(0);
  
  // 엑셀 다운로드 취소를 위한 ref
  const cancelDownloadRef = useRef(false);
  
  // 엑셀 다운로드 상태 관리
  const [downloadProgress, setDownloadProgress] = useState({
    open: false,
    progress: 0,
    currentChunk: 0,
    totalChunks: 0,
    totalRecords: 0,
    downloadedRecords: 0,
    status: 'preparing',
    data: [],
    cancelled: false
  });

  const dateError = filters.startDate && filters.endDate ? 
    new Date(filters.startDate) > new Date(filters.endDate) : false;

  const { receiveAlc2Data, receiveAlc2DataLoading, receiveAlc2DataEmpty, pagination } = useGetReceiveAlc2Data(searchFilters, currentSite);
  
  // 첫 페이지에서 totalCount 캐시 업데이트
  useEffect(() => {
    if (pagination?.totalCount && searchFilters.page === 1) {
      setCachedTotalCount(pagination.totalCount);
    }
  }, [pagination?.totalCount, searchFilters.page]);

  const handleFilters = useCallback(
    (name, value) => {
      setFilters({ [name]: value });
    },
    [setFilters]
  );

  const handleResetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setSearchFilters(defaultFilters);
    setHasSearched(true);
    setCachedTotalCount(0); // 캐시 초기화
  }, [setFilters]);

  const handleSearch = useCallback((serverFilters) => {
    if (currentSite) {
      setSearchFilters(serverFilters);
      setHasSearched(true);
      setCachedTotalCount(0); // 새로운 검색 시 캐시 초기화
    }
  }, [currentSite]);

  // 페이징 핸들러들
  const handlePageChange = useCallback((newPage) => {
    const updatedFilters = { ...searchFilters, page: newPage };
    setSearchFilters(updatedFilters);
  }, [searchFilters]);

  const handlePageSizeChange = useCallback((newPageSize) => {
    const updatedFilters = { ...searchFilters, pageSize: newPageSize, page: 1 };
    setSearchFilters(updatedFilters);
  }, [searchFilters]);

  const handleFirstPage = useCallback(() => {
    handlePageChange(1);
  }, [handlePageChange]);

  const handleLastPage = useCallback(() => {
    const totalPages = pagination?.totalPages || (cachedTotalCount > 0 ? Math.ceil(cachedTotalCount / (pagination?.pageSize || 25)) : 0);
    if (totalPages > 0) {
      handlePageChange(totalPages);
    }
  }, [handlePageChange, pagination?.totalPages, pagination?.pageSize, cachedTotalCount]);

  const handlePreviousPage = useCallback(() => {
    if (pagination?.page > 1) {
      handlePageChange(pagination.page - 1);
    }
  }, [handlePageChange, pagination?.page]);

  const handleNextPage = useCallback(() => {
    if (pagination?.hasNextPage) {
      handlePageChange(pagination.page + 1);
    }
  }, [handlePageChange, pagination?.hasNextPage, pagination?.page]);

  // 상세 모달 열기
  const handleRowDoubleClick = useCallback((row) => {
    setDetailRow(row);
    setDetailOpen(true);
  }, []);

  // 엑셀 다운로드
  const handleExcelDownload = useCallback(async () => {
    if (!searchFilters || !currentSite) {
      alert('검색 조건을 먼저 설정해주세요.');
      return;
    }

    try {
      // 취소 상태 초기화
      cancelDownloadRef.current = false;
      
      setDownloadProgress({
        open: true,
        progress: 0,
        currentChunk: 0,
        totalChunks: 0,
        totalRecords: 0,
        downloadedRecords: 0,
        status: 'preparing',
        data: [],
        cancelled: false
      });

      const chunkSize = 1000;
      let currentChunk = 1;
      let allData = [];
      let totalRecords = 0;
      let totalChunks = 0;
      let downloadedRecords = 0;

      while (true) {
        // ref를 사용하여 실시간 취소 상태 확인
        if (cancelDownloadRef.current) {
          console.log('📛 엑셀 다운로드 취소됨');
          break;
        }
        
        // 안전장치: 최대 50개 청크 (50,000건) 제한 제거
        if (currentChunk > 200) {
          console.warn(`최대 청크 수 도달: ${currentChunk}`);
          break;
        }

        const params = new URLSearchParams();
        params.append('site', currentSite);
        params.append('chunk', currentChunk.toString());
        params.append('chunkSize', chunkSize.toString());
        
        if (searchFilters.isDetailedSearch) {
          params.append('isDetailedSearch', 'true');
          if (searchFilters.vinNo) params.append('vinNo', searchFilters.vinNo);
          if (searchFilters.bodyNo) params.append('bodyNo', searchFilters.bodyNo);
        } else {
          if (searchFilters.startDate) params.append('startDate', searchFilters.startDate);
          if (searchFilters.endDate) params.append('endDate', searchFilters.endDate);
          if (searchFilters.bodyType) params.append('bodyType', searchFilters.bodyType);
          if (searchFilters.commitNoStart) params.append('commitNoStart', searchFilters.commitNoStart);
          if (searchFilters.commitNoEnd) params.append('commitNoEnd', searchFilters.commitNoEnd);
        }

        setDownloadProgress(prev => ({
          ...prev,
          status: 'downloading',
          currentChunk
        }));

        const response = await axiosInstance.get(`${endpoints.receiveAlc2Data.export}?${params.toString()}`);
        
        if (!response.data.success) {
          throw new Error(response.data.error || '데이터 조회 실패');
        }

        const { data, chunk, totalCount } = response.data;
        
        console.log(`📊 청크 ${currentChunk} 응답:`, {
          dataLength: data.length,
          hasMore: chunk.hasMore,
          totalCount: currentChunk === 1 ? totalCount : 'N/A',
          currentTotal: allData.length + data.length
        });
        
        if (currentChunk === 1) {
          totalRecords = totalCount || 0;
          totalChunks = Math.ceil(totalRecords / chunkSize);
          console.log(`📊 전체 레코드: ${totalRecords}, 예상 청크: ${totalChunks}`);
        }

        allData = [...allData, ...data];
        downloadedRecords += data.length;
        
        const progress = totalRecords > 0 ? (downloadedRecords / totalRecords) * 90 : 0;
        
        setDownloadProgress(prev => ({
          ...prev,
          progress,
          currentChunk,
          totalChunks,
          totalRecords,
          downloadedRecords,
          data: allData
        }));

        if (data.length === 0 || !chunk.hasMore || data.length < chunkSize) {
          console.log(`📊 다운로드 완료 - 이유:`, {
            dataEmpty: data.length === 0,
            noMore: !chunk.hasMore,
            partialChunk: data.length < chunkSize,
            totalDownloaded: allData.length
          });
          break;
        }

        currentChunk++;
      }

      if (!cancelDownloadRef.current) {
        setDownloadProgress(prev => ({
          ...prev,
          status: 'processing',
          progress: 95
        }));

        // 엑셀 파일 생성 및 다운로드
        const XLSX = await import('xlsx');
        const worksheet = XLSX.utils.json_to_sheet(allData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, '서열수신현황');

        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
        const fileName = `서열수신현황_${timestamp}.xlsx`;

        XLSX.writeFile(workbook, fileName);

        setDownloadProgress(prev => ({
          ...prev,
          status: 'completed',
          progress: 100
        }));

        setTimeout(() => {
          setDownloadProgress(prev => ({ ...prev, open: false }));
        }, 2000);
      }

    } catch (error) {
      console.error('엑셀 다운로드 오류:', error);
      setDownloadProgress(prev => ({
        ...prev,
        status: 'error',
        error: error.message
      }));
    }
  }, [searchFilters, currentSite]);

  const handleCancelDownload = useCallback(() => {
    console.log('🛑 엑셀 다운로드 취소 요청');
    cancelDownloadRef.current = true;
    setDownloadProgress(prev => ({ 
      ...prev, 
      cancelled: true,
      status: 'cancelled' 
    }));
  }, []);

  const handleCloseDownload = useCallback(() => {
    setDownloadProgress(prev => ({ ...prev, open: false }));
  }, []);

  const renderTable = () => {
    // 캐시된 totalCount 사용으로 페이지 넘기기 시 성능 향상
    const totalCount = pagination?.totalCount || cachedTotalCount;
    const startRecord = totalCount > 0 ? ((pagination?.page || 1) - 1) * (pagination?.pageSize || 25) + 1 : 0;
    const endRecord = Math.min((pagination?.page || 1) * (pagination?.pageSize || 25), totalCount || 0);

    return (
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {/* 조회건수 표시 및 버튼 영역 */}
        <Box sx={{ 
          p: 2, 
          borderBottom: '1px solid', 
          borderColor: 'divider', 
          bgcolor: 'grey.50',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* 좌측: 조회결과 텍스트 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              bgcolor: 'primary.main' 
            }} />
            <Typography variant="body2" sx={{ 
              fontWeight: 600, 
              color: 'text.primary',
              fontSize: '0.875rem'
            }}>
              조회 결과
            </Typography>
            <Typography variant="body2" sx={{ 
              color: 'text.secondary',
              fontSize: '0.875rem'
            }}>
              {`${startRecord}–${endRecord}`}
            </Typography>
            <Typography variant="body2" sx={{ 
              color: 'text.disabled',
              fontSize: '0.875rem'
            }}>
              /
            </Typography>
            <Typography variant="body2" sx={{ 
              fontWeight: 500,
              color: 'primary.main',
              fontSize: '0.875rem'
            }}>
              {`전체 ${totalCount || 0}건`}
            </Typography>
          </Box>
          
          {/* 우측: 버튼 영역 */}
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<Iconify icon="eva:download-fill" />}
            onClick={handleExcelDownload}
            disabled={receiveAlc2DataLoading || receiveAlc2DataEmpty}
            sx={{ minWidth: 120 }}
          >
            엑셀 다운로드
          </Button>
        </Box>
        
        <TableContainer sx={{ overflow: 'auto', maxHeight: 384, '&::-webkit-scrollbar': { width: 8, height: 8 }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 4 } }}>
          <Table size={dense ? 'small' : 'medium'} stickyHeader>
          <TableHead>
            <TableRow>
              {TABLE_HEAD.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  align="center"
                  sx={{ fontWeight: 'bold', bgcolor: 'background.neutral' }}
                >
                  {headCell.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {receiveAlc2Data.map((row, index) => (
              <ReceiveAlc2DataTableRow
                key={`${row.PROD_DTTM}-${row.COMMIT_NO}-${index}`}
                row={row}
                rowNumber={(pagination?.page - 1) * (pagination?.pageSize || 25) + index + 1}
                onDoubleClick={() => handleRowDoubleClick(row)}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
    );
  };

  const renderPagination = () => {
    if (!pagination) return null;

    const { page, pageSize, hasNextPage, hasPreviousPage } = pagination;
    
    // 캐시된 totalCount 사용으로 페이징 연속성 보장
    const displayTotalCount = pagination.totalCount || cachedTotalCount;
    const calculatedTotalPages = displayTotalCount > 0 ? Math.ceil(displayTotalCount / pageSize) : 0;

    const startRecord = displayTotalCount > 0 ? (page - 1) * pageSize + 1 : 0;
    const endRecord = Math.min(page * pageSize, displayTotalCount);

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2, px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {`${startRecord}–${endRecord} / 전체 ${displayTotalCount}`}
          </Typography>
          <FormControlLabel
            control={<Switch checked={dense} onChange={(e) => setDense(e.target.checked)} size="small" />}
            label="컴팩트 모드"
            sx={{ ml: 2 }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(e.target.value)}
              displayEmpty
              sx={{ height: 32 }}
            >
              <MenuItem value={25}>25건씩 조회</MenuItem>
              <MenuItem value={50}>50건씩 조회</MenuItem>
              <MenuItem value={100}>100건씩 조회</MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="첫 페이지">
            <IconButton onClick={handleFirstPage} size="small" disabled={!hasPreviousPage}>
              <Iconify icon="material-symbols:first-page" />
            </IconButton>
          </Tooltip>
          <Tooltip title="이전 페이지">
            <IconButton onClick={handlePreviousPage} size="small" disabled={!hasPreviousPage}>
              <Iconify icon="material-symbols:chevron-left" />
            </IconButton>
          </Tooltip>
          
          <Typography variant="body2" sx={{ mx: 2, minWidth: 60, textAlign: 'center' }}>
            {`${page}/${calculatedTotalPages > 0 ? calculatedTotalPages : '?'}`}
          </Typography>
          
          <Tooltip title="다음 페이지">
            <IconButton onClick={handleNextPage} size="small" disabled={!hasNextPage}>
              <Iconify icon="material-symbols:chevron-right" />
            </IconButton>
          </Tooltip>
          <Tooltip title="마지막 페이지">
            <IconButton onClick={handleLastPage} size="small" disabled={!hasNextPage}>
              <Iconify icon="material-symbols:last-page" />
            </IconButton>
          </Tooltip>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Card>
      <ReceiveAlc2DataTableToolbar
        filters={filters}
        onFilters={handleFilters}
        onSearch={handleSearch}
        onResetFilters={handleResetFilters}
        dateError={dateError}
        currentSite={currentSite}
      />



      {hasSearched && renderTable()}
      {hasSearched && renderPagination()}

      <ReceiveAlc2DataDetailDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        row={detailRow}
      />

      <ExcelDownloadProgress
        open={downloadProgress.open}
        progress={downloadProgress.progress}
        currentChunk={downloadProgress.currentChunk}
        totalChunks={downloadProgress.totalChunks}
        totalRecords={downloadProgress.totalRecords}
        downloadedRecords={downloadProgress.downloadedRecords}
        status={downloadProgress.status}
        onCancel={downloadProgress.status === 'downloading' ? handleCancelDownload : null}
        onClose={handleCloseDownload}
      />

      {/* 조회 중 로딩 딤 처리 */}
      <Backdrop
        sx={{ 
          zIndex: (theme) => theme.zIndex.modal + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
        }}
        open={receiveAlc2DataLoading}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: 2,
            borderRadius: 1,
          }}
        >
          <CircularProgress size={28} />
          <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
            조회 중...
          </Typography>
        </Box>
      </Backdrop>
    </Card>
  );
}