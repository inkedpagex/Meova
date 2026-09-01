import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. Whitelist all public routes, static assets, and auth endpoints
  const isPublic =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/terms' ||
    pathname === '/privacy' ||
    pathname === '/offline' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/api/ping') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/logo') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js';

  if (isPublic) {
    return NextResponse.next();
  }

  // 2. Inspect request cookies for Supabase or Meova session tokens
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some((c) =>
    c.name.includes('auth-token') ||
    c.name.startsWith('sb-') ||
    c.name === '__Meova_session' ||
    c.name === 'sb-access-token'
  );

  // 3. If unauthenticated, immediately redirect at Edge before layout/page streams
  if (!hasAuthCookie) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - static image/asset extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
};
