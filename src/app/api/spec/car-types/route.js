import { NextResponse } from 'next/server';
import { validateAndMapSite } from 'src/lib/site-config';

/**
 * 차종(CAR_TYPE) 목록 조회 API
 * GET /api/spec/car-types?site=현장명
 */
export async function GET(request) {
  try {
    // 동적으로 DB 매니저 import
    const { dbManager } = await import('src/lib/db-manager');
    
    // URL에서 현장 파라미터 가져오기
    const { searchParams } = new URL(request.url);
    const site = searchParams.get('site'); // 기본값 제거
    
    // 현장 정보 유효성 검증 및 매핑
    const siteInfo = validateAndMapSite(site);
    if (!siteInfo.isValid) {
      return NextResponse.json(
        { error: siteInfo.error },
        { status: 400 }
      );
    }
    
    const { siteName, dbName } = siteInfo;
    console.log(`차종 목록 조회 - 현장: ${site} → ${siteName}, DB: ${dbName}`);
    
    // DB 매니저에 현장 설정
    dbManager.setSite(siteName);
    
    const query = `
      SELECT CARCODE AS CODE
           , CARCODE + ' : ' + BODYTYPE + '(' + CARNAME + ')' AS LABEL
      FROM [${dbName}].[dbo].[TB_MD_CARCODE]
      ORDER BY CARCODE
    `;

    const result = await dbManager.executeQuery(query, []);
    
    console.log(`[${siteName}] 차종 목록 조회 결과:`, result.length, '건');

    return NextResponse.json({
      success: true,
      carTypes: result
    }, { status: 200 });
  } catch (error) {
    console.error('차종 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '차종 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 