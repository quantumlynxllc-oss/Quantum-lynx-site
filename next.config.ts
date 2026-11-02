import type { NextConfig } from 'next';
import site from './schema/site.json';

const config: NextConfig = {
  distDir: process.env.NEXT_BUILD_DIR || '.next',
  poweredByHeader: false,
  async redirects() {
    return site.redirects.map(({ from, to, status }) => ({ source: from, destination: to, statusCode: status }));
  },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'" },
      ...(process.env.VERCEL_ENV === 'preview' ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] : [])
    ] }];
  }
};
export default config;
