# MongoDB 기반 권한 관리 시스템 설정 가이드

## 개요

이 시스템은 MongoDB를 사용하여 사용자별, 현장별 권한을 관리하는 멀티 사이트 MES 시스템입니다.

## 주요 기능

1. **사용자별 현장 접근 권한 관리**
2. **현장별 메뉴 권한 설정**
3. **동적 메뉴 구성**
4. **현장별 DB 스위칭**

## 환경 설정

### 1. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# MongoDB 설정
MONGODB_URI=mongodb://localhost:27017/PLAKOR_ASSY_MES
MONGODB_DB=PLAKOR_ASSY_MES

# SQL Server 설정 - 시흥1조립장
DB_USER_SH1=mesuser
DB_PASSWORD_SH1=sa123!@#
DB_SERVER_SH1=172.16.10.104
DB_PORT_SH1=14233
DB_NAME_SH1=PLAKOR_MES_SH1_TEST

# SQL Server 설정 - 시흥2조립장
DB_USER_SH2=mesuser
DB_PASSWORD_SH2=sa123!@#
DB_SERVER_SH2=172.16.10.104
DB_PORT_SH2=14233
DB_NAME_SH2=PLAKOR_MES_SH2_TEST

# SQL Server 설정 - 화성조립장
DB_USER_HS=mesuser
DB_PASSWORD_HS=sa123!@#
DB_SERVER_HS=172.16.10.104
DB_PORT_HS=14233
DB_NAME_HS=PLAKOR_DJ_MES_TEST

# SQL Server 설정 - 서산조립장
DB_USER_SS=mesuser
DB_PASSWORD_SS=sa123!@#
DB_SERVER_SS=172.16.10.104
DB_PORT_SS=14233
DB_NAME_SS=PLAKOR_MES_SS_TEST

# 공통 설정
DB_ENCRYPT=false
NODE_ENV=development
```

### 2. MongoDB 설치 및 실행

```bash
# MongoDB 설치 (Windows)
# MongoDB Community Server를 다운로드하여 설치

# MongoDB 실행
mongod --dbpath C:\data\db

# 또는 Docker 사용
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## 초기 데이터 설정

### 1. 기본 데이터 초기화

개발 서버 실행 후 다음 API를 호출하여 기본 데이터를 생성하세요:

```bash
# POST 요청으로 기본 데이터 초기화
curl -X POST http://localhost:3033/api/auth/init-data
```

또는 브라우저에서 개발자 도구를 열고 다음 코드를 실행:

```javascript
fetch('/api/auth/init-data', { method: 'POST' })
  .then(res => res.json())
  .then(data => console.log(data));
```

### 2. 생성되는 기본 데이터

#### 현장 정보
- 시흥1조립장 (SH1)
- 시흥2조립장 (SH2)
- 화성조립장 (HS)
- 서산조립장 (SS)

#### 메뉴 구조
- 기준정보관리
  - 사양정보관리
- 서열수신관리
  - 서열수신조회

#### 기본 사용자
- 사용자 ID: `admin`
- 비밀번호: `admin123`
- 권한: `admin`
- 접근 가능한 모든 현장

## 데이터 모델

### 1. 사용자 (User)
```javascript
{
  userId: String,           // 사용자 ID
  username: String,         // 사용자명
  email: String,           // 이메일
  password: String,        // 비밀번호 (해시화)
  role: String,            // 역할 (admin, manager, operator, viewer)
  accessibleSites: [{      // 접근 가능한 현장 목록
    siteId: String,
    siteName: String,
    permissions: [String]
  }],
  defaultSite: String,     // 기본 현장
  isActive: Boolean        // 활성 상태
}
```

### 2. 현장 (Site)
```javascript
{
  siteId: String,          // 현장 ID
  siteName: String,        // 현장명
  siteCode: String,        // 현장 코드
  siteType: String,        // 현장 타입
  description: String,     // 설명
  location: String,        // 위치
  isActive: Boolean        // 활성 상태
}
```

### 3. 메뉴 (Menu)
```javascript
{
  menuId: String,          // 메뉴 ID
  menuName: String,        // 메뉴명
  menuPath: String,        // 메뉴 경로
  icon: String,            // 아이콘
  order: Number,           // 정렬 순서
  parentId: String,        // 부모 메뉴 ID
  level: Number,           // 메뉴 레벨
  availableInSites: [{     // 현장별 사용 여부
    siteId: String,
    isActive: Boolean
  }],
  accessibleRoles: [String], // 접근 가능한 역할
  isActive: Boolean        // 활성 상태
}
```

## API 엔드포인트

### 권한 관리 API

1. **사용자 접근 가능한 현장 목록**
   ```
   GET /api/auth/user-sites?userId={userId}
   ```

2. **사용자 메뉴 권한 조회**
   ```
   GET /api/auth/user-menus?userId={userId}&siteId={siteId}
   ```

3. **기본 데이터 초기화** (개발용)
   ```
   POST /api/auth/init-data
   ```

### 기존 API (현장별 DB 스위칭 지원)

1. **사양정보 조회**
   ```
   GET /api/spec/list?site={siteId}
   ```

2. **서열수신조회**
   ```
   GET /api/serial-receive/list?site={siteId}
   ```

## 사용 방법

### 1. 현장 변경
- 상단 워크스페이스 팝오버에서 현장 선택
- 선택한 현장에 따라 자동으로 DB 연결 변경
- 해당 현장에서 사용 가능한 메뉴만 표시

### 2. 권한 관리
- MongoDB에서 사용자별 현장 접근 권한 설정
- 현장별 메뉴 구성 설정
- 역할별 메뉴 접근 권한 설정

### 3. 메뉴 추가
1. MongoDB의 `menus` 컬렉션에 새 메뉴 추가
2. 현장별 사용 여부 설정
3. 역할별 접근 권한 설정
4. 자동으로 네비게이션에 반영

## 개발 참고사항

### 1. 클라이언트/서버 분리
- MongoDB 연결은 서버 사이드에서만 실행
- 클라이언트에서는 API를 통해 권한 정보 조회
- 동적 import를 사용하여 서버 전용 모듈 로드

### 2. 폴백 시스템
- MongoDB 연결 실패 시 기본 메뉴 구조 사용
- 권한 API 실패 시 기본 현장 목록 반환

### 3. 확장성
- 새로운 현장 추가 시 MongoDB에 현장 정보만 추가
- 새로운 메뉴 추가 시 메뉴 정보와 권한 설정만 추가
- 사용자별 세밀한 권한 제어 가능

## 트러블슈팅

### 1. MongoDB 연결 오류
- MongoDB 서비스가 실행 중인지 확인
- 환경 변수 `MONGODB_URI` 확인
- 네트워크 연결 상태 확인

### 2. 메뉴가 표시되지 않음
- 사용자의 현장 접근 권한 확인
- 메뉴의 현장별 사용 설정 확인
- 사용자 역할의 메뉴 접근 권한 확인

### 3. 현장 변경이 안됨
- 사용자의 해당 현장 접근 권한 확인
- SQL Server 연결 정보 확인
- 환경 변수 설정 확인 