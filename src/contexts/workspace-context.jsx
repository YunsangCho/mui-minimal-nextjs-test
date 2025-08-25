'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// ----------------------------------------------------------------------

const WorkspaceContext = createContext();

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}

// ----------------------------------------------------------------------

export function WorkspaceProvider({ children }) {
  const router = useRouter();
  
  // localStorage에서 저장된 현장 복원 (기본값 없음)
  const getInitialSite = useCallback(() => {
    if (typeof window !== 'undefined') {
      const savedSite = localStorage.getItem('currentSite');
      if (savedSite) {
        console.log('localStorage에서 현장 복원:', savedSite);
        return savedSite;
      }
    }
    console.log('저장된 현장 없음');
    return null; // 기본값 제거
  }, []);
  
  const [currentSite, setCurrentSite] = useState(getInitialSite); // localStorage에서 복원
  const [currentUser, setCurrentUser] = useState('admin'); // 기본 사용자 ID
  const [userRole, setUserRole] = useState('admin');
  const [availableMenus, setAvailableMenus] = useState([]);
  const [availableSites, setAvailableSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dbManager, setDbManager] = useState(null);
  const [initialized, setInitialized] = useState(false);
  
  // 초기화 상태를 추적하기 위한 ref
  const initializationRef = useRef(false);

  // DB 매니저 초기화
  useEffect(() => {
    const initDbManager = async () => {
      try {
        const { dbManager: manager } = await import('src/lib/db-manager');
        setDbManager(manager);
      } catch (error) {
        console.warn('DB 매니저 로드 실패:', error);
        // 클라이언트 사이드용 더미 매니저
        setDbManager({
          setSite: (siteName) => {
            console.log(`현장이 ${siteName}으로 변경되었습니다.`);
          },
          setUser: (user, role) => {
            console.log(`사용자 설정: ${user} (${role})`);
          },
          hasPermission: (menu) => {
            return true; // 임시로 모든 권한 허용
          },
          getAvailableMenus: () => {
            return ['기준정보관리', '서열수신현황'];
          },
          getAvailableSites: () => {
            return ['시흥1조립장', '시흥2조립장', '화성조립장', '서산조립장'];
          },
        });
      }
    };

    initDbManager();
  }, []);

  // 사용자 접근 가능한 현장 목록 로드
  const loadUserSites = useCallback(async (userId) => {
    try {
      const response = await fetch(`/api/auth/user-sites?userId=${userId}`);
      const sites = await response.json();
      
      if (response.ok) {
        setAvailableSites(sites);
        return sites;
      } else {
        console.error('현장 목록 로드 오류:', sites.error);
        return [];
      }
    } catch (error) {
      console.error('현장 목록 API 호출 오류:', error);
      return [];
    }
  }, []);

  // 사용자 메뉴 권한 로드
  const loadUserMenus = useCallback(async (userId, siteId) => {
    try {
      const response = await fetch(`/api/auth/user-menus?userId=${userId}&siteId=${siteId}`);
      const menus = await response.json();
      
      if (response.ok) {
        setAvailableMenus(menus);
        return menus;
      } else {
        console.error('메뉴 권한 로드 오류:', menus.error);
        return [];
      }
    } catch (error) {
      console.error('메뉴 권한 API 호출 오류:', error);
      return [];
    }
  }, []);

  // 현장 변경
  const changeSite = useCallback(async (siteId) => {
    if (!dbManager || loading) return;
    
    // 이미 같은 현장이면 무시
    if (currentSite === siteId) {
      console.log('이미 같은 현장입니다:', siteId);
      return;
    }
    
    setLoading(true);
    try {
      // 현장 정보 찾기
      const site = availableSites.find(s => s.id === siteId);
      if (!site) {
        console.warn('현장 정보를 찾을 수 없습니다:', siteId);
        setLoading(false);
        return;
      }

      console.log(`현장 변경 시작: ${currentSite} → ${siteId} (${site.name})`);

      // DB 매니저에 현장 설정 (ID를 전달하면 내부에서 이름으로 변환)
      dbManager.setSite(siteId);
      
      // 현장 ID 업데이트
      setCurrentSite(siteId);
      
      // localStorage에 현장 저장
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentSite', siteId);
        console.log('현장이 localStorage에 저장됨:', siteId);
      }
      
      // 해당 현장의 사용자 메뉴 권한 로드
      const menus = await loadUserMenus(currentUser, siteId);
      
      console.log(`현장이 ${site.name}(${siteId})으로 변경되었습니다.`);
      console.log('사용 가능한 메뉴:', menus?.length || 0, '개');

      // SWR 캐시 무효화 (페이지 새로고침 대신)
      if (typeof window !== 'undefined' && window.mutate) {
        // 모든 API 캐시 무효화
        window.mutate(() => true, undefined, { revalidate: true });
        console.log('SWR 캐시 무효화 완료');
      }
      
      // 현재 페이지가 데이터를 사용하는 페이지인 경우 새로고침
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const needsRefresh = currentPath.includes('/spec-info') || 
                          currentPath.includes('/serial-receive') ||
                          currentPath.includes('/dashboard');
      
      if (needsRefresh) {
        console.log('데이터 페이지이므로 새로고침 수행');
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }, 100);
      }
      
    } catch (error) {
      console.error('현장 변경 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [dbManager, availableSites, currentUser, currentSite, loading, loadUserMenus]);

  // 사용자 설정
  const setUser = useCallback(async (userId, role) => {
    if (!dbManager || loading) return;
    
    setLoading(true);
    try {
      setCurrentUser(userId);
      setUserRole(role);
      
      // DB 매니저에 사용자 정보 설정
      dbManager.setUser(userId, role);
      
      // 사용자 접근 가능한 현장 목록 로드
      const sites = await loadUserSites(userId);
      
      // localStorage에서 저장된 현장 확인
      let savedSiteId = null;
      if (typeof window !== 'undefined') {
        savedSiteId = localStorage.getItem('currentSite');
      }
      
      // 기본 현장 설정 우선순위:
      // 1. localStorage에 저장된 현장 (사용자가 마지막에 선택한 현장)
      // 2. 현재 설정된 현장 (이미 설정되어 있는 경우)
      // 3. 첫 번째 사용 가능한 현장 (현장 목록이 있는 경우에만)
      let defaultSiteId = currentSite;
      
      if (savedSiteId && sites.find(s => s.id === savedSiteId)) {
        // 저장된 현장이 사용 가능한 현장 목록에 있으면 사용
        defaultSiteId = savedSiteId;
      } else if (!currentSite || !sites.find(s => s.id === currentSite)) {
        // 현재 현장이 없거나 사용 불가능하면 첫 번째 현장 사용 (현장 목록이 있는 경우에만)
        defaultSiteId = sites.length > 0 ? sites[0].id : null;
      }
      
      console.log('현장 설정 결정:');
      console.log('- 저장된 현장:', savedSiteId);
      console.log('- 현재 현장:', currentSite);
      console.log('- 선택된 기본 현장:', defaultSiteId);
      console.log('- 사용 가능한 현장:', sites.map(s => s.id));
      
      // 현장이 변경되었거나 초기 설정인 경우에만 변경 (defaultSiteId가 null이 아닌 경우에만)
      if (defaultSiteId && defaultSiteId !== currentSite) {
        console.log(`현장 변경 필요: ${currentSite} → ${defaultSiteId}`);
        // 현장 변경 시 loading 상태를 별도로 관리
        setLoading(false); // changeSite에서 다시 loading을 설정하므로 여기서는 해제
        await changeSite(defaultSiteId);
      } else if (defaultSiteId) {
        console.log('현장 변경 불필요, 메뉴만 로드');
        // 같은 현장이면 메뉴만 로드
        await loadUserMenus(userId, defaultSiteId);
      } else {
        console.log('설정할 현장이 없음');
      }
      
      console.log(`사용자 설정 완료: ${userId} (${role})`);
      console.log('접근 가능한 현장:', sites);
    } catch (error) {
      console.error('사용자 설정 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [dbManager, currentSite, loading, loadUserSites, changeSite, loadUserMenus]);

  // 메뉴 권한 확인 (MongoDB 기반)
  const hasMenuPermission = useCallback((menuName) => {
    // 현재 로드된 메뉴 목록에서 확인
    const hasPermission = availableMenus.some(menu => 
      menu.menuName === menuName || 
      menu.children?.some(child => child.menuName === menuName)
    );
    
    return hasPermission;
  }, [availableMenus]);

  // 사용 가능한 현장 목록 가져오기
  const getAvailableSites = useCallback(() => {
    return availableSites;
  }, [availableSites]);

  // 현재 현장 정보 가져오기
  const getCurrentSiteInfo = useCallback(() => {
    return availableSites.find(site => site.id === currentSite);
  }, [availableSites, currentSite]);

  // 초기화 - 한 번만 실행되도록 수정
  useEffect(() => {
    if (dbManager && !initializationRef.current && !initialized) {
      initializationRef.current = true;
      setInitialized(true);
      
      console.log('워크스페이스 컨텍스트 초기화 시작...');
      
      // 기본 사용자로 초기화
      const initializeUser = async () => {
        try {
          // localStorage에서 현장 복원
          let initialSite = currentSite;
          if (typeof window !== 'undefined') {
            const savedSite = localStorage.getItem('currentSite');
            if (savedSite) {
              console.log('localStorage에서 현장 복원:', savedSite);
              initialSite = savedSite;
              setCurrentSite(savedSite);
            }
          }
          
          console.log('초기 현장 설정:', initialSite);
          await setUser('admin', 'admin');
        } catch (error) {
          console.error('초기화 오류:', error);
        }
      };
      
      initializeUser();
    }
  }, [dbManager, initialized]); // currentSite 제거하여 무한 루프 방지

  const value = {
    // 상태
    currentSite,
    currentUser,
    userRole,
    availableMenus,
    availableSites,
    loading,
    
    // 액션
    changeSite,
    setUser,
    hasMenuPermission,
    getAvailableSites,
    getCurrentSiteInfo,
    loadUserSites,
    loadUserMenus,
    
    // DB 매니저 직접 접근 (필요시)
    dbManager,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
} 