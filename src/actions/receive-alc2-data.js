'use client';

import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 0, // 중복 제거 비활성화로 매번 새로운 요청 허용
};

// ----------------------------------------------------------------------

export function useGetReceiveAlc2Data(filters, currentSite) {
  // 필터가 null이거나 유효하지 않으면 API 호출하지 않음
  const shouldFetch = filters && currentSite && (
    // 기본조건: 날짜 범위 필수
    (filters.startDate && filters.endDate && !filters.isDetailedSearch) ||
    // 상세조건: VIN_NO 또는 BODY_NO 필수
    (filters.isDetailedSearch && (filters.vinNo || filters.bodyNo))
  );
  
  const params = useMemo(() => {
    if (!shouldFetch) return null;
    
    const searchParams = new URLSearchParams();
    
    // 현장 정보 추가
    searchParams.append('site', currentSite);
    
    // 기본조건인 경우에만 날짜와 기본 필터 추가
    if (!filters.isDetailedSearch) {
      if (filters.startDate) {
        // Date 객체든 문자열이든 확실하게 YYYY-MM-DD 문자열로 변환
        let startDateStr = filters.startDate;
        if (typeof filters.startDate !== 'string') {
          // Date 객체나 dayjs 객체인 경우 문자열로 변환
          if (filters.startDate && typeof filters.startDate.format === 'function') {
            startDateStr = filters.startDate.format('YYYY-MM-DD');
          } else if (filters.startDate instanceof Date) {
            const year = filters.startDate.getFullYear();
            const month = String(filters.startDate.getMonth() + 1).padStart(2, '0');
            const day = String(filters.startDate.getDate()).padStart(2, '0');
            startDateStr = `${year}-${month}-${day}`;
          }
        }
        searchParams.append('startDate', startDateStr);
      }
      
      if (filters.endDate) {
        // Date 객체든 문자열이든 확실하게 YYYY-MM-DD 문자열로 변환
        let endDateStr = filters.endDate;
        if (typeof filters.endDate !== 'string') {
          // Date 객체나 dayjs 객체인 경우 문자열로 변환
          if (filters.endDate && typeof filters.endDate.format === 'function') {
            endDateStr = filters.endDate.format('YYYY-MM-DD');
          } else if (filters.endDate instanceof Date) {
            const year = filters.endDate.getFullYear();
            const month = String(filters.endDate.getMonth() + 1).padStart(2, '0');
            const day = String(filters.endDate.getDate()).padStart(2, '0');
            endDateStr = `${year}-${month}-${day}`;
          }
        }
        searchParams.append('endDate', endDateStr);
      }
      
      if (filters.bodyType) {
        searchParams.append('bodyType', filters.bodyType);
      }
      
      if (filters.commitNoStart) {
        searchParams.append('commitNoStart', filters.commitNoStart);
      }
      
      if (filters.commitNoEnd) {
        searchParams.append('commitNoEnd', filters.commitNoEnd);
      }
    }

    // 상세조건 검색 관련 파라미터
    if (filters.isDetailedSearch) {
      searchParams.append('isDetailedSearch', 'true');
      
      if (filters.vinNo) {
        searchParams.append('vinNo', filters.vinNo);
      }
      
      if (filters.bodyNo) {
        searchParams.append('bodyNo', filters.bodyNo);
      }
    }
    
    // 페이징 파라미터 추가 (커서 기반 + 기존 방식)
    if (filters.cursorProdDttm && filters.cursorCommitNo) {
      // 커서 기반 페이징
      searchParams.append('cursorProdDttm', filters.cursorProdDttm);
      searchParams.append('cursorCommitNo', filters.cursorCommitNo);
      searchParams.append('direction', filters.direction || 'next');
      searchParams.append('pageSize', (filters.pageSize || 50).toString());
    } else {
      // 기존 번호 기반 페이징 (첫 페이지나 페이지 점프용)
      if (filters.page) {
        searchParams.append('page', filters.page.toString());
      }
      if (filters.pageSize) {
        searchParams.append('pageSize', filters.pageSize.toString());
      }
    }
    
    // 타임스탬프 추가 (매번 새로운 요청을 위해)
    if (filters._searchTimestamp) {
      searchParams.append('_t', filters._searchTimestamp);
    }
    
    return searchParams.toString();
  }, [filters, currentSite, shouldFetch]);

  const url = shouldFetch && params ? `${endpoints.receiveAlc2Data.list}?${params}` : null;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(() => {
    const receiveAlc2Data = data?.data || [];
    const pagination = data?.pagination || null;
    
    return {
      receiveAlc2Data,
      receiveAlc2DataLoading: isLoading,
      receiveAlc2DataError: error,
      receiveAlc2DataEmpty: !isLoading && !receiveAlc2Data.length,
      receiveAlc2DataRefetch: mutate,
      pagination, // 페이징 정보 추가
    };
  }, [data?.data, data?.pagination, error, isLoading, mutate]);

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetBodyTypes(currentSite) {
  const url = currentSite ? `${endpoints.receiveAlc2Data.bodyTypes}?site=${currentSite}` : null;
  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(() => ({
    bodyTypes: data?.bodyTypes || [],
    bodyTypesLoading: isLoading,
    bodyTypesError: error,
    bodyTypesEmpty: !isLoading && !data?.bodyTypes?.length,
  }), [data?.bodyTypes, error, isLoading]);

  return memoizedValue;
} 