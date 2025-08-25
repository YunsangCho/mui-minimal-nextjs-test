'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { varAlpha } from 'src/utils/alpha';
import { useBoolean } from 'src/hooks';
import { useWorkspace } from 'src/contexts/workspace-context';
import * as XLSX from 'xlsx';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Backdrop from '@mui/material/Backdrop';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';
import { SPEC_STATUS_OPTIONS } from 'src/sections/base-info/spec-info/_mock';
import { _mock } from 'src/_mock';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  rowInPage,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
  TableSkeleton,
} from 'src/components/table';

import { SpecTableRow } from '../spec-info/spec-table-row';
import { SpecTableToolbar } from '../spec-info/spec-table-toolbar';
import { SpecTableFiltersResult } from '../spec-info/spec-table-filters-result';
import { ExcelUploadDialog } from '../spec-info/excel-upload-dialog';
import { SpecEditDialog } from '../spec-info/spec-edit-dialog';
import { SpecCreateDialog } from '../spec-info/spec-create-dialog';
import { PopPreviewDialog } from '../spec-info/pop-preview-dialog';

import { useGetSpecs, deleteSpec, uploadSpecExcel, updateSpec, createSpec } from 'src/actions/spec';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [{ value: 'all', label: '전체' }];

const CAR_TYPE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'JA', label: 'JA' },
  { value: 'KA', label: 'KA' },
  { value: 'LA', label: 'LA' },
];

const LINE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'FR01', label: 'FR01' },
  { value: 'RR01', label: 'RR01' },
];

const TYPE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'JAPE2STD', label: 'JAPE2STD' },
  { value: 'JAPE2GT', label: 'JAPE2GT' },
  { value: 'KAPE1STD', label: 'KAPE1STD' },
];

const defaultFilters = {
  name: '',
  carType: '',
  type: '',
  lineId: '',
};

const TABLE_HEAD = [
  { id: 'CAR_TYPE', label: 'CAR_TYPE', width: 120 },
  { id: 'TYPE', label: 'TYPE', width: 120 },
  { id: 'LINE_ID', label: 'LINE_ID', width: 120 },
  { id: 'ALC_CODE', label: 'ALC_CODE', width: 120 },
  { id: 'ITEM_CD', label: 'ITEM_CD', width: 140 },
  { id: 'BODY_TYPE', label: 'BODY_TYPE', width: 100 },
  { id: 'ETC_TEXT01', label: 'ETC_TEXT01', width: 150 },
  { id: 'ETC_TEXT02', label: 'ETC_TEXT02', width: 150 },
  { id: 'ETC_TEXT03', label: 'ETC_TEXT03', width: 150 },
  { id: 'ETC_TEXT04', label: 'ETC_TEXT04', width: 150 },
  { id: 'ETC_TEXT05', label: 'ETC_TEXT05', width: 150 },
  { id: 'ETC_TEXT06', label: 'ETC_TEXT06', width: 150 },
  { id: 'ETC_TEXT07', label: 'ETC_TEXT07', width: 150 },
  { id: 'REMARK', label: 'REMARK', width: 200 },
  { id: 'INUSER', label: 'INUSER', width: 120 },
  { id: 'INDATE', label: 'INDATE', width: 180 },
  { id: 'UPTUSER', label: 'UPTUSER', width: 120 },
  { id: 'UPTDATE', label: 'UPTDATE', width: 180 },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function SpecInfoListView() {
  const table = useTable();
  const { currentSite } = useWorkspace();

  const confirmDialog = useBoolean();
  const excelUploadDialog = useBoolean();
  const editDialog = useBoolean();
  const createDialog = useBoolean();
  const popPreviewDialog = useBoolean();
  
  // filters 상태를 먼저 초기화
  const [filters, setFilters] = useState(defaultFilters);
  const [tableData, setTableData] = useState([]);
  
  const { specs, specsLoading, specsError, specsEmpty, specsRefetch } = useGetSpecs(currentSite, filters);
  
  // 디버깅 로그 추가
  console.log('=== useGetSpecs 상태 ===');
  console.log('currentSite:', currentSite);
  console.log('filters:', filters);
  console.log('specs 길이:', specs?.length || 0);
  console.log('specsLoading:', specsLoading);
  console.log('specsError:', specsError);
  console.log('specsEmpty:', specsEmpty);
  
  // 필터 변경 감지
  const prevFiltersRef = useRef(filters);
  useEffect(() => {
    const filtersChanged = JSON.stringify(prevFiltersRef.current) !== JSON.stringify(filters);
    if (filtersChanged && currentSite) {
      console.log('=== 필터 변경 감지 ===');
      console.log('이전 필터:', prevFiltersRef.current);
      console.log('현재 필터:', filters);
      prevFiltersRef.current = filters;
    }
  }, [filters, currentSite]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingData, setEditingData] = useState(null);

  // 복합키로 고유 ID 생성 함수
  const getRowKey = useCallback((row) => {
    return `${row.CAR_TYPE}|${row.LINE_ID}|${row.ALC_CODE}|${row.TYPE}|${row.ITEM_CD}`;
  }, []);

  useEffect(() => {
    console.log('=== specs 데이터 변경 ===');
    console.log('specs:', specs);
    console.log('specs 타입:', typeof specs);
    console.log('specs 배열인가:', Array.isArray(specs));
    console.log('specs 길이:', specs?.length);
    
    if (Array.isArray(specs)) {
      console.log('tableData 설정:', specs.length, '건');
      setTableData(specs);
    } else {
      console.log('specs가 배열이 아님, 빈 배열로 설정');
      setTableData([]);
    }
  }, [specs]);

  // 현장이 변경될 때 필터 초기화 및 데이터 새로고침
  const prevSiteRef = useRef(null);
  
  useEffect(() => {
    if (currentSite && prevSiteRef.current !== currentSite) {
      console.log('=== 현장 변경 감지 ===');
      console.log('현장 변경됨, 필터 초기화:', prevSiteRef.current, '→', currentSite);
      setFilters(defaultFilters);
      table.onResetPage();
      prevSiteRef.current = currentSite;
      
      // 현장 변경 시 즉시 데이터 새로고침
      setTimeout(() => {
        console.log('🔄 현장 변경으로 인한 사양정보 리스트 데이터 새로고침 요청');
        specsRefetch();
      }, 500);
    } else if (!prevSiteRef.current && currentSite) {
      // 초기 로드 시
      prevSiteRef.current = currentSite;
      console.log('=== 초기 현장 설정 ===');
      console.log('초기 현장 설정:', currentSite);
      
      // 초기 현장 설정 시에도 데이터 로드
      setTimeout(() => {
        console.log('🔄 초기 현장 설정으로 인한 사양정보 리스트 데이터 로드 요청');
        specsRefetch();
      }, 800);
    }
  }, [currentSite, table, specsRefetch]);
  
  // 현장이 있을 때 주기적으로 데이터 새로고침 (추가 보장)
  useEffect(() => {
    if (currentSite) {
      console.log('🔄 현장 확인됨, 사양정보 리스트 데이터 강제 새로고침');
      const timer = setTimeout(() => {
        specsRefetch();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [currentSite, specsRefetch]);

  // 서버에서 필터링된 데이터를 직접 사용하므로 클라이언트 필터링 제거
  const dataFiltered = tableData;

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset = !!filters.name || !!filters.carType || !!filters.type || !!filters.lineId;

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (rowData) => {
      try {
        setIsDeleting(true);
        await deleteSpec(rowData, currentSite);
        
        // 로컬 상태에서 삭제된 행 제거
        const deleteRow = tableData.filter((row) => 
          !(row.CAR_TYPE === rowData.CAR_TYPE && 
            row.LINE_ID === rowData.LINE_ID && 
            row.ALC_CODE === rowData.ALC_CODE && 
            row.TYPE === rowData.TYPE && 
            row.ITEM_CD === rowData.ITEM_CD)
        );
        setTableData(deleteRow);
        
        toast.success('삭제되었습니다!');
        table.onUpdatePageDeleteRow(dataInPage.length);
        
        // 데이터 갱신
        specsRefetch();
      } catch (error) {
        toast.error(error.message || '삭제 중 오류가 발생했습니다.');
        console.error(error);
      } finally {
        setIsDeleting(false);
      }
    },
    [dataInPage.length, table, tableData, specsRefetch, currentSite]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      setIsDeleting(true);
      
      // 선택된 행들의 데이터 가져오기
      const selectedRows = tableData.filter((row) => 
        table.selected.some((selectedKey) => {
          // 복합키로 비교
          const keyParts = selectedKey.split('|');
          return keyParts.length === 5 && 
                 keyParts[0] === row.CAR_TYPE &&
                 keyParts[1] === row.LINE_ID &&
                 keyParts[2] === row.ALC_CODE &&
                 keyParts[3] === row.TYPE &&
                 keyParts[4] === row.ITEM_CD;
        })
      );
      
      // 선택된 모든 항목 삭제
      const deletePromises = selectedRows.map((rowData) => deleteSpec(rowData, currentSite));
      await Promise.all(deletePromises);
      
      // 로컬 상태에서 삭제된 행들 제거
      const deleteRows = tableData.filter((row) => 
        !selectedRows.some((selectedRow) => 
          row.CAR_TYPE === selectedRow.CAR_TYPE && 
          row.LINE_ID === selectedRow.LINE_ID && 
          row.ALC_CODE === selectedRow.ALC_CODE && 
          row.TYPE === selectedRow.TYPE && 
          row.ITEM_CD === selectedRow.ITEM_CD
        )
      );
      setTableData(deleteRows);
      
      toast.success(`${selectedRows.length}개 항목이 삭제되었습니다!`);
      table.onUpdatePageDeleteRows(dataInPage.length, dataFiltered.length);
      
      // 데이터 갱신
      specsRefetch();
    } catch (error) {
      toast.error(error.message || '삭제 중 오류가 발생했습니다.');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  }, [dataFiltered.length, dataInPage.length, table, tableData, specsRefetch, currentSite]);

  const handleResetFilters = useCallback(() => {
    setFilters(defaultFilters);
    table.onResetPage();
  }, [table]);

  // 필터 변경 핸들러 - 필터 변경 시마다 DB에서 새로운 데이터 가져오기
  const handleFilters = useCallback((name, value) => {
    console.log('=== 필터 변경 감지 ===');
    console.log('필터 변경:', name, '→', value);
    console.log('현재 현장:', currentSite);
    
    setFilters(prev => {
      const newFilters = { ...prev, [name]: value };
      console.log('새로운 필터:', newFilters);
      
      // 현장이 설정되어 있을 때만 데이터 새로고침
      if (currentSite) {
        setTimeout(() => {
          console.log('🔄 필터 변경으로 인한 사양정보 리스트 데이터 새로고침 요청');
          console.log('API 호출 URL 예상:', `/api/spec/list?site=${currentSite}&carType=${newFilters.carType}&type=${newFilters.type}&lineId=${newFilters.lineId}&search=${newFilters.name}`);
          specsRefetch();
        }, 300);
      } else {
        console.log('⚠️ 현장이 설정되지 않아 데이터 새로고침을 건너뜀');
      }
      
      return newFilters;
    });
    
    // 검색어 필터가 아닌 경우에만 페이지 리셋
    if (name !== 'name') {
      table.onResetPage();
    }
  }, [table, specsRefetch, currentSite]);

  const handleUploadExcel = useCallback(async (data) => {
    try {
      setIsUploading(true);
      
      // FormData 객체 생성 (다이얼로그에서 실제 File 전달)
      const formData = new FormData();
      formData.append('file', data.file);
      
      // 서버에 엑셀 파일 업로드
      const result = await uploadSpecExcel(formData, currentSite);
      
      toast.success(`${result.insertedCount}개의 사양정보가 업로드되었습니다!`);
      
      // 데이터 갱신
      specsRefetch();
    } catch (error) {
      toast.error('업로드 중 오류가 발생했습니다.');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  }, [specsRefetch, currentSite]);

  const handleDownloadExcel = useCallback(() => {
    try {
      // 현재 날짜 생성
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
      
      // 파일명 생성 (필터조건 제거)
      const fileName = `사양정보_${dateStr}_${timeStr}.xlsx`;
      
      // 필터 조건 정보 생성
      const filterInfo = [];
      filterInfo.push(['사양정보 조회 결과']);
      filterInfo.push(['']);
      filterInfo.push(['조회 일시', `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`]);
      
      // 적용된 필터 조건 추가
      if (filters.carType !== 'all' || filters.type !== 'all' || filters.lineId !== 'all' || filters.name) {
        filterInfo.push(['적용된 필터 조건', '']);
        if (filters.carType !== 'all') {
          filterInfo.push(['차종', filters.carType]);
        }
        if (filters.type !== 'all') {
          filterInfo.push(['타입', filters.type]);
        }
        if (filters.lineId !== 'all') {
          filterInfo.push(['공정', filters.lineId]);
        }
        if (filters.name) {
          filterInfo.push(['ALC_CODE 검색', filters.name]);
        }
      } else {
        filterInfo.push(['적용된 필터 조건', '전체 조회']);
      }
      
      filterInfo.push(['조회 건수', `${dataFiltered.length}건`]);
      filterInfo.push(['']);
      filterInfo.push(['']);
      
      // 데이터 헤더
      const dataHeaders = [
        'CAR_TYPE', 'TYPE', 'LINE_ID', 'ALC_CODE', 'ITEM_CD', 'BODY_TYPE',
        'ETC_TEXT01', 'ETC_TEXT02', 'ETC_TEXT03', 'ETC_TEXT04', 'ETC_TEXT05', 'ETC_TEXT06', 'ETC_TEXT07',
        'REMARK', 'INUSER', 'INDATE', 'UPTUSER', 'UPTDATE'
      ];
      
      // 엑셀로 내보낼 데이터 준비
      const excelData = dataFiltered.map((row) => [
        row.CAR_TYPE || '',
        row.TYPE || '',
        row.LINE_ID || '',
        row.ALC_CODE || '',
        row.ITEM_CD || '',
        row.BODY_TYPE || '',
        row.ETC_TEXT01 || '',
        row.ETC_TEXT02 || '',
        row.ETC_TEXT03 || '',
        row.ETC_TEXT04 || '',
        row.ETC_TEXT05 || '',
        row.ETC_TEXT06 || '',
        row.ETC_TEXT07 || '',
        row.REMARK || '',
        row.INUSER || '',
        row.INDATE || '',
        row.UPTUSER || '',
        row.UPTDATE || '',
      ]);
      
      // 전체 데이터 조합 (필터 정보 + 빈 행 + 헤더 + 데이터)
      const worksheetData = [
        ...filterInfo,
        dataHeaders,
        ...excelData
      ];
      
      // 워크시트 생성
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // 스타일링 (선택사항)
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      
      // 제목 행 스타일링
      if (worksheet['A1']) {
        worksheet['A1'].s = {
          font: { bold: true, sz: 14 },
          alignment: { horizontal: 'left' }
        };
      }
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '사양정보');
      
      // 파일 다운로드
      XLSX.writeFile(workbook, fileName);
      
      toast.success(`${dataFiltered.length}건의 데이터가 다운로드되었습니다.`);
    } catch (error) {
      toast.error('엑셀 다운로드 중 오류가 발생했습니다.');
      console.error(error);
    }
  }, [dataFiltered, filters]);

  const handleEditRow = useCallback((rowData) => {
    setEditingData(rowData);
    editDialog.onTrue();
  }, [editDialog]);

  const handleUpdateRow = useCallback(async (originalKey, updateData) => {
    try {
      setIsUpdating(true);
      
      const result = await updateSpec(originalKey, updateData, currentSite);
      
      // 로컬 상태에서 업데이트된 행 수정
      const updatedTableData = tableData.map((row) => {
        if (row.CAR_TYPE === originalKey.CAR_TYPE && 
            row.LINE_ID === originalKey.LINE_ID && 
            row.ALC_CODE === originalKey.ALC_CODE && 
            row.TYPE === originalKey.TYPE && 
            row.ITEM_CD === originalKey.ITEM_CD) {
          return { ...row, ...updateData };
        }
        return row;
      });
      
      setTableData(updatedTableData);
      
      toast.success('사양정보가 수정되었습니다!');
      editDialog.onFalse();
      setEditingData(null);
      
      // 데이터 갱신
      specsRefetch();
    } catch (error) {
      toast.error(error.message || '수정 중 오류가 발생했습니다.');
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  }, [editDialog, tableData, specsRefetch, currentSite]);

  const handleCreateRow = useCallback(async (createData) => {
    try {
      setIsCreating(true);
      
      const result = await createSpec(createData, currentSite);
      
      // 로컬 상태에서 새로운 행 추가
      const newRow = { ...createData, ...result };
      setTableData(prevData => [...prevData, newRow]);
      
      toast.success('사양정보가 추가되었습니다!');
      createDialog.onFalse();
      
      // 데이터 갱신
      specsRefetch();
    } catch (error) {
      toast.error(error.message || '추가 중 오류가 발생했습니다.');
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  }, [createDialog, specsRefetch, currentSite]);

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title="삭제"
      content={
        <>
          <strong> {table.selected.length} </strong> 항목을 삭제하시겠습니까?
        </>
      }
      action={
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            handleDeleteRows();
            confirmDialog.onFalse();
          }}
          disabled={isDeleting}
          startIcon={isDeleting && <CircularProgress size={16} color="inherit" />}
        >
          {isDeleting ? '삭제 중...' : '삭제'}
        </Button>
      }
    />
  );

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="사양정보 목록"
          links={[
            { name: '대시보드', href: paths.dashboard.root },
            { name: '기준정보관리', href: paths.dashboard.baseInfo.root },
            { name: '사양정보관리' },
          ]}
          action={
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="material-symbols:download" />}
                onClick={handleDownloadExcel}
                disabled={!dataFiltered.length}
              >
                엑셀 다운로드
              </Button>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="material-symbols:upload" />}
                onClick={excelUploadDialog.onTrue}
              >
                엑셀 업로드
              </Button>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="material-symbols:preview" />}
                onClick={popPreviewDialog.onTrue}
                disabled={!dataFiltered.length}
              >
                POP 미리보기
              </Button>
              <Button
                onClick={createDialog.onTrue}
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
              >
                새 사양정보
              </Button>
            </Stack>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card
          sx={{
            boxShadow: (theme) => theme.customShadows.z8,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <SpecTableToolbar
            filters={filters}
            onFilters={handleFilters}
          />

          <SpecTableFiltersResult
            filters={filters}
            onFilters={handleFilters}
            onResetFilters={handleResetFilters}
            results={dataFiltered}
          />

          <TableSelectedAction
            dense={table.dense}
            numSelected={table.selected.length}
            rowCount={dataFiltered.length}
            onSelectAllRows={(checked) =>
              table.onSelectAllRows(
                checked,
                dataFiltered.map((row) => getRowKey(row))
              )
            }
            action={
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  color="error"
                  variant="contained"
                  startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                  onClick={confirmDialog.onTrue}
                >
                  삭제
                </Button>
              </Stack>
            }
          />
  
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headCells={TABLE_HEAD}
                numSelected={table.selected.length}
                onSort={table.onSort}
                onSelectAllRows={(checked) =>
                  table.onSelectAllRows(
                    checked,
                    dataFiltered.map((row) => getRowKey(row))
                  )
                }
              />

              <TableBody>
                {specsLoading ? (
                  <TableSkeleton
                    rowCount={table.rowsPerPage}
                    cellCount={TABLE_HEAD.length}
                    sx={{ height: table.dense ? 48 : 56 }}
                  />
                ) : (
                  <>
                    {notFound ? (
                      <TableNoData notFound={notFound} />
                    ) : (
                      <>
                        {dataInPage.map((row) => {
                          const rowKey = getRowKey(row);
                          return (
                            <SpecTableRow
                              key={rowKey}
                              row={row}
                              selected={table.selected.includes(rowKey)}
                              onSelectRow={() => table.onSelectRow(rowKey)}
                              onDeleteRow={() => handleDeleteRow(row)}
                              onEditRow={() => handleEditRow(row)}
                              dense={table.dense}
                            />
                          );
                        })}
                      </>
                    )}
                  </>
                )}

                <TableEmptyRows
                  height={table.dense ? 48 : 56}
                  emptyRows={specsLoading ? 0 : emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                />
              </TableBody>
            </Table>
          </Scrollbar>
  
          <TablePaginationCustom
            count={dataFiltered.length}
            page={table.page}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
            dense={table.dense}
            onChangeDense={table.onChangeDense}
            disabled={specsLoading}
          />
        </Card>
      </DashboardContent>

      {renderConfirmDialog()}

      <ExcelUploadDialog
        open={excelUploadDialog.value}
        onClose={excelUploadDialog.onFalse}
        onUpload={handleUploadExcel}
        isUploading={isUploading}
        currentSite={currentSite}
      />

      <SpecEditDialog
        open={editDialog.value}
        onClose={() => {
          editDialog.onFalse();
          setEditingData(null);
        }}
        onUpdate={handleUpdateRow}
        data={editingData}
        isUpdating={isUpdating}
      />

      <SpecCreateDialog
        open={createDialog.value}
        onClose={createDialog.onFalse}
        onCreate={handleCreateRow}
        isCreating={isCreating}
      />

      <PopPreviewDialog
        open={popPreviewDialog.value}
        onClose={popPreviewDialog.onFalse}
        data={dataFiltered}
        filters={filters}
      />

      {/* 처리 중 글로벌 백드롭 (상호작용 차단) */}
      <Backdrop
        open={isDeleting || isUploading || isUpdating || isCreating}
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.modal + 1,
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress color="inherit" />
        <Box sx={{ typography: 'subtitle2' }}>처리 중입니다...</Box>
      </Backdrop>

      {/* 고정 오버레이 (안 보일 경우 대비 이중 보장) */}
      {(isDeleting || isUploading || isUpdating || isCreating) && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: (theme) => theme.zIndex.modal + 2,
            bgcolor: 'rgba(0,0,0,0.48)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <CircularProgress sx={{ color: '#fff' }} />
          <Box sx={{ color: '#fff', typography: 'subtitle2' }}>처리 중입니다...</Box>
        </Box>
      )}
    </>
  );
} 