## Prerequisites

- Node.js >=20 (Recommended)

## Installation

**Using Yarn (Recommended)**

```sh
yarn install
yarn dev
```

**Using Npm**

```sh
npm i
npm run dev
```

## Build

```sh
yarn build
# or
npm run build
```

## Mock server

By default we provide demo data from : `https://api-dev-minimal-[version].vercel.app`

To set up your local server:

- **Guide:** [https://docs.minimals.cc/mock-server](https://docs.minimals.cc/mock-server).

- **Resource:** [Download](https://www.dropbox.com/sh/6ojn099upi105tf/AACpmlqrNUacwbBfVdtt2t6va?dl=0).

## Full version

- Create React App ([migrate to CRA](https://docs.minimals.cc/migrate-to-cra/)).
- Next.js
- Vite.js

## Starter version

- To remove unnecessary components. This is a simplified version ([https://starter.minimals.cc/](https://starter.minimals.cc/))
- Good to start a new project. You can copy components from the full version.
- Make sure to install the dependencies exactly as compared to the full version.

---

**NOTE:**
_When copying folders remember to also copy hidden files like .env. This is important because .env files often contain environment variables that are crucial for the application to run correctly._

# MSSQL 연동 API 설정 가이드

## 1. 환경 설정

### 필요 패키지 설치
```bash
npm install mssql dotenv xlsx
```

### 환경 변수 설정
`.env.local` 파일을 프로젝트 루트에 생성하고 아래 내용을 추가합니다:

```
# 서버 설정
NEXT_PUBLIC_SERVER_URL=http://localhost:3032

# MSSQL 데이터베이스 연결 정보
DB_USER=sa
DB_PASSWORD=yourpassword
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=SpecDB
DB_ENCRYPT=false
```

실제 데이터베이스 연결 정보로 수정하세요.

## 2. 데이터베이스 스키마 설정

1. MSSQL Server Management Studio에서 `SpecDB` 데이터베이스를 생성합니다.
2. `src/lib/mssql-schema.sql` 파일의 SQL 스크립트를 실행하여 테이블과 샘플 데이터를 생성합니다.

## 3. API 엔드포인트

### 사양정보 목록 조회
- **URL**: `/api/spec/list`
- **Method**: GET
- **Query Parameters**:
  - `carType`: 차종 필터 (예: JA, KA, LA)
  - `lineId`: 공정 필터 (예: FR01, RR01)
  - `type`: 타입 필터 (예: JAPE2STD)
  - `search`: 검색어

### 사양정보 생성
- **URL**: `/api/spec/create`
- **Method**: POST
- **Body**:
```json
{
  "carType": "JA",
  "lineId": "FR01",
  "alcCode": "CB",
  "type": "JAPE2STD",
  "itemCd": "86500G6CB0",
  "bodyType": "G6",
  "etcText01": "",
  "etcText02": "",
  "etcText03": "부식",
  "etcText04": "부식 AEB",
  "etcText05": "X",
  "etcText06": "",
  "etcText07": ""
}
```

### 사양정보 업데이트
- **URL**: `/api/spec/update?id=1`
- **Method**: PUT
- **Query Parameters**:
  - `id`: 업데이트할 사양정보 ID
- **Body**:
```json
{
  "carType": "JA",
  "lineId": "FR01",
  "alcCode": "CB",
  "type": "JAPE2STD",
  "itemCd": "86500G6CB0",
  "bodyType": "G6",
  "etcText01": "업데이트 내용",
  "etcText02": "",
  "etcText03": "부식",
  "etcText04": "부식 AEB",
  "etcText05": "X",
  "etcText06": "",
  "etcText07": ""
}
```

### 사양정보 삭제
- **URL**: `/api/spec/delete?id=1`
- **Method**: DELETE
- **Query Parameters**:
  - `id`: 삭제할 사양정보 ID

### 엑셀 업로드
- **URL**: `/api/spec/upload`
- **Method**: POST
- **Form Data**:
  - `file`: Excel 파일 (.xlsx, .xls)

## 4. 테스트 방법

### 서버 실행
```bash
npm run dev
```

### API 테스트
Postman이나 Insomnia 같은 API 테스트 도구를 사용하여 위의 엔드포인트를 테스트할 수 있습니다.

## 5. 오류 해결

### 데이터베이스 연결 오류
- MSSQL 서버가 실행 중인지 확인
- 방화벽 설정 확인
- 사용자 권한 확인
- 환경 변수 설정 확인
