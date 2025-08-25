import mongoose from 'mongoose';

// 사용자 스키마
const userSchema = new mongoose.Schema({
  // 기본 정보
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  
  // 권한 정보
  role: {
    type: String,
    enum: ['admin', 'manager', 'operator', 'viewer'],
    default: 'operator',
  },
  
  // 접근 가능한 현장 목록
  accessibleSites: [{
    siteId: {
      type: String,
      required: true,
    },
    siteName: {
      type: String,
      required: true,
    },
    permissions: {
      type: [String], // 해당 현장에서의 권한 목록
      default: [],
    },
  }],
  
  // 기본 현장 설정
  defaultSite: {
    type: String,
    default: '서산조립장',
  },
  
  // 상태 정보
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
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
  timestamps: true, // createdAt, updatedAt 자동 생성
  collection: 'users',
});

// 인덱스 설정
userSchema.index({ userId: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'accessibleSites.siteId': 1 });

// 가상 필드: 사용자 표시명
userSchema.virtual('displayName').get(function() {
  return `${this.username} (${this.userId})`;
});

// 메서드: 특정 현장 접근 권한 확인
userSchema.methods.hasAccessToSite = function(siteId) {
  return this.accessibleSites.some(site => site.siteId === siteId);
};

// 메서드: 특정 현장에서의 권한 목록 가져오기
userSchema.methods.getSitePermissions = function(siteId) {
  const site = this.accessibleSites.find(site => site.siteId === siteId);
  return site ? site.permissions : [];
};

// 메서드: 특정 현장에서 특정 권한 확인
userSchema.methods.hasPermissionInSite = function(siteId, permission) {
  const permissions = this.getSitePermissions(siteId);
  return permissions.includes(permission);
};

// 정적 메서드: 사용자 ID로 사용자 찾기
userSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId, isActive: true });
};

// 정적 메서드: 이메일로 사용자 찾기
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase(), isActive: true });
};

// 모델 생성 (이미 존재하는 경우 기존 모델 사용)
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User; 