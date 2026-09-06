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
      pathname === '/manifest.json' ||
      pathname === '/sw.js' ||
      pathname === '/offline' ||
      pathname.startsWith('/icon') ||
      pathname.startsWith('/logo') ||
      pathname.startsWith('/favicon') ||
      pathname === '/favicon.ico';

    if (isAppPublic) return NextResponse.next();

    if (!hasAuthCookie) {
      // In production, redirect to root marketing login. In dev, keep on app.localhost to retain dev cookie scope.
      const targetBase = isProd ? rootBase : `http://${hostname}`;
      const loginUrl = new URL('/login', targetBase);
      if (pathname !== '/' && !pathname.startsWith('/login') && !pathname.startsWith('/signup')) {
        loginUrl.searchParams.set('redirect', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // ── ROOT domain (meova.in / localhost) ────────────────────────────────────
  // In production: if already authenticated and visiting root marketing or auth form, redirect to product app
  if (isProd && hasAuthCookie && (pathname === '/' || pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/', appBase));
  }

  // Whitelist all public routes, SEO files, static assets, and public college/ambassador paths
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
    pathname.startsWith('/icon') ||
    pathname.startsWith('/logo') ||
    pathname.startsWith('/favicon') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js';

  if (isPublic) return NextResponse.next();

  // Any other protected route hit directly on root domain:
  // In production: redirect authenticated user to app.meova.in
  // In dev: keep on localhost so session cookies are preserved without browser cross-subdomain loss
  if (hasAuthCookie) {
    if (isProd) {
      return NextResponse.redirect(new URL(pathname + request.nextUrl.search, appBase));
    }
    return NextResponse.next();
  }

  // Otherwise redirect to login on root
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
