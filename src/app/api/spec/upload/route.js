import { NextResponse } from 'next/server';
import { validateAndMapSite } from 'src/lib/site-config';
import * as XLSX from 'xlsx';

/**
 * 엑셀 파일을 통한 사양정보 일괄 업로드 API
 * POST /api/spec/upload?site=현장명
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
    console.log(`사양정보 업로드 - 현장: ${site} → ${siteName}, DB: ${dbName}`);
    
    // DB 매니저에 현장 설정
    dbManager.setSite(siteName);
    
    // multipart/form-data 형식 처리
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json(
        { error: '파일이 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 파일 버퍼 읽기
    const fileBuffer = await file.arrayBuffer();
    const fileData = new Uint8Array(fileBuffer);
    
    // XLSX 파싱
    const workbook = XLSX.read(fileData, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 헤더 기준으로 읽고, 완전히 빈 행은 제외
    const jsonDataRaw = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (jsonDataRaw.length <= 1) {
      return NextResponse.json(
        { error: '엑셀 파일에 데이터가 없습니다.' },
        { status: 400 }
      );
    }
    
    // 헤더 정규화 (대문자 + 공백→_ + ETC_TEXT 패턴 통일)
    const rawHeaders = jsonDataRaw[0];
    const normalizeHeader = (h) => {
      let key = String(h || '').trim().toUpperCase().replace(/\s+/g, '_');
      key = key.replace(/^EXT_TEXT(\d{1,2})$/, (m, d) => `ETC_TEXT${String(d).padStart(2, '0')}`);
      key = key.replace(/^ETC_TEXT(\d{1,2})$/, (m, d) => `ETC_TEXT${String(d).padStart(2, '0')}`);
      return key;
    };
    
    const headers = rawHeaders.map(normalizeHeader);
    const rows = jsonDataRaw
      .slice(1)
      .filter((row) => Array.isArray(row) && row.some((cell) => cell !== undefined && cell !== null && String(cell).trim() !== ''));
    
    const jsonData = rows.map((row) => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] !== undefined ? row[index] : '';
      });
      return obj;
    });
    
    if (jsonData.length === 0) {
      return NextResponse.json(
        { error: '엑셀 파일에 데이터가 없습니다.' },
        { status: 400 }
      );
    }
    
    // 필수 필드 검증
    const requiredFields = ['CAR_TYPE', 'LINE_ID', 'ALC_CODE', 'TYPE', 'ITEM_CD', 'BODY_TYPE'];
    const validationErrors = [];
    
    jsonData.forEach((row, index) => {
      requiredFields.forEach(field => {
        if (!row[field]) {
          validationErrors.push(`${index + 2}행: ${field} 필드는 필수입니다.`);
        }
      });
    });
    
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: '데이터 검증 오류', validationErrors },
        { status: 400 }
      );
    }

    // 서버측 DB 검증 (2중 검증)
    // 1) CAR_TYPE 존재 여부: TB_MD_CARCODE
    const distinctCarTypes = Array.from(new Set(jsonData.map((r) => (r.CAR_TYPE || '').toString().trim()).filter(Boolean)));
    if (distinctCarTypes.length > 0) {
      const ctParamsPlaceholders = distinctCarTypes.map((_, i) => `@param${i}`).join(', ');
      const ctParams = distinctCarTypes.map((v) => ({ value: v }));
      const ctQuery = `
        SELECT DISTINCT CARCODE
        FROM [${dbName}].[dbo].[TB_MD_CARCODE]
        WHERE CARCODE IN (${ctParamsPlaceholders})
      `;
      const ctResult = await dbManager.executeQuery(ctQuery, ctParams);
      const existingSet = new Set(ctResult.map((r) => r.CARCODE));
      const missingCarTypes = distinctCarTypes.filter((v) => !existingSet.has(v));
      if (missingCarTypes.length > 0) {
        return NextResponse.json(
          { error: 'CAR_TYPE 유효성 오류', invalidCarTypes: missingCarTypes },
          { status: 400 }
        );
      }
    }

    // 2) 복합키(CAR_TYPE, TYPE, LINE_ID, ALC_CODE) 중복 여부: TB_MD_ALC_SPEC
    const compositeKeys = [];
    const keySet = new Set();
    for (const r of jsonData) {
      const carType = (r.CAR_TYPE || '').toString().trim();
      const type = (r.TYPE || '').toString().trim();
      const lineId = (r.LINE_ID || '').toString().trim();
      const alcCode = (r.ALC_CODE || '').toString().trim();
      if (carType && type && lineId && alcCode) {
        const key = `${carType}|${type}|${lineId}|${alcCode}`;
        if (!keySet.has(key)) {
          keySet.add(key);
          compositeKeys.push({ CAR_TYPE: carType, TYPE: type, LINE_ID: lineId, ALC_CODE: alcCode });
        }
      }
    }
    
    if (compositeKeys.length > 0) {
      let dupQuery = `
        SELECT CAR_TYPE, TYPE, LINE_ID, ALC_CODE
        FROM [${dbName}].[dbo].[TB_MD_ALC_SPEC]
        WHERE `;
      const params = [];
      const clauses = [];
      let pIdx = 0;
      compositeKeys.forEach((k) => {
        const p0 = `@param${pIdx++}`;
        const p1 = `@param${pIdx++}`;
        const p2 = `@param${pIdx++}`;
        const p3 = `@param${pIdx++}`;
        clauses.push(`(CAR_TYPE = ${p0} AND TYPE = ${p1} AND LINE_ID = ${p2} AND ALC_CODE = ${p3})`);
        params.push({ value: k.CAR_TYPE }, { value: k.TYPE }, { value: k.LINE_ID }, { value: k.ALC_CODE });
      });
      dupQuery += clauses.join(' OR ');
      const dupResult = await dbManager.executeQuery(dupQuery, params);
      if (dupResult.length > 0) {
        const duplicateKeys = dupResult.map((r) => ({ CAR_TYPE: r.CAR_TYPE, TYPE: r.TYPE, LINE_ID: r.LINE_ID, ALC_CODE: r.ALC_CODE }));
        return NextResponse.json(
          { error: '중복 조합 존재', duplicateKeys },
          { status: 400 }
        );
      }
    }
    
    // 현재 시간
    const now = new Date().toISOString();
    
    // 각 데이터 행에 대해 INSERT 실행
    let insertedCount = 0;
    const errors = [];
    
    for (const row of jsonData) {
      try {
        const insertQuery = `
          INSERT INTO [${dbName}].[dbo].[TB_MD_ALC_SPEC] (
            [CAR_TYPE], [LINE_ID], [ALC_CODE], [TYPE], [ITEM_CD], [BODY_TYPE],
            [ETC_TEXT01], [ETC_TEXT02], [ETC_TEXT03], [ETC_TEXT04], [ETC_TEXT05], [ETC_TEXT06], [ETC_TEXT07],
            [REMARK], [INUSER], [INDATE], [UPTUSER], [UPTDATE], [IS_USE], [GUBUN], [PLANT]
          )
          VALUES (
            @param0, @param1, @param2, @param3, @param4, @param5,
            @param6, @param7, @param8, @param9, @param10, @param11, @param12,
            @param13, @param14, @param15, @param16, @param17, @param18, @param19, @param20
          )
        `;
        
        const params = [
          { value: row.CAR_TYPE },
          { value: row.LINE_ID },
          { value: row.ALC_CODE },
          { value: row.TYPE },
          { value: row.ITEM_CD },
          { value: row.BODY_TYPE },
          { value: row.ETC_TEXT01 || '' },
          { value: row.ETC_TEXT02 || '' },
          { value: row.ETC_TEXT03 || '' },
          { value: row.ETC_TEXT04 || '' },
          { value: row.ETC_TEXT05 || '' },
          { value: row.ETC_TEXT06 || '' },
          { value: row.ETC_TEXT07 || '' },
          { value: row.REMARK || '' },
          { value: 'SYSTEM' },
          { value: now },
          { value: 'SYSTEM' },
          { value: now },
          { value: 'Y' },
          { value: '1' },
          { value: 'P01' }
        ];
        
        await dbManager.executeQuery(insertQuery, params);
        insertedCount++;
        
      } catch (error) {
        console.error(`개별 INSERT 오류 (행 ${insertedCount + 1}):`, error);
        errors.push(`행 ${insertedCount + 1}: ${error.message}`);
      }
    }
    
    const response = {
      message: `${insertedCount}개 항목이 성공적으로 업로드되었습니다.`,
      insertedCount,
      totalRequested: jsonData.length,
      errors: errors.length > 0 ? errors : undefined
    };
    
    if (insertedCount === 0) {
      return NextResponse.json(
        { error: '업로드된 항목이 없습니다.', ...response },
        { status: 400 }
      );
    }
    
    return NextResponse.json(response, { status: 201 });
    
  } catch (error) {
    console.error('사양정보 업로드 오류:', error);
    return NextResponse.json(
      { error: '사양정보 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}