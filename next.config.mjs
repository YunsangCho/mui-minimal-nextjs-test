/**
 * Static Exports in Next.js
 *
 * 1. Set `isStaticExport = true` in `next.config.{mjs|ts}`.
 * 2. This allows `generateStaticParams()` to pre-render dynamic routes at build time.
 *
 * For more details, see:
 * https://nextjs.org/docs/app/building-your-application/deploying/static-exports
 *
 * NOTE: Remove all "generateStaticParams()" functions if not using static exports.
 */
const isStaticExport = false;

// ----------------------------------------------------------------------

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  env: {
    BUILD_STATIC_EXPORT: process.env.BUILD_STATIC_EXPORT,
  },
  modularizeImports: {
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
  },
  webpack: (config, { isServer }) => {
    // 서버 사이드에서만 실행되어야 하는 모듈들을 클라이언트 번들에서 제외
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
      
      // mssql과 관련된 모듈들을 클라이언트에서 제외
      config.externals = config.externals || [];
      config.externals.push({
        'mssql': 'mssql',
        'tedious': 'tedious',
        'msnodesqlv8': 'msnodesqlv8',
      });
    }
    
    return config;
  },
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/lab', '@mui/icons-material'],
  },
};

export default nextConfig;
