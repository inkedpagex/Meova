// Route Handler: creates/deletes Firebase session cookie after login.
// Called from AuthForm after successful Firebase Auth sign-in.
import { adminAuth, isFirebaseAdminConfigured } from '../../../../lib/firebaseAdmin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = '__meetify_session';
const SESSION_DURATION_MS = 60 * 60 * 24 * 5 * 1000; // 5 days

export async function POST(request) {
  if (!isFirebaseAdminConfigured) {
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 503 });
  }

  const { idToken } = await request.json();
  if (!idToken) {
    return NextResponse.json({ error: 'ID token required' }, { status: 400 });
  }

  try {
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: SESSION_DURATION_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Session cookie creation failed:', err);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ success: true });
}
