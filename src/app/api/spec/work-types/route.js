import { NextResponse } from 'next/server';
import { validateAndMapSite } from 'src/lib/site-config';

/**
 * 타입(TYPE) 목록 조회 API
 * GET /api/spec/work-types?carType=JA&site=현장명
 */
export async function GET(request) {
  try {
    // 동적으로 DB 매니저 import
    const { dbManager } = await import('src/lib/db-manager');
    
    const { searchParams } = new URL(request.url);
    const carType = searchParams.get('carType');
    const site = searchParams.get('site'); // 기본값 제거

    if (!carType) {
      return NextResponse.json(
        { error: 'carType 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 현장 정보 유효성 검증 및 매핑
    const siteInfo = validateAndMapSite(site);
    if (!siteInfo.isValid) {
      return NextResponse.json(
        { error: siteInfo.error },
        { status: 400 }
      );
    }
    
    const { siteName, dbName } = siteInfo;
    console.log(`타입 목록 조회 - 현장: ${site} → ${siteName}, DB: ${dbName}, 차종: ${carType}`);

    // DB 매니저에 현장 설정
    dbManager.setSite(siteName);

    // 실제 사양정보 테이블에서 해당 차종의 타입 목록 조회
    const query = `
      SELECT DISTINCT TYPE
      FROM [${dbName}].[dbo].[TB_MD_ALC_SPEC]
      WHERE 1 = 1
        AND CAR_TYPE = @param0
        AND TYPE IS NOT NULL 
        AND TYPE != ''
      ORDER BY TYPE
    `;

    const params = [{ value: carType }];
    const result = await dbManager.executeQuery(query, params);

    console.log(`[${siteName}] ${carType} 차종의 타입 목록 조회 결과:`, result.length, '건');

    // TYPE 값을 {value, label} 형태로 변환
    const types = result.map(item => ({
      value: item.TYPE,
      label: item.TYPE
    }));

    return NextResponse.json({ types }, { status: 200 });
  } catch (error) {
    console.error('타입 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '타입 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 