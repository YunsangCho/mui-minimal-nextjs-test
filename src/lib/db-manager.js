let dbManager = {};
let executeQuery = async () => {
  throw new Error('DB operations are only available on server side');
};
let executeProcedure = async () => {
  throw new Error('DB operations are only available on server side');
};

// 현장 설정을 공통 모듈에서 가져오기
import { SITE_ID_TO_NAME } from './site-config.js';

// 현장 이름과 ID 매핑 (역방향)
const SITE_NAME_TO_ID = Object.fromEntries(
  Object.entries(SITE_ID_TO_NAME).map(([id, name]) => [name, id])
);

// 현장별 권한 설정 (클라이언트에서도 사용 가능)
const SITE_PERMISSIONS = {
  '시흥1조립장': {
    menus: ['기준정보관리', '서열수신관리', '생산관리'],
    roles: ['admin', 'manager', 'operator'],
  },
  '시흥2조립장': {
    menus: ['기준정보관리', '서열수신관리', '품질관리'],
    roles: ['admin', 'manager', 'operator'],
  },
  '화성조립장': {
    menus: ['기준정보관리', '서열수신관리', '자재관리'],
    roles: ['admin', 'manager'],
  },
  '서산조립장': {
    menus: ['기준정보관리', '서열수신관리'],
    roles: ['admin', 'manager', 'operator', 'viewer'],
  },
};

// 클라이언트 사이드용 더미 매니저
class ClientDatabaseManager {
  constructor() {
    this.currentSite = null;
    this.currentSiteId = null;
    this.currentUser = null;
    this.userRole = 'operator';
  }

  setSite(siteIdOrName) {
    // ID가 전달된 경우 이름으로 변환
    let siteName = siteIdOrName;
    let siteId = siteIdOrName;
    
    if (SITE_ID_TO_NAME[siteIdOrName]) {
      siteName = SITE_ID_TO_NAME[siteIdOrName];
      siteId = siteIdOrName;
    } else if (SITE_NAME_TO_ID[siteIdOrName]) {
      siteName = siteIdOrName;
      siteId = SITE_NAME_TO_ID[siteIdOrName];
    }
    
    this.currentSite = siteName;
    this.currentSiteId = siteId;
    console.log(`현장이 ${siteName}(${siteId})으로 변경되었습니다.`);
  }

  setUser(user, role) {
    this.currentUser = user;
    this.userRole = role;
  }

  hasPermission(menu, siteName = null) {
    const targetSite = siteName || this.currentSite;
    const sitePermissions = SITE_PERMISSIONS[targetSite];
    
    if (!sitePermissions) {
      return false;
    }

    const hasMenuPermission = sitePermissions.menus.includes(menu);
    const hasRolePermission = sitePermissions.roles.includes(this.userRole);
    
    return hasMenuPermission && hasRolePermission;
  }

  getAvailableMenus(siteName = null) {
    const targetSite = siteName || this.currentSite;
    const sitePermissions = SITE_PERMISSIONS[targetSite];
    
    if (!sitePermissions) {
      return [];
    }

    if (!sitePermissions.roles.includes(this.userRole)) {
      return [];
    }

    return sitePermissions.menus;
  }

  getCurrentSite() {
    return this.currentSite;
  }

  getAvailableSites() {
    return Object.keys(SITE_PERMISSIONS);
  }

  async executeQuery() {
    throw new Error('DB operations are only available on server side');
  }

  async executeProcedure() {
    throw new Error('DB operations are only available on server side');
  }
}

// 서버 사이드에서만 실행
if (typeof window === 'undefined') {
  try {
    // 서버 사이드에서만 실제 DB 모듈 로드
    const sql = require('mssql');
    const dotenv = require('dotenv');

    // 환경 변수 로드
    dotenv.config({ path: '.env.local' });

    // 현장별 DB 설정 (기본 설정)
    const BASE_DB_CONFIGS = {
      '시흥1조립장': {
        user: process.env.DB_USER_SH1 || 'mesuser',
        password: process.env.DB_PASSWORD_SH1 || 'sa123!@#',
        server: process.env.DB_SERVER_SH1 || '172.16.30.3',
        port: parseInt(process.env.DB_PORT_SH1 || '14233', 10),
        database: process.env.DB_NAME_SH1 || 'PLAKOR_MES_SH1',
        options: {
          encrypt: process.env.DB_ENCRYPT === 'false',
          trustServerCertificate: true,
          enableArithAbort: true,
        },
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000,
        },
      },
      '시흥2조립장': {
        user: process.env.DB_USER_SH2 || 'sa',
        password: process.env.DB_PASSWORD_SH2 || 'sa123!@#',
        server: process.env.DB_SERVER_SH2 || '172.16.70.5',
        port: parseInt(process.env.DB_PORT_SH2 || '14233', 10),
        database: process.env.DB_NAME_SH2 || 'PLAKOR_MES_SH2',
        options: {
          encrypt: process.env.DB_ENCRYPT === 'false',
          trustServerCertificate: true,
          enableArithAbort: true,
        },
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000,
        },
      },
      '화성조립장': {
        user: process.env.DB_USER_HS || 'mesuser',
        password: process.env.DB_PASSWORD_HS || 'Root1234!~A',
        server: process.env.DB_SERVER_HS || '172.16.61.5',
        port: parseInt(process.env.DB_PORT_HS || '14233', 10),
        database: process.env.DB_NAME_HS || 'PLAKOR_DJ_MES',
        options: {
          encrypt: process.env.DB_ENCRYPT === 'false',
          trustServerCertificate: true,
          enableArithAbort: true,
        },
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000,
        },
      },
      '서산조립장': {
        user: process.env.DB_USER_SS || 'mesuser',
        password: process.env.DB_PASSWORD_SS || 'sa123!@#',
        server: process.env.DB_SERVER_SS || '172.16.10.104',
        port: parseInt(process.env.DB_PORT_SS || '14233', 10),
        database: process.env.DB_NAME_SS || 'PLAKOR_MES_SS',
        options: {
          encrypt: process.env.DB_ENCRYPT === 'false',
          trustServerCertificate: true,
          enableArithAbort: true,
        },
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000,
        },
      },
    };

    // 현장 ID와 이름 모두로 접근할 수 있도록 확장된 DB 설정
    const DB_CONFIGS = {
      // 한국어 현장명으로 접근
      ...BASE_DB_CONFIGS,
      // 영어 코드로도 접근 가능하도록 추가
      'SH1': BASE_DB_CONFIGS['시흥1조립장'],
      'SH2': BASE_DB_CONFIGS['시흥2조립장'],
      'HS': BASE_DB_CONFIGS['화성조립장'],
      'SS': BASE_DB_CONFIGS['서산조립장'],
    };

    class DatabaseManager extends ClientDatabaseManager {
      constructor() {
        super();
        if (DatabaseManager.instance) {
          return DatabaseManager.instance;
        }
        
        this.pools = new Map();
        DatabaseManager.instance = this;
      }

      // 현장 변경 시 기존 연결 정리 및 새 현장 설정
      setSite(siteIdOrName) {
        const previousSite = this.currentSite;
        
        // 부모 클래스의 setSite 호출
        super.setSite(siteIdOrName);
        
        // 이전 현장과 다른 경우 연결 정리
        if (previousSite !== this.currentSite) {
          console.log(`현장 변경: ${previousSite} → ${this.currentSite}`);
          
          // 이전 현장 연결 정리 (비동기로 실행하여 블로킹 방지)
          if (previousSite && this.pools.has(previousSite)) {
            setTimeout(async () => {
              try {
                await this.closeSite(previousSite);
                console.log(`이전 현장(${previousSite}) 연결 정리 완료`);
              } catch (error) {
                console.error(`이전 현장(${previousSite}) 연결 정리 오류:`, error);
              }
            }, 1000); // 1초 후 정리
          }
          
          // 새 현장 연결 미리 준비 (선택적)
          setTimeout(async () => {
            try {
              await this.getPool();
              console.log(`새 현장(${this.currentSite}) 연결 준비 완료`);
            } catch (error) {
              console.warn(`새 현장(${this.currentSite}) 연결 준비 실패:`, error.message);
            }
          }, 500); // 0.5초 후 준비
        }
      }

      // 현재 현장의 DB 연결 풀 가져오기
      async getPool() {
        const targetSite = this.currentSite;
        
        if (!DB_CONFIGS[targetSite]) {
          throw new Error(`지원하지 않는 현장입니다: ${targetSite}`);
        }

        // 이미 연결된 풀이 있으면 반환
        if (this.pools.has(targetSite)) {
          const pool = this.pools.get(targetSite);
          if (pool.connected) {
            return pool;
          }
        }

        // 새로운 연결 풀 생성
        const config = DB_CONFIGS[targetSite];
        const pool = new sql.ConnectionPool(config);
        
        try {
          await pool.connect();
          this.pools.set(targetSite, pool);
          console.log(`${targetSite} DB 연결 성공`);
          return pool;
        } catch (error) {
          console.error(`${targetSite} DB 연결 실패:`, error);
          throw error;
        }
      }

      // 쿼리 실행
      async executeQuery(query, params = [], siteName = null) {
        try {
          const pool = await this.getPool();
          const request = pool.request();
          
          // 쿼리 파라미터 설정
          params.forEach((param, index) => {
            request.input(`param${index}`, param.value);
          });
          
          console.log(`[${siteName || this.currentSite}] 쿼리 실행:`, query);
          const result = await request.query(query);
          console.log(`[${siteName || this.currentSite}] 쿼리 결과:`, result.recordset?.length || 0, '건');
          
          return result.recordset;
        } catch (error) {
          console.error(`[${siteName || this.currentSite}] SQL 쿼리 실행 오류:`, error);
          throw error;
        }
      }

      // 저장 프로시저 실행
      async executeProcedure(procedureName, params = {}, siteName = null) {
        try {
          const pool = await this.getPool();
          const request = pool.request();
          
          // 프로시저 파라미터 설정
          Object.entries(params).forEach(([key, value]) => {
            request.input(key, value);
          });
          
          console.log(`[${siteName || this.currentSite}] 프로시저 실행:`, procedureName);
          const result = await request.execute(procedureName);
          
          return result.recordset;
        } catch (error) {
          console.error(`[${siteName || this.currentSite}] 저장 프로시저 실행 오류:`, error);
          throw error;
        }
      }

      // 연결 종료
      async closeAll() {
        for (const [siteName, pool] of this.pools) {
          try {
            await pool.close();
            console.log(`${siteName} DB 연결 종료`);
          } catch (error) {
            console.error(`${siteName} DB 연결 종료 오류:`, error);
          }
        }
        this.pools.clear();
      }

      // 특정 현장 연결 종료
      async closeSite(siteName) {
        if (this.pools.has(siteName)) {
          try {
            const pool = this.pools.get(siteName);
            await pool.close();
            this.pools.delete(siteName);
            console.log(`${siteName} DB 연결 종료`);
          } catch (error) {
            console.error(`${siteName} DB 연결 종료 오류:`, error);
          }
        }
      }
    }

    // 싱글톤 인스턴스 생성
    dbManager = new DatabaseManager();

    // 기존 함수들을 래핑하여 호환성 유지
    executeQuery = async (query, params = []) => {
      return dbManager.executeQuery(query, params);
    };

    executeProcedure = async (procedureName, params = {}) => {
      return dbManager.executeProcedure(procedureName, params);
    };

  } catch (error) {
    console.warn('DB 모듈 로드 실패, 클라이언트 모드로 실행:', error.message);
    // DB 모듈 로드 실패 시 클라이언트 모드로 폴백
    dbManager = new ClientDatabaseManager();
    executeQuery = async () => {
      throw new Error('DB operations are only available on server side');
    };
    executeProcedure = async () => {
      throw new Error('DB operations are only available on server side');
    };
  }
} else {
  // 클라이언트 사이드
  dbManager = new ClientDatabaseManager();
  executeQuery = async () => {
    throw new Error('DB operations are only available on server side');
  };
  executeProcedure = async () => {
    throw new Error('DB operations are only available on server side');
  };
}

export { dbManager, executeQuery, executeProcedure };
export default dbManager; 