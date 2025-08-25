import sql from 'mssql';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config({ path: '.env.local' });

// 데이터베이스 연결 설정
const dbConfig = {
  user: process.env.DB_USER || 'mesuser',
  password: process.env.DB_PASSWORD || 'sa123!@#',
  server: process.env.DB_SERVER || '172.16.10.104',
  port: parseInt(process.env.DB_PORT || '14233', 10),
  database: process.env.DB_NAME || 'PLAKOR_MES_SS',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// 연결 풀 생성
const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();

// 쿼리 실행 함수
export async function executeQuery(query, params = []) {
  try {
    console.log('DB 연결 시도...');
    await poolConnect;
    console.log('DB 연결 성공!');
    
    const request = pool.request();
    
    // 쿼리 파라미터 설정
    params.forEach((param, index) => {
      request.input(`param${index}`, param.value);
    });
    
    console.log('쿼리 실행:', query);
    // 쿼리 실행
    const result = await request.query(query);
    console.log('쿼리 결과:', result.recordset);
    return result.recordset;
  } catch (error) {
    console.error('SQL 쿼리 실행 오류 상세:', error);
    throw error;
  }
}

// 저장 프로시저 실행 함수
export async function executeProcedure(procedureName, params = {}) {
  await poolConnect;
  
  try {
    const request = pool.request();
    
    // 프로시저 파라미터 설정
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });
    
    // 프로시저 실행
    const result = await request.execute(procedureName);
    return result.recordset;
  } catch (error) {
    console.error('SQL 저장 프로시저 실행 오류:', error);
    throw error;
  }
}

export default {
  executeQuery,
  executeProcedure,
  sql,
  pool,
};