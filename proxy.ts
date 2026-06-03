import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = '__session';
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/pricing',
  '/upgrade',
  '/forgot-password',
  '/legal/privacy',
  '/legal/terms',
];

function isPublicPath(path: string): boolean {
  if (PUBLIC_PATHS.includes(path)) return true;
  if (path.startsWith('/api/auth/')) return true;
  if (path.startsWith('/api/cron/')) return true;
  if (path.startsWith('/_next/')) return true;
  return false;
}

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (isPublicPath(path)) {
    if (sessionCookie && (path === '/login' || path === '/register')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
