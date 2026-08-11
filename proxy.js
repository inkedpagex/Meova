import { NextResponse } from 'next/server';

// Routes that do NOT require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/api'];

export function proxy(request) {
  const { pathname } = request.nextUrl;

  // Allow all public routes and static files
  if (
    PUBLIC_ROUTES.some(r => pathname.startsWith(r)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/logo') ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next();
  }

  // Check for session cookie
  const session = request.cookies.get('__meetify_session')?.value;

  if (!session) {
    // Not logged in — redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all routes EXCEPT:
     * - _next/static, _next/image, favicon.ico, api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};
