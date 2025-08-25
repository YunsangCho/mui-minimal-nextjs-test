import { NextResponse } from 'next/server';

/**
 * 사용자 권한 재설정 API
 * POST /api/auth/reset-users
 */
export async function POST(request) {
  try {
    // 동적으로 AuthService import
    const { default: authService } = await import('src/lib/auth-service');
    
    console.log('=== 사용자 권한 재설정 시작 ===');
    
    // MongoDB 연결 확인
    await authService.ensureConnection();
    
    // User 모델 import
    const { default: User } = await import('src/models/User');
    
    // 기존 사용자 삭제
    console.log('기존 사용자 삭제 중...');
    await User.deleteMany({});
    console.log('기존 사용자 삭제 완료');
    
    // 새로운 사용자 생성
    console.log('새로운 사용자 생성 중...');
    const users = [
      {
        userId: 'admin',
        username: '관리자',
        email: 'admin@plakor.com',
        password: 'admin123', // 실제로는 해시화 필요
        role: 'admin',
        accessibleSites: [
          { siteId: 'SH1', siteName: '시흥1조립장', permissions: ['base-info', 'receive-alc2-data'] },
          { siteId: 'SH2', siteName: '시흥2조립장', permissions: ['base-info', 'receive-alc2-data'] },
          { siteId: 'HS', siteName: '화성조립장', permissions: ['base-info', 'receive-alc2-data'] },
          { siteId: 'SS', siteName: '서산조립장', permissions: ['base-info', 'receive-alc2-data'] },
        ],
        defaultSite: 'SS',
      },
    ];

    // 사용자 생성
    for (const userData of users) {
      try {
        await User.create(userData);
        console.log(`사용자 생성 완료: ${userData.username}`);
      } catch (error) {
        console.error(`사용자 생성 오류 (${userData.username}):`, error);
        throw error;
      }
    }

    console.log('=== 사용자 권한 재설정 완료 ===');

    return NextResponse.json({
      success: true,
      message: '사용자 권한이 성공적으로 재설정되었습니다.',
      usersCreated: users.length
    });

  } catch (error) {
    console.error('사용자 권한 재설정 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '사용자 권한 재설정 중 오류가 발생했습니다.',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 