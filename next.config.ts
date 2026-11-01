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

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return NOINDEX_ROUTES.map((source) => ({
      source,
      headers: [
        {
          key: 'X-Robots-Tag',
          value: 'noindex, nofollow',
        },
      ],
    }));
  },
};

export default nextConfig;
