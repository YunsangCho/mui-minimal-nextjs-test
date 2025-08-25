import { NextResponse } from 'next/server';

/**
 * 테스트용 간단한 API
 */
export async function GET(request) {
  try {
    console.log('🧪 테스트 API 호출됨');
    
    const { searchParams } = new URL(request.url);
    const site = searchParams.get('site');
    
    console.log('📋 수신된 파라미터:', { site });
    
    return NextResponse.json({ 
      success: true, 
      message: '테스트 API 정상 작동',
      receivedParams: { site },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 테스트 API 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '테스트 API 오류',
        details: error.message 
      },
      { status: 500 }
    );
  }
}