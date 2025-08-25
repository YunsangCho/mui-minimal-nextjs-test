import { NextResponse } from 'next/server';

/**
 * 메뉴 재설정 API
 * POST /api/auth/reset-menus
 */
export async function POST(request) {
  try {
    console.log('=== 메뉴 재설정 시작 ===');
    
    // 동적으로 AuthService import
    const { default: authService } = await import('src/lib/auth-service');
    
    // MongoDB 연결 확인
    console.log('MongoDB 연결 시도...');
    await authService.ensureConnection();
    console.log('MongoDB 연결 성공');
    
    // Menu 모델 import
    console.log('Menu 모델 import 시도...');
    const { default: Menu } = await import('src/models/Menu');
    console.log('Menu 모델 import 성공');
    
    // 기존 메뉴 모두 삭제
    console.log('기존 메뉴 삭제 중...');
    await Menu.deleteMany({});
    console.log('기존 메뉴 삭제 완료');
    
    // 새로운 메뉴 구조 생성
    console.log('새로운 메뉴 생성 중...');
    const menus = [
      {
        menuId: 'base-info',
        menuName: '기준정보관리',
        menuPath: '/dashboard/base-info',
        icon: 'ic-analytics',
        order: 1,
        parentId: null,
        menuType: 'group',
        accessibleRoles: ['admin', 'manager', 'operator'],
        availableInSites: [
          { siteId: 'SH1', isActive: true },
          { siteId: 'SH2', isActive: true },
          { siteId: 'HS', isActive: true },
          { siteId: 'SS', isActive: true },
        ],
      },
      {
        menuId: 'spec-info',
        menuName: '사양정보관리',
        menuPath: '/dashboard/base-info/spec-info',
        icon: 'ic-file',
        order: 1,
        parentId: 'base-info',
        level: 2,
        accessibleRoles: ['admin', 'manager', 'operator'],
        availableInSites: [
          { siteId: 'SH1', isActive: true },
          { siteId: 'SH2', isActive: true },
          { siteId: 'HS', isActive: true },
          { siteId: 'SS', isActive: true },
        ],
      },
      {
        menuId: 'receive-alc2-data',
        menuName: '서열수신현황',
        menuPath: '/dashboard/receive-alc2-data',
        icon: 'ic-analytics',
        order: 2,
        parentId: null,
        menuType: 'group',
        accessibleRoles: ['admin', 'manager', 'operator'],
        availableInSites: [
          { siteId: 'SH1', isActive: true },
          { siteId: 'SH2', isActive: true },
          { siteId: 'HS', isActive: true },
          { siteId: 'SS', isActive: true },
        ],
      },
      {
        menuId: 'receive-alc2-data-inquiry',
        menuName: '서열수신현황조회',
        menuPath: '/dashboard/receive-alc2-data/inquiry',
        icon: 'ic-menu-item',
        order: 1,
        parentId: 'receive-alc2-data',
        level: 2,
        accessibleRoles: ['admin', 'manager', 'operator'],
        availableInSites: [
          { siteId: 'SH1', isActive: true },
          { siteId: 'SH2', isActive: true },
          { siteId: 'HS', isActive: true },
          { siteId: 'SS', isActive: true },
        ],
      },
    ];

    // 메뉴 생성
    for (const menuData of menus) {
      try {
        await Menu.create(menuData);
        console.log(`메뉴 생성 완료: ${menuData.menuName}`);
      } catch (error) {
        console.error(`메뉴 생성 오류 (${menuData.menuName}):`, error);
        throw error;
      }
    }

    console.log('=== 메뉴 재설정 완료 ===');

    return NextResponse.json({
      success: true,
      message: '메뉴가 성공적으로 재설정되었습니다.',
      menusCreated: menus.length
    });

  } catch (error) {
    console.error('메뉴 재설정 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '메뉴 재설정 중 오류가 발생했습니다.',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 