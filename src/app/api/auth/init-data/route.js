import { NextResponse } from 'next/server';

/**
 * 기본 데이터 초기화 API (개발용)
 * POST /api/auth/init-data
 */
export async function POST(request) {
  try {
    // 개발 환경에서만 실행
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: '이 API는 개발 환경에서만 사용 가능합니다.' },
        { status: 403 }
      );
    }
    
    // 동적으로 AuthService import
    const { default: authService } = await import('src/lib/auth-service');
    
    // 기본 데이터 초기화 실행
    await authService.initializeDefaultData();
    
    return NextResponse.json(
      { message: '기본 데이터 초기화가 완료되었습니다.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('기본 데이터 초기화 오류:', error);
    return NextResponse.json(
      { error: '기본 데이터 초기화 중 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
} 