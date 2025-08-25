import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------

export function useGetSpecs(currentSite, filters = {}) {
  // 필터 파라미터를 포함한 URL 생성
  const url = useMemo(() => {
    console.log('=== useGetSpecs URL 생성 ===');
    console.log('currentSite:', currentSite);
    console.log('filters:', filters);
    
    if (!currentSite) {
      console.log('⚠️ currentSite가 null이므로 API 호출하지 않음');
      return null;
    }
    
    const params = new URLSearchParams();
    params.append('site', currentSite);
    
    // 필터 조건 추가
    if (filters.carType && filters.carType !== '') {
      params.append('carType', filters.carType);
      console.log('필터 추가 - carType:', filters.carType);
    }
    if (filters.type && filters.type !== '') {
      params.append('type', filters.type);
      console.log('필터 추가 - type:', filters.type);
    }
    if (filters.lineId && filters.lineId !== '') {
      params.append('lineId', filters.lineId);
      console.log('필터 추가 - lineId:', filters.lineId);
    }
    if (filters.name && filters.name !== '') {
      params.append('search', filters.name);
      console.log('필터 추가 - search:', filters.name);
    }
    
    const urlWithParams = `${endpoints.spec.list}?${params.toString()}`;
    console.log('🚀 사양정보 리스트 API URL 생성:', urlWithParams);
    return urlWithParams;
  }, [currentSite, filters.carType, filters.type, filters.lineId, filters.name]);

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, {
    ...swrOptions,
    // 필터 변경 시 즉시 새 데이터 요청
    revalidateOnMount: true,
    // 필터가 변경될 때마다 데이터 다시 가져오기
    revalidateIfStale: true,
    // 포커스 시에도 데이터 새로고침
    revalidateOnFocus: true,
    onSuccess: (data) => {
      console.log('📥 사양정보 리스트 API 호출 성공:', data?.specs?.length || 0, '건');
    },
    onError: (error) => {
      console.error('❌ 사양정보 리스트 API 호출 실패:', error);
    },
  });

  const memoizedValue = useMemo(
    () => ({
      specs: data?.specs || [],
      specsLoading: isLoading,
      specsError: error,
      specsValidating: isValidating,
      specsEmpty: !isLoading && !isValidating && !data?.specs.length,
      specsRefetch: mutate,
    }),
    [data?.specs, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export async function createSpec(specData, currentSite) {
  try {
    const url = currentSite ? `${endpoints.spec.create}?site=${currentSite}` : endpoints.spec.create;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(specData),
    });
    
    if (!response.ok) {
      throw new Error('사양정보 생성 실패');
    }
    
    return await response.json();
  } catch (error) {
    console.error('사양정보 생성 오류:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function updateSpec(originalKey, updateData, currentSite) {
  try {
    const url = currentSite ? `${endpoints.spec.update}?site=${currentSite}` : endpoints.spec.update;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        originalKey,
        updateData,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '사양정보 업데이트 실패');
    }
    
    return await response.json();
  } catch (error) {
    console.error('사양정보 업데이트 오류:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function deleteSpec(specData, currentSite) {
  try {
    const url = currentSite ? `${endpoints.spec.delete}?site=${currentSite}` : endpoints.spec.delete;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keys: [specData], // 배열 형태로 전달
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '사양정보 삭제 실패');
    }
    
    return await response.json();
  } catch (error) {
    console.error('사양정보 삭제 오류:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function uploadSpecExcel(formData, currentSite) {
  try {
    const url = currentSite ? `${endpoints.spec.upload}?site=${currentSite}` : endpoints.spec.upload;
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('엑셀 업로드 실패');
    }
    
    return await response.json();
  } catch (error) {
    console.error('엑셀 업로드 오류:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function checkSpecDuplicate(checkData, currentData = null, currentSite) {
  try {
    const url = currentSite ? `${endpoints.spec.checkDuplicate}?site=${currentSite}` : endpoints.spec.checkDuplicate;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checkData,
        currentData,
      }),
    });
    
    if (!response.ok) {
      throw new Error('중복 검증 실패');
    }
    
    const result = await response.json();
    return result.isDuplicate;
  } catch (error) {
    console.error('중복 검증 오류:', error);
    throw error;
  }
} 