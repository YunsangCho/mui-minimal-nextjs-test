import { NextResponse } from 'next/server';
import dbManager from 'src/lib/db-manager';

export async function POST(request) {
  try {
    const { rows } = await request.json();

    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json({ error: '유효하지 않은 데이터입니다.' }, { status: 400 });
    }

    const validationErrors = [];
    const invalidCarTypes = [];
    const duplicateKeys = [];

    // CAR_TYPE 목록 조회
    const carTypesQuery = 'SELECT DISTINCT CARCODE FROM [TB_MD_CARCODE]';
    const carTypesResult = await dbManager.executeQuery(carTypesQuery);
    const validCarTypes = carTypesResult.map(row => row.CARCODE);

    // 기존 데이터 조회 (중복 확인용)
    const existingDataQuery = 'SELECT CAR_TYPE, TYPE, LINE_ID, ALC_CODE FROM [TB_MD_ALC_SPEC]';
    const existingData = await dbManager.executeQuery(existingDataQuery);
    const existingKeys = new Set(
      existingData.map(row => `${row.CAR_TYPE}|${row.TYPE}|${row.LINE_ID}|${row.ALC_CODE}`)
    );

    // 각 행 검증
    rows.forEach((row, index) => {
      const rowNumber = index + 2; // Excel 행 번호 (헤더 제외)

      // CAR_TYPE 검증
      if (row.CAR_TYPE && !validCarTypes.includes(row.CAR_TYPE)) {
        invalidCarTypes.push({
          row: rowNumber,
          carType: row.CAR_TYPE,
          message: `${rowNumber}행: CAR_TYPE '${row.CAR_TYPE}'이 존재하지 않습니다.`
        });
      }

      // 복합키 중복 검증
      if (row.CAR_TYPE && row.TYPE && row.LINE_ID && row.ALC_CODE) {
        const key = `${row.CAR_TYPE}|${row.TYPE}|${row.LINE_ID}|${row.ALC_CODE}`;
        if (existingKeys.has(key)) {
          duplicateKeys.push({
            row: rowNumber,
            key: key,
            message: `${rowNumber}행: 중복된 조합입니다. (CAR_TYPE: ${row.CAR_TYPE}, TYPE: ${row.TYPE}, LINE_ID: ${row.LINE_ID}, ALC_CODE: ${row.ALC_CODE})`
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      invalidCarTypes,
      duplicateKeys,
      validCarTypes
    });

  } catch (error) {
    console.error('서버 측 검증 에러:', error);
    return NextResponse.json(
      { error: '서버 측 검증 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}