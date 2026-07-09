// Middleware: verifies Firebase session cookie and guards /profile route.
// Only /profile requires login — all other routes are public.
import { NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = '__meetify_session';

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;

  // Only enforce auth on /profile
  if (!pathname.startsWith('/profile')) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Verify token server-side (dynamic import to avoid edge runtime issues)
  try {
    const { adminAuth, isFirebaseAdminConfigured } = await import('./lib/firebaseAdmin');
    if (!isFirebaseAdminConfigured || !adminAuth) {
      return NextResponse.next(); // pass through if not configured yet
    }
    await adminAuth.verifySessionCookie(sessionCookie, true);
    return NextResponse.next();
  } catch {
    // Invalid / expired session — redirect to login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ['/profile/:path*'],
};
