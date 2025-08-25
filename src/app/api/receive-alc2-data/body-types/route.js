import { NextResponse } from 'next/server';
import { validateAndMapSite } from 'src/lib/site-config';

/**
 * BODY_TYPE 목록 조회 API
 * GET /api/receive-alc2-data/body-types?site=현장명
 */
export async function GET(request) {
  try {
    // 동적으로 DB 매니저 import
    const { dbManager } = await import('src/lib/db-manager');
    
    // URL에서 현장 파라미터 가져오기
    const { searchParams } = new URL(request.url);
    const site = searchParams.get('site');
    
    // 현장 정보 유효성 검증 및 매핑
    const siteInfo = validateAndMapSite(site);
    if (!siteInfo.isValid) {
      return NextResponse.json(
        { error: siteInfo.error },
        { status: 400 }
      );
    }
    
    const { siteName, dbName } = siteInfo;
    console.log(`BODY_TYPE 목록 조회 - 현장: ${site} → ${siteName}, DB: ${dbName}`);
    
    // DB 매니저에 현장 설정
    dbManager.setSite(siteName);
    
    // BODY_TYPE 조회 쿼리 (운영테이블과 백업테이블 모두 포함)
    const query = `
      SELECT DISTINCT [BODY_TYPE]
      FROM (
        SELECT [BODY_TYPE]
        FROM [${dbName}].[dbo].[TB_PP_RECEIVE_ALC2_DATA]
        WHERE [BODY_TYPE] IS NOT NULL AND [BODY_TYPE] != ''
        
        UNION
        
        SELECT [BODY_TYPE]
        FROM [${dbName}].[dbo].[TB_PP_RECEIVE_ALC2_DATA_RAW]
        WHERE [BODY_TYPE] IS NOT NULL AND [BODY_TYPE] != ''
      ) AS combined_data
      ORDER BY [BODY_TYPE]
    `;
    
    const result = await dbManager.executeQuery(query, []);
    
    // BODY_TYPE 목록 추출
    const bodyTypes = result.map(row => row.BODY_TYPE);
    
    console.log(`📋 BODY_TYPE 목록 조회 완료: ${bodyTypes.length}개`);
    
    return NextResponse.json({
      success: true,
      bodyTypes
    });

  } catch (error) {
    console.error('BODY_TYPE 목록 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'BODY_TYPE 목록 조회 중 오류가 발생했습니다.',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 