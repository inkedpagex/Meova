// Route Handler: stores the Firebase ID token in a cookie since firebase-admin is removed.
// Called from AuthForm after successful Firebase Auth sign-in.
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getUserWithRole } from '../../../../lib/getAdminUser';

const SESSION_COOKIE_NAME = '__Meova_session';
const SESSION_DURATION_MS = 60 * 60 * 24 * 5 * 1000; // 5 days

const loginAttempts = new Map(); // ip -> { count, lastAttempt }

function checkRateLimit(ip) {
  const now = Date.now();
  const limitWindow = 60 * 1000; // 1 minute
  const maxAttempts = 5; // 5 attempts per minute

  if (!loginAttempts.has(ip)) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
    return true;
  }

  const record = loginAttempts.get(ip);
  if (now - record.lastAttempt > limitWindow) {
    record.count = 1;
    record.lastAttempt = now;
    return true;
  }

  record.count += 1;
  record.lastAttempt = now;

  if (record.count > maxAttempts) {
    return false;
  }
  return true;
}

export async function GET() {
  try {
    const user = await getUserWithRole();
    if (!user) {
      return NextResponse.json({ user: null });
    }
    return NextResponse.json({ user });
  } catch (err) {
    console.error('Session retrieve failed:', err);
    return NextResponse.json({ error: 'Session error' }, { status: 500 });
  }
}

export async function POST(request) {
  // Simple IP rate-limiting to prevent "doom/brute-force" attacks
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many login attempts. Please try again in 1 minute.' }, { status: 429 });
  }

  const { idToken, profileOverrides } = await request.json();
  if (!idToken) {
    return NextResponse.json({ error: 'ID token required' }, { status: 400 });
  }

  try {
    const host = request.headers.get('host') || '';
    const isAdminHost = host.startsWith('admin.');
    const isProd = process.env.NODE_ENV === 'production';

    const cookieStore = await cookies();
    
    if (isAdminHost) {
      // Set isolated host-only cookie for admin domain without wildcard .meova.in
      cookieStore.set('__Meova_admin_session', idToken, {
        maxAge: SESSION_DURATION_MS / 1000,
        httpOnly: true,
        secure: isProd,
        path: '/',
        sameSite: 'lax',
      });
    }

    // Set standard product session cookie
    cookieStore.set(SESSION_COOKIE_NAME, idToken, {
      maxAge: SESSION_DURATION_MS / 1000,
      httpOnly: true,
      secure: isProd,
      path: '/',
      sameSite: 'lax',
      // Share session across root (meova.in) and product app (app.meova.in) in production
      ...(isProd && { domain: '.meova.in' }),
    });

    if (profileOverrides) {
      cookieStore.set('__Meova_profile_overrides', JSON.stringify(profileOverrides), {
        maxAge: SESSION_DURATION_MS / 1000,
        path: '/',
        sameSite: 'lax',
        ...(isProd && { domain: '.meova.in' }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Session cookie creation failed:', err);
    return NextResponse.json({ error: 'Cookie error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const response = NextResponse.json({ success: true });
  const isProd = process.env.NODE_ENV === 'production';

  const cookiesToClear = [
    SESSION_COOKIE_NAME,
    '__Meova_session',
    '__Meova_admin_session',
    '__Meova_profile_overrides',
    '__Meova_pc',
    'sb-access-token',
    'sb-auth-token',
    'supabase-auth-token',
  ];

  // Domains to purge: wildcard .meova.in, root meova.in, and host-only
  const domains = isProd ? ['.meova.in', 'meova.in', ''] : [''];

  cookiesToClear.forEach((name) => {
    domains.forEach((domain) => {
      const domainAttr = domain ? `; Domain=${domain}` : '';
      // Expired cookie with Max-Age=0
      response.headers.append(
        'Set-Cookie',
        `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${isProd ? '; Secure' : ''}${domainAttr}`
      );
    });
  });

  return response;
}


