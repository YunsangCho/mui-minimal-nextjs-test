import { NextResponse } from 'next/server';
import { validateAndMapSite } from 'src/lib/site-config';

/**
 * 서열수신현황 전체 데이터 엑셀 다운로드 API
 * GET /api/receive-alc2-data/export?site=현장명&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&bodyType=타입&commitNoStart=0000&commitNoEnd=9999&chunk=1&chunkSize=1000
 */
export async function GET(request) {
  let dbManager;
  
  try {
    // 동적으로 DB 매니저 import
    const { dbManager: dbMgr } = await import('src/lib/db-manager');
    dbManager = dbMgr;
    
    // URL에서 파라미터 가져오기
    const { searchParams } = new URL(request.url);
    const site = searchParams.get('site');
    const chunk = parseInt(searchParams.get('chunk') || '1', 10);
    let chunkSize = parseInt(searchParams.get('chunkSize') || '1000', 10);
    const isDetailedSearch = searchParams.get('isDetailedSearch') === 'true';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const bodyType = searchParams.get('bodyType');
    const commitNoStart = searchParams.get('commitNoStart');
    const commitNoEnd = searchParams.get('commitNoEnd');
    const vinNo = searchParams.get('vinNo');
    const bodyNo = searchParams.get('bodyNo');
    
    console.log(`📥 엑셀 다운로드 API 호출 - 현장: ${site}, 청크: ${chunk}/${chunkSize}`);
    
    // 현장 정보 유효성 검증 및 매핑
    const siteInfo = validateAndMapSite(site);
    if (!siteInfo.isValid) {
      return NextResponse.json(
        { error: siteInfo.error },
        { status: 400 }
      );
    }
    
    const { siteName, dbName } = siteInfo;
    console.log(`📥 서열수신현황 엑셀 다운로드 - 현장: ${site} → ${siteName}, DB: ${dbName}, 청크: ${chunk}/${chunkSize}`);
    
    // DB 매니저에 현장 설정
    dbManager.setSite(siteName);
    
    // 필터 조건 생성 (기존 로직과 동일)
    const params = [];
    let paramIndex = 0;
    let whereConditions = '';
    
    // 상세 조회인 경우
    if (isDetailedSearch) {
      console.log('🔍 상세 조회 모드 (엑셀 다운로드)');
      if (vinNo) {
        whereConditions += ` AND A.[VIN_NO] = @param${paramIndex}`;
        params.push({ name: `param${paramIndex}`, value: vinNo });
        paramIndex++;
      }
      if (bodyNo) {
        whereConditions += ` AND A.[BODY_NO] = @param${paramIndex}`;
        params.push({ name: `param${paramIndex}`, value: bodyNo });
        paramIndex++;
      }
    } else {
      console.log('🔍 기본 조회 모드 (엑셀 다운로드)');
      // 생산일시 범위 필터 (필수)
      if (startDate && endDate) {
        const startDateTime = startDate.replace(/-/g, '') + '000000'; // YYYYMMDD000000
        const endDateTime = endDate.replace(/-/g, '') + '235959';   // YYYYMMDD235959
        
        whereConditions += ` AND A.[PROD_DTTM] >= @param${paramIndex}`;
        params.push({ name: `param${paramIndex}`, value: startDateTime });
        paramIndex++;
        
        whereConditions += ` AND A.[PROD_DTTM] <= @param${paramIndex}`;
        params.push({ name: `param${paramIndex}`, value: endDateTime });
        paramIndex++;
      }
      
      // 차체타입 필터 (선택사항)
      if (bodyType && bodyType !== '') {
        whereConditions += ` AND A.[BODY_TYPE] = @param${paramIndex}`;
        params.push({ name: `param${paramIndex}`, value: bodyType });
        paramIndex++;
      }
      
      // 커밋번호 범위 필터 (선택사항)
      if (commitNoStart && commitNoEnd) {
        whereConditions += ` AND A.[COMMIT_NO] >= @param${paramIndex}`;
        params.push({ name: `param${paramIndex}`, value: commitNoStart });
        paramIndex++;
        
        whereConditions += ` AND A.[COMMIT_NO] <= @param${paramIndex}`;
        params.push({ name: `param${paramIndex}`, value: commitNoEnd });
        paramIndex++;
      }
    }
    
    // 첫 번째 청크인 경우 전체 카운트 조회
    let totalCount = null;
    if (chunk === 1) {
      const countQuery = `
        WITH CombinedData AS (
          SELECT A.[PROD_DTTM], A.[COMMIT_NO]
          FROM [${dbName}].[dbo].[TB_PP_RECEIVE_ALC2_DATA] A
          WHERE 1=1 ${whereConditions}
          
          UNION ALL
          
          SELECT A.[PROD_DTTM], A.[COMMIT_NO]
          FROM [${dbName}].[dbo].[TB_PP_RECEIVE_ALC2_DATA_RAW] A
          WHERE 1=1 ${whereConditions}
        )
        SELECT COUNT(*) as totalCount FROM CombinedData
      `;
      
      const countResult = await dbManager.executeQuery(countQuery, params);
      totalCount = countResult[0]?.totalCount || 0;
      console.log(`📊 전체 데이터 개수: ${totalCount}건`);
    }
    
    // 페이징을 위한 OFFSET 계산
    const offset = (chunk - 1) * chunkSize;
    
    console.log(`📊 페이징 정보: chunk=${chunk}, chunkSize=${chunkSize}, offset=${offset}`);
    
    // 안전장치: SQL Server의 기본 제한 확인
    if (offset > 1000000) {
      console.warn(`⚠️ 매우 큰 OFFSET 값: ${offset}`);
    }
    
    if (chunkSize > 10000) {
      console.warn(`⚠️ 매우 큰 chunkSize 값: ${chunkSize}, 1000으로 제한`);
      chunkSize = Math.min(chunkSize, 1000);
    }

    // 대용량 데이터 처리를 위한 최적화된 쿼리
    const dataQuery = `
      WITH CombinedData AS (
        SELECT 
          A.[PROD_DTTM], A.[COMMIT_NO], A.[BODY_NO], A.[BODY_TYPE], A.[ALC_FRONT], A.[ALC_REAR], A.[ACL_COLOR], 
          A.[VIN_NO], A.[PROD_DATE], A.[EXT_COLOR], A.[WORK_FLAG],
          CASE WHEN (
            SELECT COUNT(*)
            FROM [${dbName}].[dbo].[TB_PP_WORK_ORDER_ALC] w
            WHERE w.[PROD_DTTM] = A.[PROD_DTTM]
              AND w.[RESULT_YN] = 'Y'
          ) = 2 THEN '완료' ELSE '미완료' END AS [ASSEMBLY_COMPLETE],
          'LIVE' as DATA_SOURCE,
          ROW_NUMBER() OVER (ORDER BY A.[PROD_DTTM] DESC, A.[COMMIT_NO] DESC) as rn
        FROM [${dbName}].[dbo].[TB_PP_RECEIVE_ALC2_DATA] A
        WHERE 1=1 ${whereConditions}
        
        UNION ALL
        
        SELECT 
          A.[PROD_DTTM], A.[COMMIT_NO], A.[BODY_NO], A.[BODY_TYPE], A.[ALC_FRONT], A.[ALC_REAR], A.[ACL_COLOR], 
          A.[VIN_NO], A.[PROD_DATE], A.[EXT_COLOR], A.[WORK_FLAG],
          CASE WHEN (
            SELECT COUNT(*)
            FROM [${dbName}].[dbo].[TB_PP_WORK_ORDER_ALC_RAW] w
            WHERE w.[PROD_DTTM] = A.[PROD_DTTM]
              AND w.[RESULT_YN] = 'Y'
          ) = 2 THEN '완료' ELSE '미완료' END AS [ASSEMBLY_COMPLETE],
          'BACKUP' as DATA_SOURCE,
          ROW_NUMBER() OVER (ORDER BY A.[PROD_DTTM] DESC, A.[COMMIT_NO] DESC) + 1000000 as rn
        FROM [${dbName}].[dbo].[TB_PP_RECEIVE_ALC2_DATA_RAW] A
        WHERE 1=1 ${whereConditions}
      )
      SELECT [PROD_DTTM], [COMMIT_NO], [BODY_NO], [BODY_TYPE], [ALC_FRONT], [ALC_REAR], [ACL_COLOR], 
             [VIN_NO], [PROD_DATE], [EXT_COLOR], [WORK_FLAG], [ASSEMBLY_COMPLETE], [DATA_SOURCE]
      FROM CombinedData
      ORDER BY rn
      OFFSET ${offset} ROWS
      FETCH NEXT ${chunkSize} ROWS ONLY
    `;

    console.log('📝 데이터 쿼리:', dataQuery);
    console.log('📝 데이터 파라미터:', params);

    let data = [];
    try {
      data = await dbManager.executeQuery(dataQuery, params);
      console.log(`✅ 데이터 조회 성공: ${data.length}건`);
    } catch (dataError) {
      console.error('❌ 데이터 조회 실패:', dataError);
      throw new Error(`데이터 조회 실패: ${dataError.message}`);
    }

    // hasMore 계산 수정: totalCount가 null인 경우 대비
    const hasMore = totalCount !== null ? (offset + data.length) < totalCount : data.length === chunkSize;
    
    console.log(`🔍 hasMore 계산:`, {
      offset,
      dataLength: data.length,
      totalCount,
      offsetPlusData: offset + data.length,
      hasMore,
      calculation: `${offset + data.length} < ${totalCount} = ${hasMore}`
    });
    
    const response = {
      success: true,
      data,
      chunk: {
        current: chunk,
        size: chunkSize,
        hasMore,
        offset,
        total: Math.ceil((totalCount || data.length) / chunkSize)
      },
      ...(totalCount !== null && { totalCount })
    };
    
    console.log(`✅ 최종 응답 준비 완료: chunk=${chunk}, 데이터=${data.length}건, hasMore=${hasMore}, total=${totalCount}`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Export API 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '엑셀 다운로드 중 오류가 발생했습니다.',
        details: error.message 
      },
      { status: 500 }
    );
  } finally {
    // DB 연결 정리 (필요한 경우)
    if (dbManager) {
      // DB 매니저의 연결 정리 로직이 있다면 여기에 추가
    }
  }
}
      