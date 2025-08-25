'use client';

import PropTypes from 'prop-types';
import { useState, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import AlertTitle from '@mui/material/AlertTitle';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { Upload } from 'src/components/upload';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { DataTable } from './excel-upload-table';

// ----------------------------------------------------------------------

// 샘플 데이터 제거 (요청에 따라 템플릿은 헤더만 포함)

const TEMPLATE_COLUMNS = [
  { field: 'CAR_TYPE', headerName: 'CAR_TYPE', required: true, description: '차종 코드 (예: JA, KA, LA)' },
  { field: 'TYPE', headerName: 'TYPE', required: true, description: '타입 코드 (예: JAPE2STD, JAPE2GT)' },
  { field: 'LINE_ID', headerName: 'LINE_ID', required: true, description: '공정 코드 (예: FR01, RR01)' },
  { field: 'ALC_CODE', headerName: 'ALC_CODE', required: true, description: 'ALC 코드 (예: CB, CC)' },
  { field: 'ITEM_CD', headerName: 'ITEM_CD', required: true, description: '품목 코드 (예: 86500G6CB0)' },
  { field: 'BODY_TYPE', headerName: 'BODY_TYPE', required: true, description: '차체 타입 (예: G6)' },
  { field: 'ETC_TEXT01', headerName: 'ETC_TEXT01', required: false, description: '사양1 정보' },
  { field: 'ETC_TEXT02', headerName: 'ETC_TEXT02', required: false, description: '사양2 정보' },
  { field: 'ETC_TEXT03', headerName: 'ETC_TEXT03', required: false, description: '사양3 정보' },
  { field: 'ETC_TEXT04', headerName: 'ETC_TEXT04', required: false, description: '사양4 정보' },
  { field: 'ETC_TEXT05', headerName: 'ETC_TEXT05', required: false, description: '사양5 정보' },
  { field: 'ETC_TEXT06', headerName: 'ETC_TEXT06', required: false, description: '사양6 정보' },
  { field: 'ETC_TEXT07', headerName: 'ETC_TEXT07', required: false, description: '사양7 정보' },
  { field: 'REMARK', headerName: 'REMARK', required: false, description: '비고' },
  { field: 'INUSER', headerName: 'INUSER', required: false, description: '등록자' },
  { field: 'INDATE', headerName: 'INDATE', required: false, description: '등록일' },
  { field: 'UPTUSER', headerName: 'UPTUSER', required: false, description: '수정자' },
  { field: 'UPTDATE', headerName: 'UPTDATE', required: false, description: '수정일' },
];

// ----------------------------------------------------------------------

export function ExcelUploadDialog({ open, onClose, onUpload, isUploading, currentSite }) {
  const [tab, setTab] = useState(0);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState([]);
  const [errors, setErrors] = useState([]);

  const handleChangeTab = useCallback((event, newValue) => {
    setTab(newValue);
  }, []);

  const handleDropFile = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    setFile(file);
    setLoading(true);
    setErrors([]);
    
    try {
      const data = await readExcel(file);
      const { validData, validationErrors } = validateExcelData(data);

      // 서버 검증 호출 (CAR_TYPE 존재, 복합키 중복)
      try {
        const site = currentSite;
        if (site) {
          const resp = await fetch(`/api/spec/validate-upload?site=${encodeURIComponent(site)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rows: validData })
          });
          const serverResult = await resp.json();
          if (resp.ok) {
            const { invalidCarTypes = [], duplicateKeys = [] } = serverResult;

            // CAR_TYPE 오류 메시지 추가 (행 위치 매핑 불가 → 공통 경고로 표시)
            invalidCarTypes.forEach((ct) => {
              validationErrors.push({ row: 0, message: `존재하지 않는 CAR_TYPE 입니다: ${ct}` });
            });

            // 복합키 중복 오류 메시지: 해당되는 로우 탐색하여 행 번호와 함께 표시
            duplicateKeys.forEach((k) => {
              // 동일 조합의 첫 번째 행 번호 추적
              const matched = validData.find((r) => r.CAR_TYPE === k.CAR_TYPE && r.TYPE === k.TYPE && r.LINE_ID === k.LINE_ID && r.ALC_CODE === k.ALC_CODE);
              const rowNum = matched?.excelRow || 0;
              validationErrors.push({ row: rowNum, message: `이미 존재하는 조합입니다 (CAR_TYPE=${k.CAR_TYPE}, TYPE=${k.TYPE}, LINE_ID=${k.LINE_ID}, ALC_CODE=${k.ALC_CODE})` });
            });
          } else {
            console.error('서버 검증 실패:', serverResult.error);
          }
        } else {
          console.warn('현장(site) 정보를 찾을 수 없어 서버 검증을 건너뜀');
        }
      } catch (serverValidateError) {
        console.error('서버 검증 호출 오류:', serverValidateError);
      }
      
      setPreview(validData);
      setErrors(validationErrors);
      setLoading(false);
    } catch (error) {
      console.error('엑셀 파일 읽기 오류:', error);
      setErrors([{ row: 0, message: '엑셀 파일을 읽는 중 오류가 발생했습니다. 파일 형식을 확인해주세요.' }]);
      setLoading(false);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (file && errors.length === 0) {
      onUpload({ file });
      handleReset();
      onClose();
    }
  }, [file, errors, onUpload, onClose]);

  const handleReset = useCallback(() => {
    setFile(null);
    setPreview([]);
    setErrors([]);
  }, []);

  const handleDownloadTemplate = useCallback(() => {
    try {
      if (!currentSite) {
        alert('현장을 먼저 선택해주세요.');
        return;
      }

      fetch(`/api/spec/car-types?site=${encodeURIComponent(currentSite)}`)
        .then((res) => res.json())
        .then(async (data) => {
          const carTypes = (data?.carTypes || []).map((c) => c.CODE);
          if (!carTypes.length) {
            alert('등록된 차종이 없습니다.');
            return;
          }
          const input = window.prompt(`업로드할 차종 코드를 입력하세요.\n가능한 값: ${carTypes.join(', ')}`);
          if (!input) return;
          const selectedCarType = input.trim().toUpperCase();
          if (!carTypes.includes(selectedCarType)) {
            alert('유효하지 않은 차종 코드입니다.');
            return;
          }

          const params = new URLSearchParams({ site: currentSite, carType: selectedCarType });
          const listRes = await fetch(`/api/spec/list?${params.toString()}`);
          const listJson = await listRes.json();
          const specs = Array.isArray(listJson?.specs) ? listJson.specs : [];

          const headers = TEMPLATE_COLUMNS.map((col) => col.field);
          const sheet1 = XLSX.utils.aoa_to_sheet([headers]);

          const referenceRows = specs.map((row) => [
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
          const sheet2 = XLSX.utils.aoa_to_sheet([headers, ...referenceRows]);

          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, sheet1, '템플릿');
          XLSX.utils.book_append_sheet(wb, sheet2, `${selectedCarType}_기준정보`);

          XLSX.writeFile(wb, `사양정보_업로드_템플릿_${selectedCarType}.xlsx`);
        })
        .catch((err) => {
          console.error('차종 목록/기준정보 조회 실패:', err);
          alert('차종 목록 또는 기준정보 조회 중 오류가 발생했습니다.');
        });
    } catch (error) {
      console.error('템플릿 다운로드 오류:', error);
      alert('템플릿 생성 중 오류가 발생했습니다.');
    }
  }, [currentSite]);

  return (
    <Dialog 
      fullWidth 
      maxWidth="md" 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: (theme) => theme.customShadows.dialog || '0 8px 16px 0 rgba(0,0,0,0.2)',
          border: (theme) => `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
        },
      }}
      sx={{
        '& .MuiBackdrop-root': {
          bgcolor: 'rgba(0, 0, 0, 0.5)',
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: (theme) => theme.palette.background.neutral,
          p: 3,
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        엑셀 업로드
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
          엑셀 파일을 업로드하여 사양정보를 일괄 등록할 수 있습니다.
        </Typography>
      </DialogTitle>

      <Tabs
        value={tab}
        onChange={handleChangeTab}
        sx={{
          px: 3,
          bgcolor: 'background.neutral',
        }}
      >
        <Tab label="파일 업로드" />
        <Tab label="템플릿 정보" />
      </Tabs>

      <DialogContent sx={{ height: 480, p: 3 }}>
        {tab === 0 && (
          <Stack spacing={3}>
            {!file ? (
              <Upload
                accept={{ 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] }}
                onDrop={handleDropFile}
                helperText="*.xlsx, *.xls 파일만 업로드 가능합니다."
                disabled={isUploading}
              />
            ) : (
              <>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Iconify icon="eva:file-fill" width={28} />
                  <Typography variant="subtitle2">{file.name}</Typography>
                  <Tooltip title="다른 파일 선택">
                    <Button size="small" color="error" onClick={handleReset}>
                      변경
                    </Button>
                  </Tooltip>
                </Stack>

                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {errors.length > 0 && (
                      <Alert severity="error">
                        <AlertTitle>검증 오류 ({errors.length}건)</AlertTitle>
                        <Scrollbar sx={{ maxHeight: 120 }}>
                          {errors.map((err, index) => (
                            <Typography key={index} variant="caption" display="block">
                              {err.row > 0 ? `${err.row}행: ${err.message}` : err.message}
                            </Typography>
                          ))}
                        </Scrollbar>
                      </Alert>
                    )}

                    {preview.length > 0 && (
                      <Box sx={{ height: errors.length > 0 ? 200 : 300 }}>
                        <DataTable data={preview} />
                      </Box>
                    )}
                  </>
                )}
              </>
            )}
          </Stack>
        )}

        {tab === 1 && (
          <Stack spacing={3}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle1">엑셀 템플릿 안내</Typography>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="material-symbols:download" />}
                onClick={handleDownloadTemplate}
              >
                템플릿 다운로드
              </Button>
            </Stack>
            <Alert severity="info">
              <AlertTitle>엑셀 템플릿 정보</AlertTitle>
              <Typography variant="body2">
                올바른 데이터 업로드를 위해 아래 필드 정보와 형식을 참고하세요.
              </Typography>
            </Alert>

            <Box sx={{ p: 2, borderRadius: 1, bgcolor: 'background.neutral' }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                필수 입력 필드
              </Typography>

              <Stack spacing={2}>
                {TEMPLATE_COLUMNS.map((column) => (
                  <Stack key={column.field} spacing={0.5}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="subtitle2">{column.headerName}</Typography>
                      {column.required && (
                        <Typography variant="caption" sx={{ color: 'error.main' }}>
                          * 필수
                        </Typography>
                      )}
                    </Stack>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {column.description}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          p: 2.5,
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Button variant="outlined" color="inherit" onClick={onClose} disabled={isUploading}>
          취소
        </Button>
          <Button
            variant="contained"
            disabled={isUploading || !file || errors.length > 0}
            onClick={handleSubmit}
            startIcon={isUploading ? <CircularProgress size={16} /> : null}
          >
            {isUploading ? '업로드 중...' : '업로드'}
          </Button>
      </DialogActions>
    </Dialog>
  );
}

ExcelUploadDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onUpload: PropTypes.func,
  isUploading: PropTypes.bool,
};

// ----------------------------------------------------------------------

async function readExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // 첫 번째 시트 사용
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // JSON으로 변환
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length <= 1) {
          reject(new Error('데이터가 없습니다.'));
          return;
        }
        
        // 헤더 행과 데이터 행 분리 및 헤더 정규화
        const rawHeaders = jsonData[0];
        const normalizeHeader = (h) => {
          let key = String(h || '').trim().toUpperCase().replace(/\s+/g, '_');
          // EXT_TEXT → ETC_TEXT 허용
          key = key.replace(/^EXT_TEXT(\d{1,2})$/, (m, d) => `ETC_TEXT${String(d).padStart(2, '0')}`);
          // ETC_TEXT 단일/두 자리 허용, 한 자리면 0 패딩
          key = key.replace(/^ETC_TEXT(\d{1,2})$/, (m, d) => `ETC_TEXT${String(d).padStart(2, '0')}`);
          return key;
        };
        const headers = rawHeaders.map(normalizeHeader);
        // 완전히 빈 행 제거 (실제 입력된 행까지만 처리)
        const rows = jsonData
          .slice(1)
          .filter((row) => Array.isArray(row) && row.some((cell) => cell !== undefined && cell !== null && String(cell).trim() !== ''));
        
        // 객체 배열로 변환
        const result = rows.map((row) => {
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] !== undefined ? row[index] : '';
          });
          // 값 정규화: ALC_CODE는 대문자 변환 및 트림
          if (Object.prototype.hasOwnProperty.call(obj, 'ALC_CODE') && obj.ALC_CODE !== '') {
            obj.ALC_CODE = String(obj.ALC_CODE).toUpperCase().trim();
          }
          return obj;
        });
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
}

function validateExcelData(data) {
  const validData = [];
  const validationErrors = [];
  
  // 필수 필드 확인용 매핑
  const requiredFields = TEMPLATE_COLUMNS
    .filter(col => col.required)
    .map(col => col.field);
  
  // DB 기반 검증으로 대체 (하드코딩 제거)
  
  // 각 행 검증
  data.forEach((row, index) => {
    const rowNum = index + 2; // 엑셀 행 번호 (헤더 행(1) + 인덱스(0부터 시작))
    const errors = [];
    
    // 필수 필드 검사
    requiredFields.forEach(field => {
      if (!row[field]) {
        errors.push(`${TEMPLATE_COLUMNS.find(col => col.field === field).headerName} 값이 없습니다.`);
      }
    });
    
    // CAR_TYPE, LINE_ID 값 검증은 서버(DB)에서 수행 (여기서는 하드코딩 검증 제거)
    
    // ALC 코드 형식 검사: 대문자/숫자만 허용 (밑줄 불가)
    if (row.ALC_CODE) {
      const code = String(row.ALC_CODE).trim().toUpperCase();
      if (!/^[A-Z0-9]+$/.test(code)) {
        errors.push('ALC_CODE 형식이 올바르지 않습니다. (대문자 알파벳/숫자만 허용)');
      }
    }
    
    // ITEM_CD 형식 검사
    if (row.ITEM_CD && !/^\d{5}[A-Z0-9]{5}$/.test(row.ITEM_CD)) {
      errors.push('ITEM_CD 형식이 올바르지 않습니다. (예: 86500G6CB0)');
    }
    
    // 오류가 있으면 오류 목록에 추가
    if (errors.length > 0) {
      errors.forEach(error => {
        validationErrors.push({ row: rowNum, message: error });
      });
    } else {
      // 오류가 없으면 유효한 데이터로 추가
      validData.push({
        ...row,
        id: `temp-${rowNum}`, // 임시 ID 부여
        excelRow: rowNum,
      });
    }
  });
  
  return { validData, validationErrors };
} 