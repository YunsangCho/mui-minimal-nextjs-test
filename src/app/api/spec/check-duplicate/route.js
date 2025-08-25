import { NextResponse } from 'next/server';
import { validateAndMapSite } from 'src/lib/site-config';

/**
 * 사양정보 중복 검증 API
 * POST /api/spec/check-duplicate?site=현장명
 */
export async function POST(request) {
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
    console.log(`사양정보 중복검증 - 현장: ${site} → ${siteName}, DB: ${dbName}`);
    
    // DB 매니저에 현장 설정
    dbManager.setSite(siteName);
    
    const { checkData, currentData } = await request.json();

    if (!checkData) {
      return NextResponse.json(
        { error: '검증할 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    let query = '';
    const params = [];

    // 복합키 중복 검증 (CAR_TYPE, TYPE, LINE_ID, ALC_CODE)
    if (checkData.CAR_TYPE && checkData.TYPE && checkData.LINE_ID && checkData.ALC_CODE) {
      query = `
        SELECT COUNT(*) as count
        FROM [${dbName}].[dbo].[TB_MD_ALC_SPEC]
        WHERE CAR_TYPE = @param0
          AND TYPE = @param1
          AND LINE_ID = @param2
          AND ALC_CODE = @param3
      `;
      
      params.push(
        { value: checkData.CAR_TYPE },
        { value: checkData.TYPE },
        { value: checkData.LINE_ID },
        { value: checkData.ALC_CODE }
      );

      // 현재 수정 중인 데이터는 제외 (자기 자신 제외)
      if (currentData && currentData.CAR_TYPE && currentData.LINE_ID && 
          currentData.ALC_CODE && currentData.TYPE && currentData.ITEM_CD) {
        query += ` AND NOT (CAR_TYPE = @param4 AND LINE_ID = @param5 AND ALC_CODE = @param6 AND TYPE = @param7 AND ITEM_CD = @param8)`;
        params.push(
          { value: currentData.CAR_TYPE },
          { value: currentData.LINE_ID },
          { value: currentData.ALC_CODE },
          { value: currentData.TYPE },
          { value: currentData.ITEM_CD }
        );
      }
    }
    // ITEM_CD 단일 필드 중복 검증
    else if (checkData.ITEM_CD) {
      query = `
        SELECT COUNT(*) as count
        FROM [${dbName}].[dbo].[TB_MD_ALC_SPEC]
        WHERE ITEM_CD = @param0
      `;
      
      params.push({ value: checkData.ITEM_CD });

      // 현재 수정 중인 데이터는 제외 (자기 자신 제외)
      if (currentData && currentData.CAR_TYPE && currentData.LINE_ID && 
          currentData.ALC_CODE && currentData.TYPE && currentData.ITEM_CD) {
        query += ` AND NOT (CAR_TYPE = @param1 AND LINE_ID = @param2 AND ALC_CODE = @param3 AND TYPE = @param4 AND ITEM_CD = @param5)`;
        params.push(
          { value: currentData.CAR_TYPE },
          { value: currentData.LINE_ID },
          { value: currentData.ALC_CODE },
          { value: currentData.TYPE },
          { value: currentData.ITEM_CD }
        );
      }
    }
    else {
      return NextResponse.json(
        { error: '유효하지 않은 검증 데이터입니다.' },
        { status: 400 }
      );
    }

    // 쿼리 실행
    const result = await dbManager.executeQuery(query, params);
    const count = result[0]?.count || 0;

    // 중복 여부 반환
    const isDuplicate = count > 0;

    return NextResponse.json({ isDuplicate }, { status: 200 });

  } catch (error) {
    console.error('중복 검증 오류:', error);
    return NextResponse.json(
      { error: '중복 검증 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 