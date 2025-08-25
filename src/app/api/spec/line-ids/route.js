import { NextResponse } from 'next/server';
import { validateAndMapSite } from 'src/lib/site-config';

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
    console.log(`LINE_ID 목록 조회 요청 - 현장: ${site} → ${siteName}, DB: ${dbName}`);

    // DB 매니저에 현장 설정
    dbManager.setSite(siteName);

    // LINE_ID 목록 조회
    const query = `
      SELECT DISTINCT LINE_ID
      FROM [${dbName}].[dbo].[TB_MD_ALC_SPEC]
      WHERE LINE_ID IS NOT NULL 
        AND LINE_ID != ''
      ORDER BY LINE_ID
    `;

    const result = await dbManager.executeQuery(query);
    
    console.log(`[${siteName}] LINE_ID 목록 조회 결과:`, result.length, '건');

    // 응답 데이터 포맷
    const lineIds = result.map(row => ({
      value: row.LINE_ID,
      label: row.LINE_ID
    }));

    return NextResponse.json({
      success: true,
      lineIds
    });

  } catch (error) {
    console.error('LINE_ID 목록 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'LINE_ID 목록을 불러오는데 실패했습니다.',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 