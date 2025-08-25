import { NextResponse } from 'next/server';

/**
 * MongoDB 연결 테스트 API
 * GET /api/auth/test-connection
 */
export async function GET(request) {
  try {
    console.log('=== MongoDB 연결 테스트 시작 ===');
    
    // 동적으로 AuthService import
    const { default: authService } = await import('src/lib/auth-service');
    
    // MongoDB 연결 시도
    console.log('MongoDB 연결 시도...');
    await authService.ensureConnection();
    console.log('MongoDB 연결 성공');
    
    // Menu 모델 import 테스트
    console.log('Menu 모델 import 시도...');
    const { default: Menu } = await import('src/models/Menu');
    console.log('Menu 모델 import 성공');
    
    // 기존 메뉴 개수 확인
    const menuCount = await Menu.countDocuments();
    console.log(`기존 메뉴 개수: ${menuCount}`);
    
    return NextResponse.json({
      success: true,
      message: 'MongoDB 연결 성공',
      menuCount
    });

  } catch (error) {
    console.error('MongoDB 연결 테스트 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'MongoDB 연결 실패',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
} 