import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../lib/firebaseAdmin';
import { rateLimit, getClientIp } from '../../../../lib/rateLimit';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`auth:${ip}`, { limit: 20, windowMs: 5 * 60_000 });
    if (!rl.ok) {
      return NextResponse.json({ error: 'Too many login attempts. Please try again later.' }, {
        status: 429,
        headers: { 'Retry-After': rl.retryAfter }
      });
    }

    const { accessToken } = await request.json();
    if (!accessToken) {
      return NextResponse.json({ error: 'Access token required' }, { status: 400 });
    }

    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 503 });
    }

    // 1. Verify the Google access token by fetching the user profile from Google
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (!googleRes.ok) {
      console.error('Google token verification failed:', await googleRes.text());
      return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 });
    }

    const googleUser = await googleRes.json();
    if (!googleUser.email) {
      return NextResponse.json({ error: 'No email associated with this Google account' }, { status: 400 });
    }

    // 2. We use the Google user's sub (Google User ID) or email as the UID.
    // It's safer to use the 'sub' field (unique Google ID), or map it to a Firebase user.
    // Let's create or update the user in Firebase Auth using the email.
    let firebaseUid;
    try {
      const userRecord = await adminAuth.getUserByEmail(googleUser.email);
      firebaseUid = userRecord.uid;
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new user in Firebase Auth
        const newUser = await adminAuth.createUser({
          email: googleUser.email,
          emailVerified: true,
          displayName: googleUser.name,
          photoURL: googleUser.picture,
        });
        firebaseUid = newUser.uid;
      } else {
        throw error;
      }
    }

    // 3. Mint a Firebase Custom Token
    const customToken = await adminAuth.createCustomToken(firebaseUid);

    return NextResponse.json({ customToken });
  } catch (err) {
    console.error('[POST /api/auth/google]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
