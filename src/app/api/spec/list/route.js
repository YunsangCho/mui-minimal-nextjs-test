import { NextResponse } from 'next/server';
import { validateAndMapSite } from 'src/lib/site-config';

/**
 * 사양정보 목록 조회 API
 * GET /api/spec/list?site=현장명
 */
export async function GET(request) {
  try {
    // 동적으로 DB 매니저 import
    const { dbManager } = await import('src/lib/db-manager');
    
    // URL에서 쿼리 파라미터 가져오기
    const { searchParams } = new URL(request.url);
    const carType = searchParams.get('carType');
    const lineId = searchParams.get('lineId');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const site = searchParams.get('site'); // 현장 파라미터
    
    console.log('사양정보 목록 조회 API 호출 - 현장:', site);
    
    // 현장 정보 유효성 검증 및 매핑
    const siteInfo = validateAndMapSite(site);
    if (!siteInfo.isValid) {
      return NextResponse.json(
        { error: siteInfo.error },
        { status: 400 }
      );
    }
    
    const { siteName, dbName } = siteInfo;
    console.log(`현장 매핑: ${site} → ${siteName} → ${dbName}`);
    
    // DB 매니저에 현장 설정
    dbManager.setSite(siteName);
    
    // 기본 쿼리 구성 (현장별 데이터베이스 사용)
    let query = `
        SELECT TOP (1000) 
             [CAR_TYPE]
            ,[LINE_ID]
            ,[ALC_CODE]
            ,[TYPE]
            ,[ITEM_CD]
            ,[BODY_TYPE]
            ,[ETC_TEXT01]
            ,[ETC_TEXT02]
            ,[ETC_TEXT03]
            ,[ETC_TEXT04]
            ,[ETC_TEXT05]
            ,[ETC_TEXT06]
            ,[ETC_TEXT07]
            ,[REMARK]
            ,[INUSER]
            ,[INDATE]
            ,[UPTUSER]
            ,[UPTDATE]
            ,[IS_USE]
        FROM [${dbName}].[dbo].[TB_MD_ALC_SPEC]
        WHERE 1 = 1
    `;
    
    // 필터 조건 추가
    const params = [];
    
    if (carType && carType !== 'all') {
      query += ` AND CAR_TYPE = @param${params.length}`;
      params.push({ value: carType });
    }
    
    if (lineId && lineId !== 'all') {
      query += ` AND LINE_ID = @param${params.length}`;
      params.push({ value: lineId });
    }
    
    if (type && type !== 'all') {
      query += ` AND TYPE = @param${params.length}`;
      params.push({ value: type });
    }
    
    if (search) {
      query += ` AND (
        CAR_TYPE LIKE '%' + @param${params.length} + '%' OR
        ALC_CODE LIKE '%' + @param${params.length} + '%' OR
        ITEM_CD LIKE '%' + @param${params.length} + '%' OR
        TYPE LIKE '%' + @param${params.length} + '%'
      )`;
      params.push({ value: search });
    }
    
    // 정렬 추가
    query += ` ORDER BY INDATE DESC`;
    
    console.log(`[${siteName}] 쿼리 실행:`, query);
    
    // DB 매니저를 통해 쿼리 실행
    const result = await dbManager.executeQuery(query, params);
    
    console.log(`[${siteName}] 조회 결과:`, result.length, '건');
    
    return NextResponse.json({ specs: result }, { status: 200 });

  } catch (error) {
    console.error('사양정보 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '사양정보 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 