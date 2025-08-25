import { NextResponse } from 'next/server';

/**
 * 사용자 메뉴 권한 조회 API
 * GET /api/auth/user-menus?userId=사용자ID&siteId=현장ID
 */
export async function GET(request) {
  try {
    // 동적으로 AuthService import
    const { default: authService } = await import('src/lib/auth-service');
    
    // URL에서 쿼리 파라미터 가져오기
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const siteId = searchParams.get('siteId');
    
    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    if (!siteId) {
      return NextResponse.json(
        { error: '현장 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 사용자의 특정 현장에서의 메뉴 권한 조회
    const menus = await authService.getUserMenusForSite(userId, siteId);
    
    return NextResponse.json(menus, { status: 200 });

  } catch (error) {
    console.error('사용자 메뉴 권한 조회 오류:', error);
    
    // MongoDB 연결 실패 등의 경우 기본 메뉴 구조 반환
    if (error.message.includes('MongoDB') || error.message.includes('연결')) {
      console.log('MongoDB 연결 실패, 기본 메뉴 구조를 반환합니다.');
      const defaultMenus = [
        {
          menuId: 'base-info',
          menuName: '기준정보관리',
          menuPath: '/dashboard/base-info',
          icon: 'ic-analytics',
          order: 1,
          children: [
            {
              menuId: 'spec-info',
              menuName: '사양정보관리',
              menuPath: '/dashboard/base-info/spec-info',
              icon: 'ic-file',
              order: 1,
            },
                    ],
        },
        {
          menuId: 'receive-alc2-data',
          menuName: '서열수신현황',
          menuPath: '/dashboard/receive-alc2-data',
          icon: 'ic-analytics',
          order: 2,
          children: [
            {
              menuId: 'receive-alc2-data-inquiry',
              menuName: '서열수신현황조회',
              menuPath: '/dashboard/receive-alc2-data/inquiry',
              icon: 'ic-menu-item',
              order: 1,
            },
          ],
        },
        ];
      return NextResponse.json(defaultMenus, { status: 200 });
    }
    
    return NextResponse.json(
      { error: '사용자 메뉴 권한 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 