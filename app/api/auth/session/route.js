// Route Handler: stores the Firebase ID token in a cookie since firebase-admin is removed.
// Called from AuthForm after successful Firebase Auth sign-in.
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getUserWithRole } from '../../../../lib/getAdminUser';

const SESSION_COOKIE_NAME = '__meetuply_session';
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
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, idToken, {
      maxAge: SESSION_DURATION_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    if (profileOverrides) {
      cookieStore.set('__meetuply_profile_overrides', JSON.stringify(profileOverrides), {
        maxAge: SESSION_DURATION_MS / 1000,
        path: '/',
        sameSite: 'lax',
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Session cookie creation failed:', err);
    return NextResponse.json({ error: 'Cookie error' }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ success: true });
}

