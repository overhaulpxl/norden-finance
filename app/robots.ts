import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/legal/terms',
          '/legal/privacy',
          '/_next/static/',
          '/_next/image/',
          '/brand/',
          '/favicon.ico',
        ],
        disallow: [
          '/dashboard',
          '/dashboard/*',
          '/norden-control-center',
          '/norden-control-center/*',
          '/upgrade',
          '/upgrade/*',
          '/login',
          '/register',
          '/forgot-password',
          '/onboarding',
          '/verify-email',
          '/auth/',
          '/auth/*',
          '/api/',
          '/api/*',
        ],
      },
    ],
    sitemap: 'https://www.nordenfinance.site/sitemap.xml',
    host: 'https://www.nordenfinance.site',
  };
}
