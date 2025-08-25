/**
 * 현장 정보 및 데이터베이스 매핑 설정
 * 모든 API에서 공통으로 사용되는 현장 관련 설정을 중앙 관리
 */

// 현장 ID와 이름 매핑
export const SITE_ID_TO_NAME = {
  'SS': '서산조립장',
  'SH1': '시흥1조립장', 
  'SH2': '시흥2조립장',
  'HS': '화성조립장',
};

// 현장별 데이터베이스 이름 매핑
export const SITE_DB_MAPPING = {
  // 현장 ID로 매핑
  'SS': 'PLAKOR_MES_SS',
  'SH1': 'PLAKOR_MES_SH1',
  'SH2': 'PLAKOR_MES_SH2',
  'HS': 'PLAKOR_DJ_MES',
  
  // 현장 이름으로도 매핑 (하위 호환성)
  '서산조립장': 'PLAKOR_MES_SS',
  '시흥1조립장': 'PLAKOR_MES_SH1',
  '시흥2조립장': 'PLAKOR_MES_SH2',
  '화성조립장': 'PLAKOR_DJ_MES',
};

/**
 * 현장 ID를 현장 이름으로 변환
 * @param {string} siteId - 현장 ID (예: 'SS', 'SH1')
 * @returns {string} 현장 이름 (예: '서산조립장', '시흥1조립장')
 */
export function getSiteName(siteId) {
  return SITE_ID_TO_NAME[siteId] || siteId;
}

/**
 * 현장 정보로 데이터베이스 이름 조회
 * @param {string} site - 현장 ID 또는 현장 이름
 * @returns {string|null} 데이터베이스 이름 또는 null
 */
export function getDatabaseName(site) {
  if (!site) return null;
  
  // 먼저 현장 ID로 찾기
  if (SITE_DB_MAPPING[site]) {
    return SITE_DB_MAPPING[site];
  }
  
  // 현장 이름으로 찾기
  const siteName = getSiteName(site);
  return SITE_DB_MAPPING[siteName] || null;
}

/**
 * 지원되는 현장인지 확인
 * @param {string} site - 현장 ID 또는 현장 이름
 * @returns {boolean} 지원 여부
 */
export function isSupportedSite(site) {
  return getDatabaseName(site) !== null;
}

/**
 * 모든 현장 목록 조회
 * @returns {Array} 현장 정보 배열 [{id, name, database}, ...]
 */
export function getAllSites() {
  return Object.entries(SITE_ID_TO_NAME).map(([id, name]) => ({
    id,
    name,
    database: SITE_DB_MAPPING[id]
  }));
}

/**
 * 현장 정보 유효성 검증 및 매핑
 * @param {string} site - 현장 파라미터
 * @returns {Object} {isValid, siteId, siteName, dbName, error}
 */
export function validateAndMapSite(site) {
  if (!site) {
    return {
      isValid: false,
      error: '현장 파라미터(site)가 필요합니다.'
    };
  }
  
  const siteName = getSiteName(site);
  const dbName = getDatabaseName(site);
  
  if (!dbName) {
    return {
      isValid: false,
      error: `지원하지 않는 현장입니다: ${site}`
    };
  }
  
  return {
    isValid: true,
    siteId: site,
    siteName,
    dbName,
    error: null
  };
} 