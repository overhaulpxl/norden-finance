import type { NextConfig } from "next";

const NOINDEX_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/verify-email',
  '/onboarding',
  '/upgrade',
  '/upgrade/:path*',
  '/dashboard',
  '/dashboard/:path*',
  '/norden-control-center',
  '/norden-control-center/:path*',
  '/auth/:path*',
  '/api/:path*',
];

const SECURITY_HEADERS = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'nordenfinance.vercel.app',
          },
        ],
        destination: 'https://www.nordenfinance.site/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
      ...NOINDEX_ROUTES.map((source) => ({
        source,
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      })),
    ];
  },
};

export default nextConfig;
