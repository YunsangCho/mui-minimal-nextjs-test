import { NextResponse } from 'next/server';
import { validateAndMapSite } from 'src/lib/site-config';

/**
 * 사양정보 업데이트 API
 * PUT /api/spec/update?site=현장명
 */
export async function PUT(request) {
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
    console.log(`사양정보 업데이트 - 현장: ${site} → ${siteName}, DB: ${dbName}`);
    
    // DB 매니저에 현장 설정
    dbManager.setSite(siteName);
    
    // 요청 본문에서 데이터 추출
    const data = await request.json();
    const { originalKey, updateData } = data;
    
    // 복합키 필수 파라미터 확인 (기존 데이터 식별용)
    if (!originalKey || !originalKey.CAR_TYPE || !originalKey.LINE_ID || 
        !originalKey.ALC_CODE || !originalKey.TYPE || !originalKey.ITEM_CD) {
      return NextResponse.json(
        { error: '원본 데이터 식별을 위한 필수 파라미터가 누락되었습니다. (CAR_TYPE, LINE_ID, ALC_CODE, TYPE, ITEM_CD)' },
        { status: 400 }
      );
    }
    
    if (!updateData) {
      return NextResponse.json(
        { error: '업데이트할 데이터가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 현재 시간
    const now = new Date().toISOString();
    
    // 업데이트 전 항목 확인
    const checkQuery = `
      SELECT COUNT(*) as cnt 
      FROM [${dbName}].[dbo].[TB_MD_ALC_SPEC] 
      WHERE CAR_TYPE = @param0 
        AND LINE_ID = @param1 
        AND ALC_CODE = @param2 
        AND TYPE = @param3 
        AND ITEM_CD = @param4
    `;
    
    const checkParams = [
      { value: originalKey.CAR_TYPE },
      { value: originalKey.LINE_ID },
      { value: originalKey.ALC_CODE },
      { value: originalKey.TYPE },
      { value: originalKey.ITEM_CD }
    ];
    
    const checkResult = await dbManager.executeQuery(checkQuery, checkParams);
    
    if (!checkResult.length || checkResult[0].cnt === 0) {
      return NextResponse.json(
        { error: '업데이트할 사양정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // 업데이트할 필드 구성
    const updateFields = [];
    const updateParams = [];
    let paramIndex = 0;
    
    // 업데이트 가능한 필드들
    const allowedFields = [
      'CAR_TYPE', 'LINE_ID', 'ALC_CODE', 'TYPE', 'ITEM_CD', 'BODY_TYPE',
      'ETC_TEXT01', 'ETC_TEXT02', 'ETC_TEXT03', 'ETC_TEXT04', 
      'ETC_TEXT05', 'ETC_TEXT06', 'ETC_TEXT07', 'REMARK',
      'INUSER', 'UPTUSER'
    ];
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updateFields.push(`${field} = @param${paramIndex}`);
        updateParams.push({ value: updateData[field] });
        paramIndex++;
      }
    }
    
    // 업데이트 시간 자동 설정
    updateFields.push(`UPTDATE = @param${paramIndex}`);
    updateParams.push({ value: now });
    paramIndex++;
    
    if (updateFields.length === 1) { // UPTDATE만 있는 경우
      return NextResponse.json(
        { error: '업데이트할 필드가 없습니다.' },
        { status: 400 }
      );
    }
    
    // WHERE 조건 파라미터 추가
    const whereParams = [
      { value: originalKey.CAR_TYPE },
      { value: originalKey.LINE_ID },
      { value: originalKey.ALC_CODE },
      { value: originalKey.TYPE },
      { value: originalKey.ITEM_CD }
    ];
    
    // 전체 파라미터 배열
    const allParams = [...updateParams, ...whereParams];
    
    // UPDATE 쿼리 구성
    const updateQuery = `
      UPDATE [${dbName}].[dbo].[TB_MD_ALC_SPEC] 
      SET ${updateFields.join(', ')}
      WHERE CAR_TYPE = @param${paramIndex} 
        AND LINE_ID = @param${paramIndex + 1} 
        AND ALC_CODE = @param${paramIndex + 2} 
        AND TYPE = @param${paramIndex + 3} 
        AND ITEM_CD = @param${paramIndex + 4}
    `;
    
    // 업데이트 실행
    await dbManager.executeQuery(updateQuery, allParams);
    
    return NextResponse.json(
      { message: '사양정보가 성공적으로 업데이트되었습니다.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('사양정보 업데이트 오류:', error);
    return NextResponse.json(
      { error: '사양정보 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 