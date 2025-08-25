'use client';

import PropTypes from 'prop-types';
import { useState, useEffect, useCallback, useMemo } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Collapse from '@mui/material/Collapse';


import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';
import { useWorkspace } from 'src/contexts/workspace-context';

// ----------------------------------------------------------------------

export function ReceiveAlc2DataTableToolbar({ filters, onFilters, dateError, onSearch, isLoading }) {
  const { currentSite } = useWorkspace();
  const [bodyTypes, setBodyTypes] = useState([]);
  const [loadingBodyTypes, setLoadingBodyTypes] = useState(false);
  const [isDetailedSearch, setIsDetailedSearch] = useState(false);
  
  // COMMIT_NO 유효성 검사 함수 (0000~9999, 4자리 정수)
  const validateCommitNo = useCallback((value) => {
    if (!value) return ''; // 빈 값은 허용
    
    // 숫자만 허용
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // 4자리로 제한
    if (numericValue.length > 4) {
      return numericValue.slice(0, 4);
    }
    
    // 숫자 값이 있을 때만 범위 검증 (0000~9999)
    if (numericValue.length > 0) {
      const numValue = parseInt(numericValue, 10);
      if (numValue > 9999) {
        return '9999'; // 최대값으로 제한
      }
    }
    
    return numericValue;
  }, []);

  // 즉시 실행되는 필터 핸들러 (렉 방지)
  const handleFilterChange = useCallback((name, value) => {
    // COMMIT_NO 필드들에 대한 유효성 검사
    if (name === 'commitNoStart' || name === 'commitNoEnd') {
      const validatedValue = validateCommitNo(value);
      onFilters(name, validatedValue);
    } else {
      onFilters(name, value);
    }
  }, [onFilters, validateCommitNo]);

  // 상세조건 모드 토글
  const handleDetailedSearchToggle = useCallback((event) => {
    const checked = event.target.checked;
    setIsDetailedSearch(checked);
    
    if (checked) {
      // 상세조건 활성화시 기본 조건들 초기화
      handleFilterChange('startDate', '');
      handleFilterChange('endDate', '');
      handleFilterChange('bodyType', '');
      handleFilterChange('commitNoStart', '');
      handleFilterChange('commitNoEnd', '');
    } else {
      // 기본조건 활성화시 상세조건들 초기화
      handleFilterChange('vinNo', '');
      handleFilterChange('bodyNo', '');
    }
  }, [handleFilterChange]);

  // BODY_TYPE 목록 로드
  const loadBodyTypes = useCallback(async (site) => {
    if (!site) {
      setBodyTypes([]);
      return;
    }

    setLoadingBodyTypes(true);
    try {
      const response = await fetch(`/api/receive-alc2-data/body-types?site=${site}`);
      const data = await response.json();
      
      if (response.ok) {
        const bodyTypeList = data.bodyTypes || [];
        setBodyTypes(bodyTypeList);
      } else {
        console.error('BODY_TYPE 목록 로드 실패:', data.error);
        setBodyTypes([]);
      }
    } catch (error) {
      console.error('BODY_TYPE 목록 로드 오류:', error);
      setBodyTypes([]);
    } finally {
      setLoadingBodyTypes(false);
    }
  }, []);

  // 현장 변경 시 BODY_TYPE 목록 로드
  useEffect(() => {
    if (currentSite) {
      loadBodyTypes(currentSite);
    } else {
      setBodyTypes([]);
    }
      }, [currentSite, loadBodyTypes]);



  // 검색 가능 여부 확인
  const canSearch = useMemo(() => {
    if (!currentSite) return false;
    
    if (isDetailedSearch) {
      // 상세조건: VIN_NO 또는 BODY_NO 중 하나라도 입력되어야 함
      return !!(filters.vinNo || filters.bodyNo);
    } else {
      // 기본조건: 날짜 범위가 필수
      return !!(filters.startDate && filters.endDate && !dateError);
    }
  }, [currentSite, isDetailedSearch, filters.startDate, filters.endDate, filters.vinNo, filters.bodyNo, dateError]);

  // 날짜 문자열을 그대로 반환 (이미 YYYY-MM-DD 형식)
  const formatDateForAPI = useCallback((date) => {
    return date || null;
  }, []);

  const handleSearch = useCallback(() => {
    if (!currentSite) {
      toast.error('현장을 선택해주세요.');
      return;
    }
    
    if (isDetailedSearch) {
      if (!filters.vinNo && !filters.bodyNo) {
        toast.error('VIN_NO 또는 BODY_NO를 입력해주세요.');
        return;
      }
    } else {
      if (!filters.startDate || !filters.endDate) {
        toast.error('조회 기간을 설정해주세요.');
        return;
      }
      
      if (dateError) {
        toast.error('올바른 날짜 범위를 입력해주세요.');
        return;
      }
    }
    
    if (canSearch && onSearch) {
      const serverFilters = {
        isDetailedSearch,
        // 검색 버튼 클릭 시마다 항상 새로 조회되도록 타임스탬프 추가
        _searchTimestamp: Date.now()
      };

      if (isDetailedSearch) {
        // 상세조건 검색
        if (filters.vinNo) serverFilters.vinNo = filters.vinNo;
        if (filters.bodyNo) serverFilters.bodyNo = filters.bodyNo;
        console.log('🔍 상세조건 검색 요청:', serverFilters);
      } else {
        // 기본 조건 검색
        serverFilters.startDate = formatDateForAPI(filters.startDate);
        serverFilters.endDate = formatDateForAPI(filters.endDate);
        if (filters.bodyType) serverFilters.bodyType = filters.bodyType;
        if (filters.commitNoStart) serverFilters.commitNoStart = filters.commitNoStart;
        if (filters.commitNoEnd) serverFilters.commitNoEnd = filters.commitNoEnd;
        console.log('📅 기본조건 검색 요청:', serverFilters);
      }
      
      onSearch(serverFilters);
    }
  }, [currentSite, filters, dateError, canSearch, onSearch, formatDateForAPI, isDetailedSearch]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        mx: 2,
        //mt: 0.05,
        //mb: 0.175,
        borderRadius: 2,
        bgcolor: 'background.neutral',
        border: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* 헤더 */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify 
            icon="material-symbols:filter-list" 
            sx={{ 
              color: 'primary.main', 
              width: 24, 
              height: 24 
            }} 
          />
          <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600 }}>
            검색 필터
          </Typography>
        </Stack>
        
        {/* 상세조건 토글 */}
        <FormControlLabel
          control={
            <Switch
              checked={isDetailedSearch}
              onChange={handleDetailedSearchToggle}
              color="primary"
            />
          }
          label={
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify 
                icon="material-symbols:search-insights"
                sx={{ 
                  color: isDetailedSearch ? 'primary.main' : 'text.disabled',
                  width: 20, 
                  height: 20 
                }} 
              />
              <Typography 
                variant="body2" 
                sx={{ 
                  color: isDetailedSearch ? 'primary.main' : 'text.secondary',
                  fontWeight: isDetailedSearch ? 600 : 400
                }}
              >
                상세조건
              </Typography>
            </Stack>
          }
          sx={{ m: 0 }}
        />
      </Stack>

      <Divider sx={{ mb: 1.5 }} />

      {/* 기본 조건 */}
      <Collapse in={!isDetailedSearch}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 1.5,
            bgcolor: 'background.paper',
            border: (theme) => `1px solid ${theme.palette.divider}`,
            mb: 1,
          }}
        >
        <Stack 
          direction={{ xs: 'column', xl: 'row' }} 
          spacing={2}
          alignItems={{ xs: 'stretch', xl: 'flex-start' }}
        >
                     {/* BODY_TYPE 선택 */}
           <Box sx={{ width: { xs: '100%', xl: 200 } }}>
             <TextField
              select
              value={filters.bodyType || ''}
                             onChange={(event) => handleFilterChange('bodyType', event.target.value)}
              label="차체 타입"
              placeholder="전체"
              size="small"
              fullWidth
              disabled={loadingBodyTypes || !currentSite}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                  '&.Mui-focused': {
                    bgcolor: 'background.paper',
                  }
                },
                '& .MuiSelect-select': {
                  color: !filters.bodyType ? 'text.secondary' : 'text.primary',
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify 
                      icon="material-symbols:directions-car" 
                      sx={{ 
                        color: filters.bodyType ? 'primary.main' : 'text.disabled',
                        width: 18, 
                        height: 18
                      }} 
                    />
                  </InputAdornment>
                ),
                endAdornment: filters.bodyType && (
                  <InputAdornment position="end">
                    <Iconify 
                      icon="material-symbols:close"
                      sx={{ 
                        color: 'text.disabled',
                        width: 16,
                        height: 16,
                        cursor: 'pointer',
                        '&:hover': { color: 'text.primary' }
                      }}
                                             onClick={() => handleFilterChange('bodyType', '')}
                    />
                  </InputAdornment>
                ),
              }}
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) => {
                  if (!selected) {
                    return (
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'normal' }}>
                        전체
                      </Typography>
                    );
                  }
                  return (
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {selected}
                    </Typography>
                  );
                }
              }}
            >
              <MenuItem value="">
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                  전체
                </Typography>
              </MenuItem>
              {bodyTypes.map((bodyType) => (
                <MenuItem key={bodyType} value={bodyType}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {bodyType}
                  </Typography>
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* 구분선 */}
          <Divider 
            orientation={{ xs: 'horizontal', xl: 'vertical' }} 
            flexItem 
            sx={{ 
              mx: { xs: 0, xl: 1 },
              my: { xs: 1, xl: 0 },
              borderColor: 'divider',
              opacity: 0.5,
              height: { xl: 60 }
            }} 
          />

                     {/* 시작일 */}
           <Box sx={{ width: { xs: '100%', xl: 200 } }}>
             <TextField
              label="시작일"
              type="date"
              value={filters.startDate || ''}
                             onChange={(event) => handleFilterChange('startDate', event.target.value)}
              size="small"
              fullWidth
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                  '&.Mui-focused': {
                    bgcolor: 'background.paper',
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify 
                      icon="material-symbols:calendar-month" 
                      sx={{ 
                        color: filters.startDate ? 'primary.main' : 'text.disabled',
                        width: 18,
                        height: 18
                      }} 
                    />
                  </InputAdornment>
                ),
                endAdornment: filters.startDate && (
                  <InputAdornment position="end">
                    <Iconify 
                      icon="material-symbols:close"
                      sx={{ 
                        color: 'text.disabled',
                        width: 16,
                        height: 16,
                        cursor: 'pointer',
                        '&:hover': { color: 'text.primary' }
                      }}
                                             onClick={() => handleFilterChange('startDate', '')}
                    />
                  </InputAdornment>
                ),
              }}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>

                     {/* 종료일 */}
           <Box sx={{ width: { xs: '100%', xl: 200 } }}>
             <TextField
              label="종료일"
              type="date"
              value={filters.endDate || ''}
                             onChange={(event) => handleFilterChange('endDate', event.target.value)}
              size="small"
              fullWidth
              error={dateError}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                  '&.Mui-focused': {
                    bgcolor: 'background.paper',
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify 
                      icon="material-symbols:calendar-month" 
                      sx={{ 
                        color: filters.endDate ? 'primary.main' : 'text.disabled',
                        width: 18,
                        height: 18
                      }} 
                    />
                  </InputAdornment>
                ),
                endAdornment: filters.endDate && (
                  <InputAdornment position="end">
                    <Iconify 
                      icon="material-symbols:close"
                      sx={{ 
                        color: 'text.disabled',
                        width: 16,
                        height: 16,
                        cursor: 'pointer',
                        '&:hover': { color: 'text.primary' }
                      }}
                                             onClick={() => handleFilterChange('endDate', '')}
                    />
                  </InputAdornment>
                ),
              }}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>

          {/* 구분선 */}
          <Divider 
            orientation={{ xs: 'horizontal', xl: 'vertical' }} 
            flexItem 
            sx={{ 
              mx: { xs: 0, xl: 1 },
              my: { xs: 1, xl: 0 },
              borderColor: 'divider',
              opacity: 0.5,
              height: { xl: 60 }
            }} 
          />

                     {/* COMMIT_NO 시작 */}
           <Box sx={{ width: { xs: '100%', xl: 200 } }}>
             <TextField
              value={filters.commitNoStart || ''}
              onChange={(event) => handleFilterChange('commitNoStart', event.target.value)}
              label="COMMIT_NO 시작"
              size="small"
              type="text"
              fullWidth
              placeholder="0000"
              inputProps={{
                maxLength: 4,
                pattern: '[0-9]*',
                inputMode: 'numeric'
              }}
              onKeyPress={(event) => {
                // 숫자만 입력 허용
                if (!/[0-9]/.test(event.key) && event.key !== 'Backspace' && event.key !== 'Delete' && event.key !== 'Tab') {
                  event.preventDefault();
                }
              }}
              helperText="0000~9999 (4자리 숫자)"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                  '&.Mui-focused': {
                    bgcolor: 'background.paper',
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify 
                      icon="material-symbols:arrow-forward" 
                      sx={{ 
                        color: filters.commitNoStart ? 'primary.main' : 'text.disabled',
                        width: 18,
                        height: 18
                      }} 
                    />
                  </InputAdornment>
                ),
                endAdornment: filters.commitNoStart && (
                  <InputAdornment position="end">
                    <Iconify 
                      icon="material-symbols:close"
                      sx={{ 
                        color: 'text.disabled',
                        width: 16,
                        height: 16,
                        cursor: 'pointer',
                        '&:hover': { color: 'text.primary' }
                      }}
                                             onClick={() => handleFilterChange('commitNoStart', '')}
                    />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

                     {/* COMMIT_NO 끝 */}
           <Box sx={{ width: { xs: '100%', xl: 200 } }}>
             <TextField
              value={filters.commitNoEnd || ''}
              onChange={(event) => handleFilterChange('commitNoEnd', event.target.value)}
              label="COMMIT_NO 끝"
              size="small"
              type="text"
              fullWidth
              placeholder="9999"
              inputProps={{
                maxLength: 4,
                pattern: '[0-9]*',
                inputMode: 'numeric'
              }}
              onKeyPress={(event) => {
                // 숫자만 입력 허용
                if (!/[0-9]/.test(event.key) && event.key !== 'Backspace' && event.key !== 'Delete' && event.key !== 'Tab') {
                  event.preventDefault();
                }
              }}
              helperText="0000~9999 (4자리 숫자)"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                  '&.Mui-focused': {
                    bgcolor: 'background.paper',
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify 
                      icon="material-symbols:arrow-back" 
                      sx={{ 
                        color: filters.commitNoEnd ? 'primary.main' : 'text.disabled',
                        width: 18,
                        height: 18
                      }} 
                    />
                  </InputAdornment>
                ),
                endAdornment: filters.commitNoEnd && (
                  <InputAdornment position="end">
                    <Iconify 
                      icon="material-symbols:close"
                      sx={{ 
                        color: 'text.disabled',
                        width: 16,
                        height: 16,
                        cursor: 'pointer',
                        '&:hover': { color: 'text.primary' }
                      }}
                                             onClick={() => handleFilterChange('commitNoEnd', '')}
                    />
                  </InputAdornment>
                ),
              }}
                        />
          </Box>

          {/* 구분선 */}
          <Divider 
            orientation={{ xs: 'horizontal', xl: 'vertical' }} 
            flexItem 
            sx={{ 
              mx: { xs: 0, xl: 1 },
              my: { xs: 1, xl: 0 },
              borderColor: 'divider',
              opacity: 0.5,
              height: { xl: 60 }
            }} 
          />

          {/* 조회 버튼 영역 - 기본조건 */}
          <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', xl: 'auto' }, alignItems: 'flex-end' }}>
            <LoadingButton
              variant="contained"
              loading={isLoading}
              disabled={!canSearch}
              onClick={handleSearch}
              startIcon={<Iconify icon="eva:search-fill" />}
              sx={{
                minWidth: 100,
                height: 40,
                fontSize: '0.875rem',
                fontWeight: 600,
                borderRadius: 1.5,
                boxShadow: (theme) => theme.customShadows.z8,
                '&:hover': {
                  boxShadow: (theme) => theme.customShadows.z12,
                }
              }}
            >
              {isLoading ? '조회 중' : '조회'}
            </LoadingButton>
            
            {(filters.startDate || filters.endDate || filters.bodyType || filters.commitNoStart || filters.commitNoEnd) && (
              <Button
                variant="outlined"
                onClick={() => {
                  handleFilterChange('startDate', '');
                  handleFilterChange('endDate', '');
                  handleFilterChange('bodyType', '');
                  handleFilterChange('commitNoStart', '');
                  handleFilterChange('commitNoEnd', '');
                }}
                startIcon={<Iconify icon="eva:refresh-outline" />}
                sx={{
                  minWidth: 80,
                  height: 40,
                  fontSize: '0.875rem',
                  borderRadius: 1.5,
                }}
              >
                초기화
              </Button>
            )}
          </Stack>

        </Stack>
        </Box>
      </Collapse>

      {/* 상세조건 */}
      <Collapse in={isDetailedSearch}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 1.5,
            bgcolor: 'background.paper',
            border: (theme) => `1px solid ${theme.palette.warning.light}`,
            borderColor: 'warning.light',
            mb: 1,
          }}
        >
          <Stack spacing={2}>
            {/* 상세조건 안내 */}
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify 
                icon="material-symbols:info-outline"
                sx={{ color: 'warning.main', width: 20, height: 20 }} 
              />
              <Typography variant="body2" sx={{ color: 'warning.dark', fontWeight: 500 }}>
                VIN_NO(17자리) 또는 BODY_NO(10자리) 중 하나 이상을 입력하세요
              </Typography>
            </Stack>

            {/* 상세조건 입력 필드 */}
            <Stack 
              direction={{ xs: 'column', md: 'row' }} 
              spacing={2}
              alignItems={{ xs: 'stretch', md: 'flex-start' }}
            >
              {/* VIN_NO 입력 */}
              <Box sx={{ width: { xs: '100%', md: 300 } }}>
                <TextField
                  value={filters.vinNo || ''}
                  onChange={(event) => handleFilterChange('vinNo', event.target.value)}
                  label="VIN_NO (17자리)"
                  placeholder="VIN_NO를 입력하세요"
                  size="small"
                  fullWidth
                  inputProps={{ maxLength: 17 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'background.paper',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                      '&.Mui-focused': {
                        bgcolor: 'background.paper',
                      }
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify 
                          icon="material-symbols:qr-code-2"
                          sx={{ 
                            color: filters.vinNo ? 'warning.main' : 'text.disabled',
                            width: 18,
                            height: 18
                          }} 
                        />
                      </InputAdornment>
                    ),
                    endAdornment: filters.vinNo && (
                      <InputAdornment position="end">
                        <Iconify 
                          icon="material-symbols:close"
                          sx={{ 
                            color: 'text.disabled',
                            width: 16,
                            height: 16,
                            cursor: 'pointer',
                            '&:hover': { color: 'text.primary' }
                          }}
                          onClick={() => handleFilterChange('vinNo', '')}
                        />
                      </InputAdornment>
                    ),
                  }}
                  error={filters.vinNo && filters.vinNo.length > 0 && filters.vinNo.length !== 17}
                />
              </Box>

              {/* BODY_NO 입력 */}
              <Box sx={{ width: { xs: '100%', md: 300 } }}>
                <TextField
                  value={filters.bodyNo || ''}
                  onChange={(event) => handleFilterChange('bodyNo', event.target.value)}
                  label="BODY_NO (10자리)"
                  placeholder="BODY_NO를 입력하세요"
                  size="small"
                  fullWidth
                  inputProps={{ maxLength: 10 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'background.paper',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                      '&.Mui-focused': {
                        bgcolor: 'background.paper',
                      }
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify 
                          icon="material-symbols:badge"
                          sx={{ 
                            color: filters.bodyNo ? 'warning.main' : 'text.disabled',
                            width: 18,
                            height: 18
                          }} 
                        />
                      </InputAdornment>
                    ),
                    endAdornment: filters.bodyNo && (
                      <InputAdornment position="end">
                        <Iconify 
                          icon="material-symbols:close"
                          sx={{ 
                            color: 'text.disabled',
                            width: 16,
                            height: 16,
                            cursor: 'pointer',
                            '&:hover': { color: 'text.primary' }
                          }}
                          onClick={() => handleFilterChange('bodyNo', '')}
                        />
                      </InputAdornment>
                    ),
                  }}
                  error={filters.bodyNo && filters.bodyNo.length > 0 && filters.bodyNo.length !== 10}
                />
              </Box>

              {/* 조회 버튼 영역 - 상세조건 */}
              <Stack direction="row" justifyContent="center" spacing={2} sx={{ mt: 2 }}>
                <LoadingButton
                  variant="contained"
                  loading={isLoading}
                  disabled={!canSearch}
                  onClick={handleSearch}
                  startIcon={<Iconify icon="eva:search-fill" />}
                  sx={{
                    minWidth: 120,
                    height: 40,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    borderRadius: 1.5,
                    boxShadow: (theme) => theme.customShadows.z8,
                    '&:hover': {
                      boxShadow: (theme) => theme.customShadows.z12,
                    }
                  }}
                >
                  {isLoading ? '조회 중' : '조회'}
                </LoadingButton>
                
                {(filters.vinNo || filters.bodyNo) && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      handleFilterChange('vinNo', '');
                      handleFilterChange('bodyNo', '');
                    }}
                    startIcon={<Iconify icon="eva:refresh-outline" />}
                    sx={{
                      minWidth: 80,
                      height: 40,
                      fontSize: '0.875rem',
                      borderRadius: 1.5,
                    }}
                  >
                    초기화
                  </Button>
                )}
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </Collapse>


    </Paper>
  );
}

ReceiveAlc2DataTableToolbar.propTypes = {
  filters: PropTypes.object,
  onFilters: PropTypes.func,
  dateError: PropTypes.bool,
  onSearch: PropTypes.func,
  isLoading: PropTypes.bool,
};