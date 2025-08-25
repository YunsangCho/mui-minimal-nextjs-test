'use client';

import PropTypes from 'prop-types';
import { useState, useEffect, useCallback, useRef } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Badge from '@mui/material/Badge';

import { Iconify } from 'src/components/iconify';
import { useWorkspace } from 'src/contexts/workspace-context';

// ----------------------------------------------------------------------

export function SpecTableToolbar({ filters, onFilters }) {
  const { currentSite } = useWorkspace();
  const [carTypes, setCarTypes] = useState([]);
  const [types, setTypes] = useState([]);
  const [lineIds, setLineIds] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingLineIds, setLoadingLineIds] = useState(false);
  
  // 현장 변경 추적을 위한 ref
  const prevSiteRef = useRef(null);
  const isInitializedRef = useRef(false);
  const lastLoadedCarTypeRef = useRef(null);

  // 차종 목록 로드
  const loadCarTypes = useCallback(async (site) => {
    if (!site) return;
    
    try {
      console.log('차종 목록 로드 시작, 현장:', site);
      const response = await fetch(`/api/spec/car-types?site=${site}`);
      const data = await response.json();
      
      if (response.ok) {
        const carTypeList = Array.isArray(data.carTypes) ? data.carTypes : [];
        console.log('차종 목록 로드 성공:', carTypeList.length, '개');
        setCarTypes(carTypeList);
      } else {
        console.error('차종 목록 로드 실패:', data.error);
        setCarTypes([]);
      }
    } catch (error) {
      console.error('차종 목록 로드 오류:', error);
      setCarTypes([]);
    }
  }, []);

  // LINE_ID 목록 로드
  const loadLineIds = useCallback(async (site) => {
    if (!site) return;
    
    setLoadingLineIds(true);
    try {
      console.log('LINE_ID 목록 로드 시작, 현장:', site);
      const response = await fetch(`/api/spec/line-ids?site=${site}`);
      const data = await response.json();
      
      if (response.ok) {
        const lineIdList = data.lineIds || [];
        console.log('LINE_ID 목록 로드 성공:', lineIdList.length, '개');
        setLineIds(lineIdList);
      } else {
        console.error('LINE_ID 목록 로드 실패:', data.error);
        setLineIds([]);
      }
    } catch (error) {
      console.error('LINE_ID 목록 로드 오류:', error);
      setLineIds([]);
    } finally {
      setLoadingLineIds(false);
    }
  }, []);

  // 타입 목록 로드
  const loadTypes = useCallback(async (carType, site) => {
    if (!carType || !site) {
      setTypes([]);
      lastLoadedCarTypeRef.current = null;
      return;
    }

    // 중복 호출 방지
    if (lastLoadedCarTypeRef.current === carType) {
      console.log('타입 목록 중복 호출 방지:', carType);
      return;
    }

    setLoadingTypes(true);
    lastLoadedCarTypeRef.current = carType;
    
    try {
      console.log('타입 목록 로딩 시작:', carType, '현장:', site);
      const response = await fetch(`/api/spec/work-types?carType=${encodeURIComponent(carType)}&site=${site}`);
      const data = await response.json();
      
      if (response.ok && data.types && Array.isArray(data.types)) {
        const formattedTypes = data.types.map((type) => ({
          value: type.TYPE || type.value || '',
          label: type.TYPE || type.label || type.value || ''
        }));
        console.log('타입 목록 로드 성공:', formattedTypes.length, '개');
        setTypes(formattedTypes);
      } else {
        console.log('타입 목록 없음 또는 오류:', data.error);
        setTypes([]);
      }
    } catch (error) {
      console.error('타입 목록 로드 오류:', error);
      setTypes([]);
    } finally {
      setLoadingTypes(false);
    }
  }, []);

  // 현장 변경 시 초기화 및 데이터 로드
  useEffect(() => {
    if (!currentSite) return;

    const prevSite = prevSiteRef.current;

    // 현장이 실제로 변경된 경우
    if (prevSite !== currentSite) {
      console.log('현장 변경 감지 - 데이터 로드:', prevSite, '→', currentSite);
      
      // 상태 초기화
      setCarTypes([]);
      setLineIds([]);
      setTypes([]);
      lastLoadedCarTypeRef.current = null;
      
      // 데이터 로드
      Promise.all([
        loadCarTypes(currentSite),
        loadLineIds(currentSite)
      ]).then(() => {
        console.log('현장 기반 데이터 로드 완료');
      });

      // ref 업데이트
      prevSiteRef.current = currentSite;
      isInitializedRef.current = true;
    }
  }, [currentSite]); // 의존성 배열에서 함수들 제거

  // 차종 변경 시 타입 로드
  useEffect(() => {
    if (filters.carType && currentSite) {
      console.log('차종 변경으로 타입 로드:', filters.carType);
      loadTypes(filters.carType, currentSite);
    } else {
      setTypes([]);
      lastLoadedCarTypeRef.current = null;
    }
  }, [filters.carType, currentSite]); // loadTypes 의존성 제거

  const handleCarTypeChange = (event) => {
    const newCarType = event.target.value;
    console.log('차종 선택:', newCarType);
    
    // 차종 변경
    onFilters('carType', newCarType);
    
    // 타입 필터 초기화
    if (filters.type) {
      onFilters('type', '');
    }
  };

  // 활성 필터 개수 계산
  const activeFiltersCount = [
    filters.carType,
    filters.type,
    filters.lineId,
    filters.name
  ].filter(Boolean).length;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        m: 2,
        borderRadius: 2,
        bgcolor: 'background.neutral',
        border: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* 헤더 */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
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
        {activeFiltersCount > 0 && (
          <Badge 
            badgeContent={activeFiltersCount} 
            color="primary"
            sx={{
              '& .MuiBadge-badge': {
                right: -3,
                top: 3,
              }
            }}
          >
            <Chip 
              size="small" 
              label="활성" 
              color="primary" 
              variant="outlined"
            />
          </Badge>
        )}
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* 통합 필터 영역 */}
      <Box
        sx={{
          p: 2.5,
          borderRadius: 1.5,
          bgcolor: 'background.paper',
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          {/* 차종 선택 */}
          <Box sx={{ minWidth: { xs: '100%', md: 240 } }}>
            <TextField
              select
              value={filters.carType || ''}
              onChange={handleCarTypeChange}
              label="차종"
              size="small"
              fullWidth
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper',
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify 
                      icon="material-symbols:directions-car" 
                      sx={{ color: 'text.disabled', width: 20, height: 20 }} 
                    />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="">
                <em style={{ color: '#9e9e9e' }}>전체 차종</em>
              </MenuItem>
              {carTypes.map((carType) => (
                <MenuItem key={carType.CODE} value={carType.CODE}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {carType.CODE}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {carType.LABEL.split(' : ')[1]}
                    </Typography>
                  </Stack>
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* 타입 선택 */}
          <Box sx={{ minWidth: { xs: '100%', md: 180 } }}>
            <TextField
              select
              value={filters.type || ''}
              onChange={(event) => onFilters('type', event.target.value)}
              label="타입"
              size="small"
              fullWidth
              disabled={!filters.carType || loadingTypes}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  bgcolor: filters.carType ? 'background.paper' : 'action.disabledBackground',
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify 
                      icon="material-symbols:category-outline" 
                      sx={{ 
                        color: filters.carType ? 'text.disabled' : 'action.disabled', 
                        width: 20, 
                        height: 20 
                      }} 
                    />
                  </InputAdornment>
                ),
              }}
              helperText={
                loadingTypes ? "타입 로딩 중..." : 
                !filters.carType ? "먼저 차종을 선택하세요" : 
                types.length === 0 ? "해당 차종의 타입이 없습니다" : ""
              }
            >
              <MenuItem value="">
                <em style={{ color: '#9e9e9e' }}>전체 타입</em>
              </MenuItem>
              {types.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  <Typography variant="body2">
                    {type.label}
                  </Typography>
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* LINE_ID 선택 */}
          <Box sx={{ minWidth: { xs: '100%', md: 140 } }}>
            <TextField
              select
              value={filters.lineId || ''}
              onChange={(event) => onFilters('lineId', event.target.value)}
              label="라인"
              size="small"
              fullWidth
              disabled={loadingLineIds}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper',
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify 
                      icon="mdi:factory" 
                      sx={{ 
                        color: 'text.disabled',
                        width: 20, 
                        height: 20 
                      }} 
                    />
                  </InputAdornment>
                ),
              }}
              helperText={loadingLineIds ? "라인 로딩 중..." : ""}
            >
              <MenuItem value="">
                <em style={{ color: '#9e9e9e' }}>전체 라인</em>
              </MenuItem>
              {lineIds.map((lineId) => (
                <MenuItem key={lineId.value} value={lineId.value}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {lineId.label}
                  </Typography>
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* 구분선 */}
          <Divider 
            orientation={{ xs: 'horizontal', md: 'vertical' }} 
            flexItem 
            sx={{ 
              mx: { xs: 0, md: 1 },
              my: { xs: 1, md: 0 },
              borderColor: 'divider',
              opacity: 0.5 
            }} 
          />

          {/* 텍스트 검색 */}
          <Box sx={{ flex: 1, minWidth: { xs: '100%', md: 300 } }}>
            <TextField
              fullWidth
              value={filters.name}
              onChange={(event) => onFilters('name', event.target.value)}
              placeholder="ALC 코드 또는 품목 코드로 검색..."
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                  '&.Mui-focused': {
                    bgcolor: 'background.paper',
                    boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}25`,
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify 
                      icon="mingcute:search-line" 
                      sx={{ 
                        color: filters.name ? 'primary.main' : 'text.disabled',
                        width: 20,
                        height: 20,
                        transition: 'color 0.2s ease-in-out'
                      }} 
                    />
                  </InputAdornment>
                ),
                endAdornment: filters.name && (
                  <InputAdornment position="end">
                    <Iconify 
                      icon="material-symbols:close"
                      sx={{ 
                        color: 'text.disabled',
                        width: 18,
                        height: 18,
                        cursor: 'pointer',
                        '&:hover': { color: 'text.primary' }
                      }}
                      onClick={() => onFilters('name', '')}
                    />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Stack>
      </Box>
    </Paper>
  );
}

SpecTableToolbar.propTypes = {
  filters: PropTypes.object,
  onFilters: PropTypes.func,
}; 