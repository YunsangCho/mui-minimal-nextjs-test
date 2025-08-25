import { NextResponse } from 'next/server';
import { validateAndMapSite } from 'src/lib/site-config';

/**
 * 서열수신현황 데이터 조회 API
 * GET /api/receive-alc2-data/list?site=현장명&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&bodyType=타입&commitNoStart=0000&commitNoEnd=9999
 */
export async function GET(request) {
  try {
    // 동적으로 DB 매니저 import
    const { dbManager } = await import('src/lib/db-manager');
    
    // URL에서 파라미터 가져오기
    const { searchParams } = new URL(request.url);
    const site = searchParams.get('site');
    const isDetailedSearch = searchParams.get('isDetailedSearch') === 'true';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const bodyType = searchParams.get('bodyType');
    const commitNoStart = searchParams.get('commitNoStart');
    const commitNoEnd = searchParams.get('commitNoEnd');
    const vinNo = searchParams.get('vinNo');
    const bodyNo = searchParams.get('bodyNo');
    
    // 페이징 파라미터 (커서 기반 + 기존 방식 혼용)
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);
    const offset = (page - 1) * pageSize;
    
    // 커서 기반 페이징 파라미터
    const cursorProdDttm = searchParams.get('cursorProdDttm');
    const cursorCommitNo = searchParams.get('cursorCommitNo');
    const direction = searchParams.get('direction') || 'next'; // 'next' or 'prev'
    
    // 현장 정보 유효성 검증 및 매핑
    const siteInfo = validateAndMapSite(site);
    if (!siteInfo.isValid) {
      return NextResponse.json(
        { error: siteInfo.error },
        { status: 400 }
      );
    }
    
    const { siteName, dbName } = siteInfo;
    console.log(`서열수신현황 조회 - 현장: ${site} → ${siteName}, DB: ${dbName}, 상세조건: ${isDetailedSearch}`);
    
    // DB 매니저에 현장 설정
    dbManager.setSite(siteName);
    
    // 필터 조건 생성
    const params = [];
    let paramIndex = 0;
    let whereConditions = '';
    
    // 상세 조회인 경우
    if (isDetailedSearch) {
      console.log('🔍 상세 조회 모드');
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
      console.log('🔍 기본 조회 모드');
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
    
    // 최적화된 전체 카운트 쿼리 (첫 페이지일 때만 실행)
    const countQuery = page === 1 ? `
      -- 운영 테이블 카운트
      SELECT 
        (SELECT COUNT(*) FROM [${dbName}].[dbo].[TB_PP_RECEIVE_ALC2_DATA] A WHERE 1=1 ${whereConditions}) +
        (SELECT COUNT(*) FROM [${dbName}].[dbo].[TB_PP_RECEIVE_ALC2_DATA_RAW] A WHERE 1=1 ${whereConditions})
        as totalCount
    ` : null;
    
    // 커서 기반 페이징을 위한 추가 WHERE 조건
    let cursorCondition = '';
    if (cursorProdDttm && cursorCommitNo) {
      const cursorParam1Index = paramIndex++;
      const cursorParam2Index = paramIndex++;
      
      if (direction === 'next') {
        cursorCondition = ` AND (A.[PROD_DTTM] < @param${cursorParam1Index} OR (A.[PROD_DTTM] = @param${cursorParam1Index} AND A.[COMMIT_NO] < @param${cursorParam2Index}))`;
      } else {
        cursorCondition = ` AND (A.[PROD_DTTM] > @param${cursorParam1Index} OR (A.[PROD_DTTM] = @param${cursorParam1Index} AND A.[COMMIT_NO] > @param${cursorParam2Index}))`;
      }
      
      params.push({ name: `param${cursorParam1Index}`, value: cursorProdDttm });
      params.push({ name: `param${cursorParam2Index}`, value: cursorCommitNo });
    }

    const dataQuery = cursorProdDttm && cursorCommitNo ? `
      WITH CombinedData AS (
        SELECT 
          A.[PROD_DTTM],
          A.[COMMIT_NO],
          A.[BODY_NO],
          A.[BODY_TYPE],
          A.[ALC_FRONT],
          A.[ALC_REAR],
          A.[ACL_COLOR],
          A.[VIN_NO],
          A.[PROD_DATE],
          A.[EXT_COLOR],
          A.[WORK_FLAG],
          CASE WHEN (
            SELECT COUNT(*)
            FROM [${dbName}].[dbo].[TB_PP_WORK_ORDER_ALC] w
            WHERE w.[PROD_DTTM] = A.[PROD_DTTM]
              AND w.[RESULT_YN] = 'Y'
          ) = 2 THEN '완료' ELSE '미완료' END AS [ASSEMBLY_COMPLETE],
          'LIVE' as DATA_SOURCE
        FROM [${dbName}].[dbo].[TB_PP_RECEIVE_ALC2_DATA] A
        WHERE 1=1 ${whereConditions}${cursorCondition}
        
        UNION ALL
        
        SELECT 
          A.[PROD_DTTM],
          A.[COMMIT_NO],
          A.[BODY_NO],
          A.[BODY_TYPE],
          A.[ALC_FRONT],
          A.[ALC_REAR],
          A.[ACL_COLOR],
          A.[VIN_NO],
          A.[PROD_DATE],
          A.[EXT_COLOR],
          A.[WORK_FLAG],
          CASE WHEN (
            SELECT COUNT(*)
            FROM [${dbName}].[dbo].[TB_PP_WORK_ORDER_ALC_RAW] w
            WHERE w.[PROD_DTTM] = A.[PROD_DTTM]
              AND w.[RESULT_YN] = 'Y'
          ) = 2 THEN '완료' ELSE '미완료' END AS [ASSEMBLY_COMPLETE],
          'BACKUP' as DATA_SOURCE
        FROM [${dbName}].[dbo].[TB_PP_RECEIVE_ALC2_DATA_RAW] A
        WHERE 1=1 ${whereConditions}${cursorCondition}
      )
      SELECT TOP ${pageSize} *
      FROM CombinedData
      ORDER BY ${direction === 'prev' ? '[PROD_DTTM] ASC, [COMMIT_NO] ASC' : '[PROD_DTTM] DESC, [COMMIT_NO] DESC'}
    ` : `
      WITH CombinedData AS (
        SELECT 
          A.[PROD_DTTM],
          A.[COMMIT_NO],
          A.[BODY_NO],
          A.[BODY_TYPE],
          A.[ALC_FRONT],
          A.[ALC_REAR],
          A.[ACL_COLOR],
          A.[VIN_NO],
          A.[PROD_DATE],
          A.[EXT_COLOR],
          A.[WORK_FLAG],
          CASE WHEN (
            SELECT COUNT(*)
            FROM [${dbName}].[dbo].[TB_PP_WORK_ORDER_ALC] w
            WHERE w.[PROD_DTTM] = A.[PROD_DTTM]
              AND w.[RESULT_YN] = 'Y'
          ) = 2 THEN '완료' ELSE '미완료' END AS [ASSEMBLY_COMPLETE],
          'LIVE' as DATA_SOURCE
        FROM [${dbName}].[dbo].[TB_PP_RECEIVE_ALC2_DATA] A
        WHERE 1=1 ${whereConditions}
        
        UNION ALL
        
        SELECT 
          A.[PROD_DTTM],
          A.[COMMIT_NO],
          A.[BODY_NO],
          A.[BODY_TYPE],
          A.[ALC_FRONT],
          A.[ALC_REAR],
          A.[ACL_COLOR],
          A.[VIN_NO],
          A.[PROD_DATE],
          A.[EXT_COLOR],
          A.[WORK_FLAG],
          CASE WHEN (
            SELECT COUNT(*)
            FROM [${dbName}].[dbo].[TB_PP_WORK_ORDER_ALC_RAW] w
            WHERE w.[PROD_DTTM] = A.[PROD_DTTM]
              AND w.[RESULT_YN] = 'Y'
          ) = 2 THEN '완료' ELSE '미완료' END AS [ASSEMBLY_COMPLETE],
          'BACKUP' as DATA_SOURCE
        FROM [${dbName}].[dbo].[TB_PP_RECEIVE_ALC2_DATA_RAW] A
        WHERE 1=1 ${whereConditions}
      )
      SELECT *
      FROM CombinedData
      ORDER BY [PROD_DTTM] DESC, [COMMIT_NO] DESC
      OFFSET ${offset} ROWS
      FETCH NEXT ${pageSize} ROWS ONLY
    `;
    
    console.log('🔍 서열수신현황 조회 쿼리:', dataQuery);
    console.log('📊 전체 개수 쿼리:', countQuery ? '실행' : '스킵 (캐시된 데이터 사용)');
    console.log('📋 파라미터:', params);
    console.log('📄 페이징 정보:', { page, pageSize, offset });
    
    // 첫 페이지일 때만 전체 개수 조회, 아니면 데이터만 조회
    let totalCount = 0;
    let dataResult;
    
    if (countQuery) {
      // 첫 페이지: 전체 개수와 데이터를 병렬로 조회
      const [countResult, dataRes] = await Promise.all([
        dbManager.executeQuery(countQuery, params),
        dbManager.executeQuery(dataQuery, params)
      ]);
      totalCount = countResult[0]?.totalCount || 0;
      dataResult = dataRes;
      console.log(`📊 전체 카운트 조회 완료: ${totalCount}건`);
    } else {
      // 페이지 넘기기: 데이터만 조회 (훨씬 빠름)
      dataResult = await dbManager.executeQuery(dataQuery, params);
      console.log(`⚡ 페이지 데이터만 조회: ${dataResult.length}건`);
    }
    
    const totalPages = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0;
    
    console.log(`📥 서열수신현황 조회 완료: ${dataResult.length}건 / 전체 ${totalCount}건`);
    
    // 커서 정보 생성
    let cursors = null;
    if (dataResult.length > 0) {
      const firstItem = dataResult[0];
      const lastItem = dataResult[dataResult.length - 1];
      
      // 이전 페이지 결과인 경우 순서를 뒤집어서 반환
      if (direction === 'prev') {
        dataResult.reverse();
      }
      
      cursors = {
        startCursor: {
          prodDttm: firstItem.PROD_DTTM,
          commitNo: firstItem.COMMIT_NO
        },
        endCursor: {
          prodDttm: lastItem.PROD_DTTM,
          commitNo: lastItem.COMMIT_NO
        },
        hasPreviousPage: direction === 'next' || dataResult.length === pageSize,
        hasNextPage: dataResult.length === pageSize
      };
    }
    
    return NextResponse.json({ 
      success: true, 
      data: dataResult,
      pagination: cursorProdDttm && cursorCommitNo ? {
        // 커서 기반 페이징 정보
        cursors,
        pageSize,
        direction,
        hasMore: dataResult.length === pageSize
      } : {
        // 기존 번호 기반 페이징 정보
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: dataResult.length === pageSize, // 데이터 길이로 다음 페이지 존재 여부 판단
        hasPreviousPage: page > 1
      }
    });

  } catch (error) {
    console.error('서열수신현황 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '서열수신현황 조회 중 오류가 발생했습니다.',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
