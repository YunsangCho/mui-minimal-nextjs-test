import { connectToMongoDB } from './mongodb';
import User from '../models/User';
import Site from '../models/Site';
import Menu from '../models/Menu';
import mongoose from 'mongoose';

// 권한 관리 서비스 클래스
class AuthService {
  constructor() {
    this.isInitialized = false;
  }

  // MongoDB 연결 초기화
  async initialize() {
    if (this.isInitialized && mongoose.connection.readyState === 1) {
      return;
    }
    
    try {
      console.log('AuthService 초기화 시작...');
      const connection = await connectToMongoDB();
      
      // 연결 상태 확인
      if (connection.readyState !== 1) {
        throw new Error('MongoDB 연결이 완료되지 않았습니다.');
      }
      
      this.isInitialized = true;
      console.log('AuthService 초기화 완료');
    } catch (error) {
      console.error('AuthService 초기화 실패:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  // 연결 상태 확인
  async ensureConnection() {
    if (!this.isInitialized || mongoose.connection.readyState !== 1) {
      await this.initialize();
    }
  }

  // 사용자 인증
  async authenticateUser(userId, password) {
    await this.ensureConnection();
    
    try {
      const user = await User.findByUserId(userId);
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      // 실제 구현에서는 bcrypt 등을 사용하여 비밀번호 검증
      // if (!await bcrypt.compare(password, user.password)) {
      //   throw new Error('비밀번호가 일치하지 않습니다.');
      // }

      // 로그인 시간 업데이트
      user.lastLogin = new Date();
      await user.save();

      return {
        userId: user.userId,
        username: user.username,
        email: user.email,
        role: user.role,
        accessibleSites: user.accessibleSites,
        defaultSite: user.defaultSite,
      };
    } catch (error) {
      console.error('사용자 인증 오류:', error);
      throw error;
    }
  }

  // 사용자가 접근 가능한 현장 목록 가져오기
  async getUserAccessibleSites(userId) {
    await this.ensureConnection();
    
    try {
      const user = await User.findByUserId(userId);
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      // 사용자가 접근 가능한 현장 ID 목록
      const accessibleSiteIds = user.accessibleSites.map(site => site.siteId);
      
      // 실제 현장 정보 가져오기
      const sites = await Site.find({
        siteId: { $in: accessibleSiteIds },
        isActive: true,
      }).sort({ siteName: 1 });

      return sites.map(site => ({
        id: site.siteId,
        name: site.siteName,
        code: site.siteCode,
        type: site.siteType,
        description: site.description,
        location: site.location,
        logo: 'mdi:factory', // 기본 아이콘
        plan: this.getSitePlan(site.siteType), // 현장 타입에 따른 플랜
      }));
    } catch (error) {
      console.error('접근 가능한 현장 목록 조회 오류:', error);
      throw error;
    }
  }

  // 사용자의 특정 현장에서의 메뉴 권한 가져오기
  async getUserMenusForSite(userId, siteId) {
    await this.ensureConnection();
    
    try {
      const user = await User.findByUserId(userId);
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      // 사용자가 해당 현장에 접근 권한이 있는지 확인
      if (!user.hasAccessToSite(siteId)) {
        throw new Error('해당 현장에 접근 권한이 없습니다.');
      }

      // 메뉴 트리 구조 생성
      const menuTree = await Menu.buildMenuTree(siteId, user.role);
      
      return menuTree;
    } catch (error) {
      console.error('사용자 메뉴 권한 조회 오류:', error);
      throw error;
    }
  }

  // 사용자의 특정 현장에서 특정 메뉴 접근 권한 확인
  async checkUserMenuPermission(userId, siteId, menuId) {
    await this.ensureConnection();
    
    try {
      const user = await User.findByUserId(userId);
      if (!user) {
        return false;
      }

      // 현장 접근 권한 확인
      if (!user.hasAccessToSite(siteId)) {
        return false;
      }

      // 메뉴 정보 가져오기
      const menu = await Menu.findOne({ menuId, isActive: true });
      if (!menu) {
        return false;
      }

      // 메뉴가 해당 현장에서 사용 가능한지 확인
      if (!menu.isAvailableInSite(siteId)) {
        return false;
      }

      // 사용자 역할이 메뉴에 접근 가능한지 확인
      if (!menu.isAccessibleByRole(user.role)) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('메뉴 권한 확인 오류:', error);
      return false;
    }
  }

  // 현장 타입에 따른 플랜 반환
  getSitePlan(siteType) {
    switch (siteType) {
      case '조립장':
        return 'Production';
      case '도장장':
        return 'Quality';
      case '차체장':
        return 'Material';
      case '엔진장':
        return 'Engine';
      default:
        return 'Active';
    }
  }

  // 기본 데이터 초기화 (개발용)
  async initializeDefaultData() {
    await this.ensureConnection();
    
    try {
      console.log('기본 데이터 초기화 시작...');
      
      // 기본 현장 데이터 생성
      await this.createDefaultSites();
      
      // 기본 메뉴 데이터 생성
      await this.createDefaultMenus();
      
      // 기본 사용자 데이터 생성
      await this.createDefaultUsers();
      
      console.log('기본 데이터 초기화 완료');
    } catch (error) {
      console.error('기본 데이터 초기화 오류:', error);
      throw error;
    }
  }

  // 기본 현장 데이터 생성
  async createDefaultSites() {
    console.log('기본 현장 데이터 생성 시작...');
    
    const sites = [
      {
        siteId: 'SH1',
        siteName: '시흥1조립장',
        siteCode: 'SH1',
        siteType: '조립장',
        description: '시흥 1공장 조립라인',
        location: '경기도 시흥시',
      },
      {
        siteId: 'SH2',
        siteName: '시흥2조립장',
        siteCode: 'SH2',
        siteType: '조립장',
        description: '시흥 2공장 조립라인',
        location: '경기도 시흥시',
      },
      {
        siteId: 'HS',
        siteName: '화성조립장',
        siteCode: 'HS',
        siteType: '조립장',
        description: '화성공장 조립라인',
        location: '경기도 화성시',
      },
      {
        siteId: 'SS',
        siteName: '서산조립장',
        siteCode: 'SS',
        siteType: '조립장',
        description: '서산공장 조립라인',
        location: '충청남도 서산시',
      },
    ];

    for (const siteData of sites) {
      try {
        const existingSite = await Site.findOne({ siteId: siteData.siteId });
        if (!existingSite) {
          await Site.create(siteData);
          console.log(`현장 생성: ${siteData.siteName}`);
        } else {
          console.log(`현장 이미 존재: ${siteData.siteName}`);
        }
      } catch (error) {
        console.error(`현장 생성 오류 (${siteData.siteName}):`, error);
      }
    }
  }

  // 기본 메뉴 데이터 생성
  async createDefaultMenus() {
    console.log('기본 메뉴 데이터 생성 시작...');
    
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

    for (const menuData of menus) {
      try {
        const existingMenu = await Menu.findOne({ menuId: menuData.menuId });
        if (!existingMenu) {
          await Menu.create(menuData);
          console.log(`메뉴 생성: ${menuData.menuName}`);
        } else {
          console.log(`메뉴 이미 존재: ${menuData.menuName}`);
        }
      } catch (error) {
        console.error(`메뉴 생성 오류 (${menuData.menuName}):`, error);
      }
    }
  }

  // 기본 사용자 데이터 생성
  async createDefaultUsers() {
    console.log('기본 사용자 데이터 생성 시작...');
    
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

    for (const userData of users) {
      try {
        const existingUser = await User.findOne({ userId: userData.userId });
        if (!existingUser) {
          await User.create(userData);
          console.log(`사용자 생성: ${userData.username}`);
        } else {
          console.log(`사용자 이미 존재: ${userData.username}`);
        }
      } catch (error) {
        console.error(`사용자 생성 오류 (${userData.username}):`, error);
      }
    }
  }
}

// 싱글톤 인스턴스 생성
const authService = new AuthService();

export default authService; 