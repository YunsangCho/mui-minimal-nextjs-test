import { NextResponse } from 'next/server';
import { validateAndMapSite } from 'src/lib/site-config';

/**
 * 사양정보 삭제 API
 * DELETE /api/spec/delete?site=현장명
 */
export async function DELETE(request) {
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
    console.log(`사양정보 삭제 - 현장: ${site} → ${siteName}, DB: ${dbName}`);
    
    // DB 매니저에 현장 설정
    dbManager.setSite(siteName);
    
    // 요청 본문에서 데이터 추출
    const data = await request.json();
    const { keys } = data; // 삭제할 키 목록
    
    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json(
        { error: '삭제할 항목의 키 정보가 필요합니다.' },
        { status: 400 }
      );
    }
    
    let deletedCount = 0;
    const errors = [];
    
    // 각 키에 대해 삭제 실행
    for (const key of keys) {
      try {
        // 필수 키 필드 확인
        if (!key.CAR_TYPE || !key.LINE_ID || !key.ALC_CODE || !key.TYPE || !key.ITEM_CD) {
          errors.push(`키 정보가 불완전합니다: ${JSON.stringify(key)}`);
          continue;
        }
        
        // 삭제 전 존재 여부 확인
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
          { value: key.CAR_TYPE },
          { value: key.LINE_ID },
          { value: key.ALC_CODE },
          { value: key.TYPE },
          { value: key.ITEM_CD }
        ];
        
        const checkResult = await dbManager.executeQuery(checkQuery, checkParams);
        
        if (!checkResult.length || checkResult[0].cnt === 0) {
          errors.push(`삭제할 항목을 찾을 수 없습니다: ${key.CAR_TYPE}-${key.LINE_ID}-${key.ALC_CODE}-${key.TYPE}-${key.ITEM_CD}`);
          continue;
        }
        
        // 삭제 쿼리 실행
        const deleteQuery = `
          DELETE FROM [${dbName}].[dbo].[TB_MD_ALC_SPEC] 
          WHERE CAR_TYPE = @param0 
            AND LINE_ID = @param1 
            AND ALC_CODE = @param2 
            AND TYPE = @param3 
            AND ITEM_CD = @param4
        `;
        
        await dbManager.executeQuery(deleteQuery, checkParams);
        deletedCount++;
        
      } catch (error) {
        console.error(`개별 삭제 오류 (${JSON.stringify(key)}):`, error);
        errors.push(`삭제 실패: ${key.CAR_TYPE}-${key.LINE_ID}-${key.ALC_CODE}-${key.TYPE}-${key.ITEM_CD} - ${error.message}`);
      }
    }
    
    // 결과 반환
    const response = {
      message: `${deletedCount}개 항목이 성공적으로 삭제되었습니다.`,
      deletedCount,
      totalRequested: keys.length,
      errors: errors.length > 0 ? errors : undefined
    };
    
    if (deletedCount === 0) {
      return NextResponse.json(
        { error: '삭제된 항목이 없습니다.', ...response },
        { status: 400 }
      );
    }
    
    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('사양정보 삭제 오류:', error);
    return NextResponse.json(
      { error: '사양정보 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 