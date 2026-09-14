import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  const isProd = process.env.NODE_ENV === 'production';

  // ── Detect subdomain context ──────────────────────────────────────────────
  const isAdminHost      = hostname.startsWith('admin.');
  const isAppHost        = hostname.startsWith('app.');
  const isAmbassadorHost = hostname.startsWith('ambassador.');

  // Normalise clean root domain for port preservation in dev (e.g. localhost:3000)
  const cleanHost = hostname.replace(/^(app|admin|ambassador)\./, '');
  const rootBase  = isProd ? 'https://meova.in' : `http://${cleanHost}`;
  const appBase   = isProd ? 'https://app.meova.in' : `http://app.${cleanHost}`;

  // ── SEO Backwards Compatibility: /gla-university → /college/gla-university ─
  if (pathname === '/gla-university' || pathname.startsWith('/gla-university/')) {
    return NextResponse.redirect(new URL('/college/gla-university', rootBase), 308);
  }

  // ── AMBASSADOR subdomain: redirect to public root recruitment page ────────
  if (isAmbassadorHost) {
    const dest = pathname === '/' || pathname === '/ambassador' ? '/ambassador' : pathname;
    return NextResponse.redirect(new URL(dest, rootBase), 308);
  }

  // ── ADMIN subdomain (admin.meova.in / admin.localhost) ─────────────────────
  if (isAdminHost) {
    const isAdminPublic =
      pathname === '/login' ||
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/api/health') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/icon') ||
      pathname.startsWith('/logo') ||
      pathname.startsWith('/favicon') ||
      pathname === '/favicon.ico';

    if (isAdminPublic) return NextResponse.next();

    // Check for auth cookie
    const allCookies = request.cookies.getAll();
    const hasAuthCookie = allCookies.some(
      (c) =>
        c.name === '__Meova_admin_session' ||
        c.name === '__Meova_session' ||
        c.name.includes('auth-token') ||
        c.name.startsWith('sb-')
    );

    if (!hasAuthCookie) {
      // If not authenticated on admin domain, directly redirect to main homepage
      return NextResponse.redirect(new URL('/', rootBase));
    }

    // Rewrite admin root → /admin
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/admin', request.url));
    }

    return NextResponse.next();
  }

  // ── Helper to check if any valid auth cookie is present ───────────────────
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some((c) => {
    const val = c.value?.trim() || '';
    if (!val || val === 'deleted' || val.length < 5) return false;
    return (
      c.name === '__Meova_session' ||
      c.name === '__Meova_admin_session' ||
      c.name === 'sb-access-token' ||
      c.name === 'sb-auth-token' ||
      c.name === '__session' ||
      c.name.includes('auth-token') ||
      c.name.startsWith('sb-')
    );
  });

  // ── PWA Detection ────────────────────────────────────────────────────────
  const urlSource = request.nextUrl.searchParams.get('source');
  const isPWA = urlSource === 'pwa' || request.cookies.get('__meova_pwa')?.value === '1';

  // ── APP subdomain (app.meova.in / app.localhost) ───────────────────────────
  if (isAppHost) {
    // Whitelist login and signup pages on app host
    if (pathname === '/login' || pathname === '/signup') {
      if (hasAuthCookie) {
        return NextResponse.redirect(new URL('/', request.url));
      }
      return NextResponse.next();
    }

    // Static / health / API auth are always public even on app subdomain
    const isAppPublic =
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/api/health') ||
      pathname.startsWith('/api/ping') ||
      pathname.startsWith('/api/contact') ||
      pathname.startsWith('/api/colleges') ||
      pathname.startsWith('/api/cron') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/.well-known/') ||
      pathname === '/manifest.json' ||
      pathname === '/sw.js' ||
      pathname === '/offline' ||
      pathname.startsWith('/icon') ||
      pathname.startsWith('/logo') ||
      pathname.startsWith('/favicon') ||
      pathname === '/favicon.ico';

    if (isAppPublic) return NextResponse.next();

    if (!hasAuthCookie) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // If in PWA or dev, keep on app host login to avoid crossing origin and showing browser URL bar
      const targetBase = (isProd && !isPWA) ? rootBase : `http${isProd ? 's' : ''}://${hostname}`;
      const loginUrl = new URL('/login', targetBase);
      if (pathname !== '/' && !pathname.startsWith('/login') && !pathname.startsWith('/signup')) {
        loginUrl.searchParams.set('redirect', pathname);
      }
      const res = NextResponse.redirect(loginUrl);
      if (isPWA) {
        res.cookies.set('__meova_pwa', '1', { path: '/', sameSite: 'lax', maxAge: 31536000 });
      }
      return res;
    }

    return NextResponse.next();
  }

  // ── ROOT domain (meova.in / localhost) ────────────────────────────────────

  // Whitelist all public routes, SEO files, static assets, and public APIs
  const isPublic =
    pathname === '/' ||
    pathname === '/ambassador' ||
    pathname.startsWith('/ambassador/') ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/terms' ||
    pathname === '/privacy' ||
    pathname === '/refund-policy' ||
    pathname === '/community-guidelines' ||
    pathname === '/grievance' ||
    pathname === '/about' ||
    pathname === '/contact' ||
    pathname === '/help' ||
    pathname.startsWith('/help/') ||
    pathname === '/blog' ||
    pathname.startsWith('/blog/') ||
    pathname === '/offline' ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    pathname.startsWith('/college/') ||
    pathname.endsWith('.xml') ||
    pathname.endsWith('.txt') ||
    pathname.endsWith('.json') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/colleges') ||
    pathname.startsWith('/api/contact') ||
    pathname.startsWith('/api/ambassador/apply') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/api/ping') ||
    pathname.startsWith('/api/cron') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/.well-known/') ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/logo') ||
    pathname.startsWith('/favicon') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js';

  // 1. Public routes & assets (always pass through)
  if (isPublic) {
    // In PWA standalone app mode: unauthenticated visitors on root / MUST NOT see marketing page -> redirect directly to /login
    if (isPWA && !hasAuthCookie && pathname === '/') {
      const loginUrl = new URL('/login', rootBase);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.set('__meova_pwa', '1', { path: '/', sameSite: 'lax', maxAge: 31536000 });
      return res;
    }

    // In standard production browser (non-PWA): authenticated users visiting marketing/auth form redirect to app
    if (!isPWA && isProd && hasAuthCookie && (pathname === '/' || pathname === '/login' || pathname === '/signup')) {
      return NextResponse.redirect(new URL('/', appBase));
    }

    const res = NextResponse.next();
    if (urlSource === 'pwa' && request.cookies.get('__meova_pwa')?.value !== '1') {
      res.cookies.set('__meova_pwa', '1', { path: '/', sameSite: 'lax', maxAge: 31536000 });
    }
    return res;
  }

  // 2. Protected API routes: NEVER redirect to an HTML login page
  if (pathname.startsWith('/api/')) {
    if (!hasAuthCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // 3. Protected pages in installed PWA (source=pwa or __meova_pwa cookie):
  // Keep execution on current domain so Chrome/Edge PWA stays 100% within scope
  // and NEVER shows the out-of-scope URL bar!
  if (isPWA) {
    if (!hasAuthCookie) {
      const loginUrl = new URL('/login', rootBase);
      loginUrl.searchParams.set('redirect', pathname);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.set('__meova_pwa', '1', { path: '/', sameSite: 'lax', maxAge: 31536000 });
      return res;
    }

    const res = NextResponse.next();
    if (urlSource === 'pwa' && request.cookies.get('__meova_pwa')?.value !== '1') {
      res.cookies.set('__meova_pwa', '1', { path: '/', sameSite: 'lax', maxAge: 31536000 });
    }
    return res;
  }

  // 4. Standard browser tab on root domain:
  // Redirect authenticated user to app subdomain in prod
  if (hasAuthCookie) {
    if (isProd) {
      return NextResponse.redirect(new URL(pathname + request.nextUrl.search, appBase));
    }
    return NextResponse.next();
  }

  // Otherwise redirect unauthenticated visitor to login on root
  const loginUrl = new URL('/login', rootBase);
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);

}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - static image/asset extensions, xml, txt
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|xml|txt)).*)',
  ],
};
