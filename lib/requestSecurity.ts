import { getPublicAppUrl } from './appUrl';

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) {
    throw new Error('Missing request origin');
  }

  const requestOrigin = new URL(request.url).origin;
  if (origin === requestOrigin) {
    return;
  }

  // Verify against forwarded host/proto behind reverse proxies
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  if (host) {
    const forwardedOrigin = `${proto}://${host}`;
    if (origin === forwardedOrigin) {
      return;
    }
  }

  // Verify against configured canonical public app URL
  try {
    const publicAppOrigin = new URL(getPublicAppUrl()).origin;
    if (origin === publicAppOrigin) {
      return;
    }
  } catch {
    // Ignore invalid configured URL format
  }

  throw new Error('Invalid request origin');
}
