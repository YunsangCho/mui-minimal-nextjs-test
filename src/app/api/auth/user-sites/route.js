import { NextResponse } from 'next/server';

/**
 * 사용자 접근 가능한 현장 목록 조회 API
 * GET /api/auth/user-sites?userId=사용자ID
 */
export async function GET(request) {
  try {
    // 동적으로 AuthService import
    const { default: authService } = await import('src/lib/auth-service');
    
    // URL에서 쿼리 파라미터 가져오기
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 사용자 접근 가능한 현장 목록 조회
    const sites = await authService.getUserAccessibleSites(userId);
    
    return NextResponse.json(sites, { status: 200 });

  } catch (error) {
    console.error('사용자 현장 목록 조회 오류:', error);
    
    // MongoDB 연결 실패 등의 경우 기본 현장 목록 반환
    if (error.message.includes('MongoDB') || error.message.includes('연결')) {
      console.log('MongoDB 연결 실패, 기본 현장 목록을 반환합니다.');
      const defaultSites = [
        {
          id: 'SH1',
          name: '시흥1조립장',
          code: 'SH1',
          type: '조립장',
          description: '시흥 1공장 조립라인',
          location: '경기도 시흥시',
          logo: 'mdi:factory',
          plan: 'Production',
        },
        {
          id: 'SH2',
          name: '시흥2조립장',
          code: 'SH2',
          type: '조립장',
          description: '시흥 2공장 조립라인',
          location: '경기도 시흥시',
          logo: 'mdi:factory',
          plan: 'Quality',
        },
        {
          id: 'HS',
          name: '화성조립장',
          code: 'HS',
          type: '조립장',
          description: '화성공장 조립라인',
          location: '경기도 화성시',
          logo: 'mdi:factory',
          plan: 'Material',
        },
        {
          id: 'SS',
          name: '서산조립장',
          code: 'SS',
          type: '조립장',
          description: '서산공장 조립라인',
          location: '충청남도 서산시',
          logo: 'mdi:factory',
          plan: 'Active',
        },
      ];
      return NextResponse.json(defaultSites, { status: 200 });
    }
    
    return NextResponse.json(
      { error: '사용자 현장 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 