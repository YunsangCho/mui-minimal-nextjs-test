import { NextResponse } from 'next/server';
import { validateAndMapSite } from 'src/lib/site-config';

/**
 * 사양정보 생성 API
 * POST /api/spec/create?site=현장명
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
    console.log(`사양정보 생성 - 현장: ${site} → ${siteName}, DB: ${dbName}`);
    
    // 요청 본문에서 데이터 추출
    const specData = await request.json();
    
    // 필수 필드 검증
    const requiredFields = ['CAR_TYPE', 'LINE_ID', 'ALC_CODE', 'TYPE', 'ITEM_CD', 'BODY_TYPE'];
    for (const field of requiredFields) {
      if (!specData[field]) {
        return NextResponse.json(
          { error: `${field} 필드는 필수입니다.` },
          { status: 400 }
        );
      }
    }
    
    // 현재 시간
    const now = new Date().toISOString();
    
    // DB 매니저에 현장 설정
    dbManager.setSite(siteName);
    
    // SQL 쿼리 구성 - 동적 DB 이름 사용
    const query = `
      INSERT INTO [${dbName}].[dbo].[TB_MD_ALC_SPEC] (
        [CAR_TYPE],
        [LINE_ID],
        [ALC_CODE],
        [TYPE],
        [ITEM_CD],
        [BODY_TYPE],
        [ETC_TEXT01],
        [ETC_TEXT02],
        [ETC_TEXT03],
        [ETC_TEXT04],
        [ETC_TEXT05],
        [ETC_TEXT06],
        [ETC_TEXT07],
        [REMARK],
        [INUSER],
        [INDATE],
        [UPTUSER],
        [UPTDATE],
        [IS_USE],
        [GUBUN],
        [PLANT]
      )
      VALUES (
        @param0,
        @param1,
        @param2,
        @param3,
        @param4,
        @param5,
        @param6,
        @param7,
        @param8,
        @param9,
        @param10,
        @param11,
        @param12,
        @param13,
        @param14,
        @param15,
        @param16,
        @param17,
        @param18,
        @param19,
        @param20
      )
    `;
    
    // 파라미터 배열 구성
    const params = [
      { value: specData.CAR_TYPE },
      { value: specData.LINE_ID },
      { value: specData.ALC_CODE },
      { value: specData.TYPE },
      { value: specData.ITEM_CD },
      { value: specData.BODY_TYPE },
      { value: specData.ETC_TEXT01 || '' },
      { value: specData.ETC_TEXT02 || '' },
      { value: specData.ETC_TEXT03 || '' },
      { value: specData.ETC_TEXT04 || '' },
      { value: specData.ETC_TEXT05 || '' },
      { value: specData.ETC_TEXT06 || '' },
      { value: specData.ETC_TEXT07 || '' },
      { value: specData.REMARK || '' },
      { value: specData.INUSER || 'SYSTEM' },
      { value: now },
      { value: specData.UPTUSER || 'SYSTEM' },
      { value: now },
      { value: specData.IS_USE || 'Y' },
      { value: specData.GUBUN || '' },
      { value: specData.PLANT || '' }
    ];
    
    // DB 매니저를 통해 쿼리 실행
    await dbManager.executeQuery(query, params);
    
    return NextResponse.json(
      { message: '사양정보가 성공적으로 생성되었습니다.' },
      { status: 201 }
    );

  } catch (error) {
    console.error('사양정보 생성 오류:', error);
    return NextResponse.json(
      { error: '사양정보 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 