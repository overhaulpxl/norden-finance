export const DEFAULT_PUBLIC_APP_URL = 'https://www.nordenfinance.site';

export function getPublicAppUrl(fallback = DEFAULT_PUBLIC_APP_URL): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const rawUrl = configured || fallback || DEFAULT_PUBLIC_APP_URL;
  const clean = rawUrl.replace(/\/+$/, '') || DEFAULT_PUBLIC_APP_URL;

  // Preserve local development URLs
  if (clean.includes('localhost') || clean.includes('127.0.0.1')) {
    return clean;
  }

  // Canonicalize default Vercel domain or apex domain to primary custom production domain
  if (
    clean === 'https://nordenfinance.vercel.app' ||
    clean === 'http://nordenfinance.vercel.app' ||
    clean === 'https://nordenfinance.site' ||
    clean === 'http://nordenfinance.site' ||
    clean === 'http://www.nordenfinance.site'
  ) {
    return DEFAULT_PUBLIC_APP_URL;
  }

  return clean;
}
