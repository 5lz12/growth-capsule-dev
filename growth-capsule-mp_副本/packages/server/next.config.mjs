/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // 对所有 API 路由启用 CORS
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-DEV-UID' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
    ]
  },
};

export default nextConfig;
