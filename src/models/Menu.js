import mongoose from 'mongoose';

// 메뉴 스키마
const menuSchema = new mongoose.Schema({
  // 기본 정보
  menuId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  menuName: {
    type: String,
    required: true,
    trim: true,
  },
  menuPath: {
    type: String,
    required: true,
    trim: true,
  },
  
  // 메뉴 설정
  icon: {
    type: String,
    default: 'ic-menu-item',
  },
  order: {
    type: Number,
    default: 0,
  },
  
  // 계층 구조
  parentId: {
    type: String,
    default: null, // null이면 최상위 메뉴
  },
  level: {
    type: Number,
    default: 1, // 1: 최상위, 2: 하위 메뉴
  },
  
  // 메뉴 타입
  menuType: {
    type: String,
    enum: ['group', 'item', 'divider'],
    default: 'item',
  },
  
  // 권한 설정
  requiredPermissions: [{
    type: String,
  }],
  
  // 현장별 사용 여부
  availableInSites: [{
    siteId: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  }],
  
  // 역할별 접근 권한
  accessibleRoles: [{
    type: String,
    enum: ['admin', 'manager', 'operator', 'viewer'],
  }],
  
  // 메뉴 상태
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // 메뉴 설명
  description: {
    type: String,
    trim: true,
  },
  
  // 메타데이터
  createdBy: {
    type: String,
    default: 'SYSTEM',
  },
  updatedBy: {
    type: String,
    default: 'SYSTEM',
  },
}, {
  timestamps: true,
  collection: 'menus',
});

// 인덱스 설정
menuSchema.index({ menuId: 1 });
menuSchema.index({ parentId: 1 });
menuSchema.index({ order: 1 });
menuSchema.index({ isActive: 1 });
menuSchema.index({ 'availableInSites.siteId': 1 });

// 가상 필드: 하위 메뉴 목록
menuSchema.virtual('children', {
  ref: 'Menu',
  localField: 'menuId',
  foreignField: 'parentId',
});

// 메서드: 특정 현장에서 사용 가능한지 확인
menuSchema.methods.isAvailableInSite = function(siteId) {
  const siteConfig = this.availableInSites.find(site => site.siteId === siteId);
  return siteConfig ? siteConfig.isActive : false;
};

// 메서드: 특정 역할이 접근 가능한지 확인
menuSchema.methods.isAccessibleByRole = function(role) {
  return this.accessibleRoles.includes(role);
};

// 정적 메서드: 최상위 메뉴 목록 가져오기
menuSchema.statics.getTopLevelMenus = function() {
  return this.find({ 
    parentId: null, 
    isActive: true 
  }).sort({ order: 1 });
};

// 정적 메서드: 특정 현장과 역할에 맞는 메뉴 목록 가져오기
menuSchema.statics.getMenusForSiteAndRole = function(siteId, role) {
  return this.find({
    isActive: true,
    'availableInSites.siteId': siteId,
    'availableInSites.isActive': true,
    accessibleRoles: role,
  }).sort({ order: 1 });
};

// 정적 메서드: 메뉴 트리 구조 생성
menuSchema.statics.buildMenuTree = async function(siteId, role) {
  const menus = await this.getMenusForSiteAndRole(siteId, role);
  
  // 최상위 메뉴들
  const topLevelMenus = menus.filter(menu => !menu.parentId);
  
  // 각 최상위 메뉴에 하위 메뉴 추가
  const menuTree = topLevelMenus.map(menu => {
    const children = menus.filter(child => child.parentId === menu.menuId);
    return {
      ...menu.toObject(),
      children: children.sort((a, b) => a.order - b.order),
    };
  });
  
  return menuTree.sort((a, b) => a.order - b.order);
};

// 모델 생성
const Menu = mongoose.models.Menu || mongoose.model('Menu', menuSchema);

export default Menu; 