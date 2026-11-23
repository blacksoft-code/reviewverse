import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['192.168.0.102'],
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: '192.168.0.102', port: '3000', pathname: '/uploads/**' },
    ],
  },
  reactCompiler: true,
};

export default nextConfig;
