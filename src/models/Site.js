import mongoose from 'mongoose';

// 현장 스키마
const siteSchema = new mongoose.Schema({
  // 기본 정보
  siteId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  siteName: {
    type: String,
    required: true,
    trim: true,
  },
  siteCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  
  // 현장 설정
  description: {
    type: String,
    trim: true,
  },
  location: {
    type: String,
    trim: true,
  },
  
  // DB 연결 정보 (암호화된 형태로 저장)
  dbConfig: {
    server: String,
    port: Number,
    database: String,
    // 보안상 사용자명/비밀번호는 환경변수로 관리
  },
  
  // 현장 상태
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // 현장 타입 (조립장, 도장장 등)
  siteType: {
    type: String,
    enum: ['조립장', '도장장', '차체장', '엔진장', '기타'],
    default: '조립장',
  },
  
  // 현장별 사용 가능한 메뉴 목록
  availableMenus: [{
    menuId: {
      type: String,
      required: true,
    },
    menuName: {
      type: String,
      required: true,
    },
    menuPath: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: 'ic-menu-item',
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // 하위 메뉴
    children: [{
      menuId: String,
      menuName: String,
      menuPath: String,
      icon: String,
      order: Number,
      isActive: {
        type: Boolean,
        default: true,
      },
    }],
  }],
  
  // 현장별 권한 설정
  rolePermissions: {
    admin: {
      type: [String],
      default: [],
    },
    manager: {
      type: [String],
      default: [],
    },
    operator: {
      type: [String],
      default: [],
    },
    viewer: {
      type: [String],
      default: [],
    },
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
  collection: 'sites',
});

// 인덱스 설정
siteSchema.index({ siteId: 1 });
siteSchema.index({ siteCode: 1 });
siteSchema.index({ isActive: 1 });

// 메서드: 특정 역할의 권한 목록 가져오기
siteSchema.methods.getRolePermissions = function(role) {
  return this.rolePermissions[role] || [];
};

// 메서드: 활성화된 메뉴 목록 가져오기
siteSchema.methods.getActiveMenus = function() {
  return this.availableMenus.filter(menu => menu.isActive);
};

// 메서드: 특정 역할이 접근 가능한 메뉴 목록 가져오기
siteSchema.methods.getMenusForRole = function(role) {
  const rolePermissions = this.getRolePermissions(role);
  return this.getActiveMenus().filter(menu => 
    rolePermissions.includes(menu.menuId)
  );
};

// 정적 메서드: 활성화된 현장 목록 가져오기
siteSchema.statics.getActiveSites = function() {
  return this.find({ isActive: true }).sort({ siteName: 1 });
};

// 정적 메서드: 현장 ID로 현장 찾기
siteSchema.statics.findBySiteId = function(siteId) {
  return this.findOne({ siteId, isActive: true });
};

// 모델 생성
const Site = mongoose.models.Site || mongoose.model('Site', siteSchema);

export default Site; 