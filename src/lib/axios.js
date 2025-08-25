import axios from 'axios';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({
  baseURL: CONFIG.serverUrl, // 기본값
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터로 동적 baseURL 설정
axiosInstance.interceptors.request.use((config) => {
  // 브라우저 환경에서만 동적 감지
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    // IP 주소로 접속한 경우 (모바일에서 접속)
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      config.baseURL = `${protocol}//${hostname}:3033`;
      console.log(`🌐 Mobile access detected - Using baseURL: ${config.baseURL}`);
    } else {
      config.baseURL = CONFIG.serverUrl;
      console.log(`💻 Local access - Using baseURL: ${config.baseURL}`);
    }
  }
  return config;
});

/**
 * Optional: Add token (if using auth)
 * Note: Token interceptor는 별도로 추가할 수 있습니다.
 */

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message || error?.message || 'Something went wrong!';
    
    // 더 자세한 에러 정보 로깅
    console.error('🚨 Axios Error Details:', {
      message,
      url: error?.config?.url,
      baseURL: error?.config?.baseURL,
      method: error?.config?.method,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      code: error?.code,
      isNetworkError: error?.code === 'NETWORK_ERR' || error?.code === 'ERR_NETWORK',
      fullError: error
    });

    return Promise.reject(new Error(message));
  }
);

export default axiosInstance;

export { axiosInstance };

// ----------------------------------------------------------------------

export const fetcher = async (args) => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args, {}];

    const res = await axiosInstance.get(url, config);

    return res.data;
  } catch (error) {
    console.error('Fetcher failed:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

export const endpoints = {
  chat: '/api/chat',
  kanban: '/api/kanban',
  calendar: '/api/calendar',

  auth: {
    me: '/api/auth/me',
    signIn: '/api/auth/sign-in',
    signUp: '/api/auth/sign-up',
  },

  mail: {
    list: '/api/mail/list',
    details: '/api/mail/details',
    labels: '/api/mail/labels',
  },

  post: {
    list: '/api/post/list',
    details: '/api/post/details',
    latest: '/api/post/latest',
    search: '/api/post/search',
  },

  product: {
    list: '/api/product/list',
    details: '/api/product/details',
    search: '/api/product/search',
  },
  
  spec: {
    list: '/api/spec/list',
    create: '/api/spec/create',
    update: '/api/spec/update',
    delete: '/api/spec/delete',
    upload: '/api/spec/upload',
    checkDuplicate: '/api/spec/check-duplicate',
  },



  receiveAlc2Data: {
    list: '/api/receive-alc2-data/list',
    bodyTypes: '/api/receive-alc2-data/body-types',
    export: '/api/receive-alc2-data/export',
  },
};
