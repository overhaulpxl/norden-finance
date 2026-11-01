import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/_next/data/',
        ],
      },
    ],
    sitemap: 'https://www.nordenfinance.site/sitemap.xml',
    host: 'https://www.nordenfinance.site',
  };
}
