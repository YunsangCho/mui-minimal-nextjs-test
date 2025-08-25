'use client';

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { checkSpecDuplicate } from 'src/actions/spec';
import { AlertDialog } from 'src/components/custom-dialog';

// ----------------------------------------------------------------------

export function SpecEditDialog({ open, onClose, onUpdate, data, isUpdating }) {
  const [formData, setFormData] = useState({
    CAR_TYPE: '',
    LINE_ID: '',
    ALC_CODE: '',
    TYPE: '',
    ITEM_CD: '',
    BODY_TYPE: '',
    ETC_TEXT01: '',
    ETC_TEXT02: '',
    ETC_TEXT03: '',
    ETC_TEXT04: '',
    ETC_TEXT05: '',
    ETC_TEXT06: '',
    ETC_TEXT07: '',
    REMARK: '',
    INUSER: '',
    INDATE: '',
    UPTUSER: '',
    UPTDATE: '',
  });

  // Alert 다이얼로그 상태
  const [alertDialog, setAlertDialog] = useState({
    open: false,
    title: '알림',
    content: '',
    severity: 'warning',
  });

  // 데이터가 변경될 때 폼 초기화
  useEffect(() => {
    if (data) {
      setFormData({
        CAR_TYPE: data.CAR_TYPE || '',
        LINE_ID: data.LINE_ID || '',
        ALC_CODE: data.ALC_CODE || '',
        TYPE: data.TYPE || '',
        ITEM_CD: data.ITEM_CD || '',
        BODY_TYPE: data.BODY_TYPE || '',
        ETC_TEXT01: data.ETC_TEXT01 || '',
        ETC_TEXT02: data.ETC_TEXT02 || '',
        ETC_TEXT03: data.ETC_TEXT03 || '',
        ETC_TEXT04: data.ETC_TEXT04 || '',
        ETC_TEXT05: data.ETC_TEXT05 || '',
        ETC_TEXT06: data.ETC_TEXT06 || '',
        ETC_TEXT07: data.ETC_TEXT07 || '',
        REMARK: data.REMARK || '',
        INUSER: data.INUSER || '',
        INDATE: data.INDATE || '',
        UPTUSER: data.UPTUSER || '',
        UPTDATE: data.UPTDATE || '',
      });
    }
  }, [data]);

  // Alert 다이얼로그 표시 함수
  const showAlert = (content, severity = 'warning', title = '알림') => {
    setAlertDialog({
      open: true,
      title,
      content,
      severity,
    });
  };

  // Alert 다이얼로그 닫기 함수
  const closeAlert = () => {
    setAlertDialog(prev => ({ ...prev, open: false }));
  };

  const handleInputChange = (field) => (event) => {
    let value = event.target.value;
    
    // 지정된 필드들은 항상 대문자로 변환
    if (['ALC_CODE', 'BODY_TYPE', 'ITEM_CD', 'TYPE', 'CAR_TYPE'].includes(field)) {
      value = value.toUpperCase();
    }
    
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSubmit = async () => {
    // 기본정보 필수 항목 검증
    const requiredFields = ['BODY_TYPE', 'CAR_TYPE', 'TYPE', 'LINE_ID', 'ALC_CODE', 'ITEM_CD'];
    const missingFields = requiredFields.filter(field => !formData[field] || formData[field].trim() === '');
    
    if (missingFields.length > 0) {
      showAlert('기본정보의 모든 필수 항목을 입력해주세요.', 'warning', '입력 오류');
      return;
    }

    // 각 필수 항목의 최소 길이 검증
    const fieldValidations = [
      { field: 'BODY_TYPE', minLength: 2, label: 'BODY_TYPE' },
      { field: 'CAR_TYPE', minLength: 2, label: '차종(CAR_TYPE)' },
      { field: 'TYPE', minLength: 2, label: '타입(TYPE)' },
      { field: 'LINE_ID', minLength: 4, label: '공정(LINE_ID)' },
      { field: 'ALC_CODE', minLength: 2, label: 'ALC_CODE' },
      { field: 'ITEM_CD', minLength: 10, label: 'ITEM_CD' },
    ];

    for (const validation of fieldValidations) {
      const value = formData[validation.field]?.trim() || '';
      if (value.length < validation.minLength) {
        showAlert(`${validation.label}는 최소 ${validation.minLength}자 이상 입력해주세요.`, 'warning', '입력 오류');
        return;
      }
    }

    try {
      // 복합키 중복 검증 (원본 데이터와 다른 경우에만)
      const currentKey = {
        CAR_TYPE: formData.CAR_TYPE.trim(),
        TYPE: formData.TYPE.trim(),
        LINE_ID: formData.LINE_ID.trim(),
        ALC_CODE: formData.ALC_CODE.trim(),
      };

      const originalKey = {
        CAR_TYPE: data.CAR_TYPE,
        TYPE: data.TYPE,
        LINE_ID: data.LINE_ID,
        ALC_CODE: data.ALC_CODE,
      };

      // 복합키가 변경된 경우에만 중복 체크
      const isKeyChanged = Object.keys(currentKey).some(
        key => currentKey[key] !== originalKey[key]
      );

      if (isKeyChanged) {
        const isDuplicate = await checkSpecDuplicate(currentKey, data);
        if (isDuplicate) {
          showAlert('입력한 (차종, 타입, 공정, ALC_CODE) 조합이 이미 존재합니다.\n다른 값으로 입력해주세요.', 'error', '중복 오류');
          return;
        }
      }

      // ITEM_CD 단일 필드 중복 검증 (변경된 경우에만)
      const currentItemCd = formData.ITEM_CD.trim();
      const originalItemCd = data.ITEM_CD;

      if (currentItemCd !== originalItemCd) {
        const isItemCdDuplicate = await checkSpecDuplicate({ ITEM_CD: currentItemCd }, data);
        if (isItemCdDuplicate) {
          showAlert('입력한 ITEM_CD가 이미 존재합니다.\n다른 값으로 입력해주세요.', 'error', '중복 오류');
          return;
        }
      }

      // 원본 데이터의 복합키 (업데이트용)
      const updateKey = {
        CAR_TYPE: data.CAR_TYPE,
        LINE_ID: data.LINE_ID,
        ALC_CODE: data.ALC_CODE,
        TYPE: data.TYPE,
        ITEM_CD: data.ITEM_CD,
      };

      // 변경된 필드만 전송
      const updateData = {};
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== (data[key] || '')) {
          updateData[key] = formData[key];
        }
      });

      // 변경사항이 있는 경우만 업데이트
      if (Object.keys(updateData).length > 0) {
        onUpdate(updateKey, updateData);
      } else {
        onClose();
      }
    } catch (error) {
      showAlert('중복 검증 중 오류가 발생했습니다. 다시 시도해주세요.', 'error', '시스템 오류');
      console.error('중복 검증 오류:', error);
    }
  };

  const handleClose = () => {
    if (!isUpdating) {
      onClose();
    }
  };

  return (
    <Dialog 
      fullWidth 
      maxWidth={false}
      open={open} 
      onClose={handleClose}
      PaperProps={{
        sx: {
          maxWidth: '810px',
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
        사양정보 수정
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
          사양정보의 상세 내용을 수정할 수 있습니다.
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* 기본 정보 섹션 */}
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2.5,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              기본 정보
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'error.main',
                  fontWeight: 700,
                  bgcolor: 'error.lighter',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                }}
              >
                필수
              </Typography>
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="BODY_TYPE"
                  value={formData.BODY_TYPE}
                  onChange={handleInputChange('BODY_TYPE')}
                  size="small"
                  required
                  inputProps={{ maxLength: 2 }}
                  error={!formData.BODY_TYPE || formData.BODY_TYPE.trim().length < 2}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="차종 (CAR_TYPE)"
                  value={formData.CAR_TYPE}
                  onChange={handleInputChange('CAR_TYPE')}
                  size="small"
                  required
                  inputProps={{ maxLength: 10 }}
                  error={!formData.CAR_TYPE || formData.CAR_TYPE.trim().length < 2}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="타입 (TYPE)"
                  value={formData.TYPE}
                  onChange={handleInputChange('TYPE')}
                  size="small"
                  required
                  error={!formData.TYPE || formData.TYPE.trim().length < 2}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl 
                  size="small" 
                  required 
                  error={!formData.LINE_ID || formData.LINE_ID.trim().length < 4}
                  sx={{minWidth: 200}}
                >
                  <InputLabel>공정 (LINE_ID)</InputLabel>
                  <Select
                    value={formData.LINE_ID}
                    onChange={handleInputChange('LINE_ID')}
                    label="공정 (LINE_ID)"
                  >
                    <MenuItem value="">선택하세요</MenuItem>
                    <MenuItem value="FR01">FR01</MenuItem>
                    <MenuItem value="RR01">RR01</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="ALC_CODE"
                  value={formData.ALC_CODE}
                  onChange={handleInputChange('ALC_CODE')}
                  size="small"
                  required
                  inputProps={{ maxLength: 2 }}
                  error={!formData.ALC_CODE || formData.ALC_CODE.trim().length < 2}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="ITEM_CD"
                  value={formData.ITEM_CD}
                  onChange={handleInputChange('ITEM_CD')}
                  size="small"
                  required
                  inputProps={{ maxLength: 10 }}
                  error={!formData.ITEM_CD || formData.ITEM_CD.trim().length < 10}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* 사양정보 섹션 */}
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2.5,
                fontWeight: 600,
              }}
            >
              사양정보
            </Typography>
            
            <Grid container spacing={3}>
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <Grid item xs={12} sm={6} md={4} key={num}>
                  <TextField
                    fullWidth
                    label={`ETC_TEXT0${num}`}
                    value={formData[`ETC_TEXT0${num}`]}
                    onChange={handleInputChange(`ETC_TEXT0${num}`)}
                    size="small"
                    inputProps={{ maxLength: 20 }}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* 담당자 정보 섹션 */}
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2.5,
                fontWeight: 600,
              }}
            >
              담당자 정보
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="등록자 (INUSER)"
                  value={formData.INUSER}
                  onChange={handleInputChange('INUSER')}
                  size="small"
                  disabled
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="등록일자 (INDATE)"
                  value={formData.INDATE}
                  onChange={handleInputChange('INDATE')}
                  size="small"
                  disabled
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="수정자 (UPTUSER)"
                  value={formData.UPTUSER}
                  onChange={handleInputChange('UPTUSER')}
                  size="small"
                  disabled
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="수정일자 (UPTDATE)"
                  value={formData.UPTDATE}
                  onChange={handleInputChange('UPTDATE')}
                  size="small"
                  disabled
                />
              </Grid>
            </Grid>
          </Paper>

          {/* 비고 섹션 */}
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2.5,
                fontWeight: 600,
              }}
            >
              비고
            </Typography>
            
            <TextField
              fullWidth
              label="비고 (REMARK)"
              value={formData.REMARK}
              onChange={handleInputChange('REMARK')}
              multiline
              rows={3}
              size="small"
            />
          </Paper>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          p: 3,
          bgcolor: (theme) => theme.palette.background.neutral,
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Button 
          onClick={handleClose} 
          disabled={isUpdating}
        >
          취소
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isUpdating}
          startIcon={isUpdating && <CircularProgress size={16} color="inherit" />}
        >
          {isUpdating ? '수정 중...' : '수정'}
        </Button>
      </DialogActions>

      {/* Alert Dialog */}
      <AlertDialog
        open={alertDialog.open}
        onClose={closeAlert}
        title={alertDialog.title}
        content={alertDialog.content}
        severity={alertDialog.severity}
      />
    </Dialog>
  );
}

SpecEditDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  data: PropTypes.object,
  isUpdating: PropTypes.bool,
}; 