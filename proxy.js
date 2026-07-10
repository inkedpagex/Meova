// Proxy: checks for session cookie and guards /profile routes.
// ⚠️ DO NOT import firebase-admin here — this file runs before the Node.js
//    runtime is available on Vercel. Cookie-presence check is sufficient;
//    full token verification happens inside the /profile Server Component
//    via lib/getUserAdmin.js.
import { NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = '__meetify_session';

export function proxy(request) {
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

  // Cookie exists — let the request through.
  // The /profile Server Component verifies the token server-side
  // using firebase-admin (Node.js runtime, no edge restrictions).
  return NextResponse.next();
}

export const config = {
  matcher: ['/profile/:path*'],
};
