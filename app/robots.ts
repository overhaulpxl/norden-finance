import { MetadataRoute } from 'next';
import { getPublicAppUrl } from '../lib/appUrl';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getPublicAppUrl().replace(/\/+$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/register', '/legal/terms', '/legal/privacy'],
        disallow: [
          '/dashboard',
          '/dashboard/*',
          '/norden-control-center',
          '/norden-control-center/*',
          '/api/*',
          '/auth/*',
          '/verify-email',
          '/onboarding',
          '/upgrade',
          '/forgot-password',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
