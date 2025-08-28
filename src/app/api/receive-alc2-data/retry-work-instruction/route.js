import { NextResponse } from 'next/server';
import { validateAndMapSite } from 'src/lib/site-config';

/**
 * 작업지시 재수행 API
 * POST /api/receive-alc2-data/retry-work-instruction
 */
export async function POST(request) {
  let dbManager;
  
  try {
    // 동적으로 DB 매니저 import
    const { dbManager: dbMgr } = await import('src/lib/db-manager');
    dbManager = dbMgr;
    
    // 요청 바디에서 파라미터 가져오기
    const body = await request.json();
    const { prodDttm, bodyNo, vinNo, commitNo, site } = body;
    
    console.log(`🔄 작업지시 재수행 API 호출 - PROD_DTTM: ${prodDttm}, BODY_NO: ${bodyNo}`);
    
    // 필수 파라미터 검증
    if (!prodDttm) {
      return NextResponse.json(
        { 
          success: false,
          error: 'PROD_DTTM 파라미터가 필요합니다.' 
        },
        { status: 400 }
      );
    }

    // 현장 정보 유효성 검증 및 매핑 (현재 세션에서 가져온 현장 정보 사용)
    const currentSite = site || 'ulsan'; // 기본값 울산
    const siteInfo = validateAndMapSite(currentSite);
    if (!siteInfo.isValid) {
      return NextResponse.json(
        { 
          success: false,
          error: siteInfo.error 
        },
        { status: 400 }
      );
    }
    
    const { siteName, dbName } = siteInfo;
    console.log(`🔄 작업지시 재수행 - 현장: ${currentSite} → ${siteName}, DB: ${dbName}`);
    
    // DB 매니저에 현장 설정
    dbManager.setSite(siteName);
    
    console.log(`📋 작업지시 재수행 쿼리 시작 - PROD_DTTM: ${prodDttm}`);
    
    // 파라미터 배열 준비
    const params = [{ name: 'param0', value: prodDttm }];
    
    // 1. TB_HKMC_LOT_TRACKING_SUBITEM 삭제
    const deleteQuery1 = `
      DELETE FROM [${dbName}].[dbo].[TB_HKMC_LOT_TRACKING_SUBITEM]
      WHERE 1 = 1
        AND PROD_DTTM = @param0
    `;
    await dbManager.executeQuery(deleteQuery1, params);
    console.log(`✅ TB_HKMC_LOT_TRACKING_SUBITEM 삭제 완료`);
    
    // 2. TB_HKMC_LOT_TRACKING 삭제
    const deleteQuery2 = `
      DELETE FROM [${dbName}].[dbo].[TB_HKMC_LOT_TRACKING]
      WHERE 1 = 1
        AND PROD_DTTM = @param0
    `;
    await dbManager.executeQuery(deleteQuery2, params);
    console.log(`✅ TB_HKMC_LOT_TRACKING 삭제 완료`);
    
    // 3. TB_PP_WORK_LIST 삭제
    const deleteQuery3 = `
      DELETE FROM [${dbName}].[dbo].[TB_PP_WORK_LIST]
      WHERE 1 = 1
        AND LEFT(WORK_ORDER_ID, 14) = @param0
    `;
    await dbManager.executeQuery(deleteQuery3, params);
    console.log(`✅ TB_PP_WORK_LIST 삭제 완료`);
    
    // 4. TB_PP_WORK_ORDER_ALC 삭제
    const deleteQuery4 = `
      DELETE FROM [${dbName}].[dbo].[TB_PP_WORK_ORDER_ALC]
      WHERE 1 = 1
        AND PROD_DTTM = @param0
    `;
    await dbManager.executeQuery(deleteQuery4, params);
    console.log(`✅ TB_PP_WORK_ORDER_ALC 삭제 완료`);
    
    // 5. TB_PP_RECEIVE_ALC2_DATA 업데이트
    const updateQuery = `
      UPDATE [${dbName}].[dbo].[TB_PP_RECEIVE_ALC2_DATA]
      SET WORK_FLAG = 'F'
      WHERE 1 = 1
        AND PROD_DTTM = @param0
    `;
    const updateResult = await dbManager.executeQuery(updateQuery, params);
    console.log(`✅ TB_PP_RECEIVE_ALC2_DATA 업데이트 완료`);
    
    // 6. 저장 프로시저 실행
    const spQuery = `EXEC [${dbName}].[dbo].[SP_PP_WORK_ORDER_ALC_C]`;
    await dbManager.executeQuery(spQuery, []);
    console.log(`✅ SP_PP_WORK_ORDER_ALC_C 저장 프로시저 실행 완료`);
    
    console.log(`🎉 작업지시 재수행 완료 - PROD_DTTM: ${prodDttm}`);
    
    return NextResponse.json({
      success: true,
      message: '작업지시 재수행이 성공적으로 완료되었습니다.',
      data: {
        prodDttm,
        bodyNo,
        vinNo,
        commitNo,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ 작업지시 재수행 오류:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || '작업지시 재수행 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}