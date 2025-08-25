'use client';

import { useState, useCallback } from 'react';

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
  const [searchFilters, setSearchFilters] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [dense, setDense] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState(null);
  
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

  const handleFilters = useCallback(
    (name, value) => {
      setFilters({ [name]: value });
    },
    [setFilters]
  );

  const handleResetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setSearchFilters(null);
    setHasSearched(false);
  }, [setFilters]);

  const handleSearch = useCallback((serverFilters) => {
    if (currentSite) {
      setSearchFilters(serverFilters);
      setHasSearched(true);
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
    if (pagination?.totalPages) {
      handlePageChange(pagination.totalPages);
    }
  }, [handlePageChange, pagination?.totalPages]);

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
        if (downloadProgress.cancelled) {
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
        
        if (currentChunk === 1) {
          totalRecords = totalCount || 0;
          totalChunks = Math.ceil(totalRecords / chunkSize);
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
          break;
        }

        currentChunk++;
      }

      if (!downloadProgress.cancelled) {
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
  }, [searchFilters, currentSite, downloadProgress.cancelled]);

  const handleCancelDownload = useCallback(() => {
    setDownloadProgress(prev => ({ ...prev, cancelled: true }));
  }, []);

  const handleCloseDownload = useCallback(() => {
    setDownloadProgress(prev => ({ ...prev, open: false }));
  }, []);

  const renderTable = () => (
    <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <TableContainer sx={{ overflow: 'auto', maxHeight: 640, '&::-webkit-scrollbar': { width: 8, height: 8 }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 4 } }}>
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

  const renderPagination = () => {
    if (!pagination) return null;

    const { page, pageSize, totalCount, totalPages, hasNextPage, hasPreviousPage } = pagination;

    const startRecord = totalCount > 0 ? (page - 1) * pageSize + 1 : 0;
    const endRecord = Math.min(page * pageSize, totalCount);

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2, px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {`${startRecord}–${endRecord} / 전체 ${totalCount}`}
          </Typography>
          <FormControlLabel
            control={<Switch checked={dense} onChange={(e) => setDense(e.target.checked)} size="small" />}
            label="컴팩트 모드"
            sx={{ ml: 2 }}
          />
        </Box>

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
            {`${page}/${totalPages}`}
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

      {hasSearched && (
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box />
          <Button
            variant="contained"
            color="success"
            startIcon={<Iconify icon="eva:download-fill" />}
            onClick={handleExcelDownload}
            disabled={receiveAlc2DataLoading || receiveAlc2DataEmpty}
          >
            엑셀 다운로드
          </Button>
        </Box>
      )}

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
    </Card>
  );
}