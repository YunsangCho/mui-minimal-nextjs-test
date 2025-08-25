import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';

// MongoDB 연결 설정 - Atlas URI 직접 설정
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://plakor:!q2w3e4r@cluster0.dnh1o.mongodb.net/PLAKOR_ASSY_MES?retryWrites=true&w=majority';
const MONGODB_DB = process.env.MONGODB_DB || 'PLAKOR_ASSY_MES';

// 디버깅을 위한 로그
console.log('=== MongoDB 환경 변수 확인 ===');
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('MONGODB_DB:', process.env.MONGODB_DB);
console.log('사용할 URI:', MONGODB_URI);
console.log('사용할 DB:', MONGODB_DB);
console.log('================================');

if (!MONGODB_URI) {
  throw new Error('MongoDB URI가 설정되지 않았습니다. MONGODB_URI 환경변수를 확인해주세요.');
}

// MongoDB 클라이언트 (Native Driver)
let client;
let clientPromise;

if (typeof window === 'undefined') {
  if (process.env.NODE_ENV === 'development') {
    // 개발 환경에서는 글로벌 변수를 사용하여 HMR 시 연결 재사용
    if (!global._mongoClientPromise) {
      client = new MongoClient(MONGODB_URI);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    // 프로덕션 환경에서는 새로운 클라이언트 생성
    client = new MongoClient(MONGODB_URI);
    clientPromise = client.connect();
  }
} else {
  // 클라이언트 사이드에서는 null 반환
  clientPromise = Promise.resolve(null);
}

// Mongoose 연결 설정
let isConnected = false;

export async function connectToMongoDB() {
  if (typeof window !== 'undefined') {
    throw new Error('MongoDB 연결은 서버 사이드에서만 가능합니다.');
  }

  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    // 기존 연결이 있다면 종료
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB,
      // bufferCommands 제거 - 기본값(true) 사용
      maxPoolSize: 10, // 연결 풀 크기
      serverSelectionTimeoutMS: 5000, // 서버 선택 타임아웃
      socketTimeoutMS: 45000, // 소켓 타임아웃
    });
    
    isConnected = true;
    console.log('MongoDB 연결 성공');
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB 연결 실패:', error);
    isConnected = false;
    throw error;
  }
}

// MongoDB 클라이언트 가져오기
export async function getMongoClient() {
  if (typeof window !== 'undefined') {
    throw new Error('MongoDB 클라이언트는 서버 사이드에서만 사용 가능합니다.');
  }
  
  const client = await clientPromise;
  return client;
}

// 데이터베이스 가져오기
export async function getDatabase() {
  const client = await getMongoClient();
  return client.db(MONGODB_DB);
}

export default clientPromise; 