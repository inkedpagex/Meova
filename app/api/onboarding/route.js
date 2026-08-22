import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__meetify_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify session
    let uid;
    try {
      const decoded = await adminAuth.verifyIdToken(sessionCookie);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const {
      username,
      full_name,
      year,
      branch,
      university,
      bio,
      interests,
      instagram,
      photo_url,
    } = body;

    // ── Validation ──────────────────────────────────────────────
    const errors = [];
    if (!username || !USERNAME_REGEX.test(username.toLowerCase().trim()))
      errors.push('Username is invalid (3-20 chars, lowercase, letters/numbers/underscores).');
    if (!full_name?.trim()) errors.push('Full name is required.');
    if (!year) errors.push('Year of study is required.');
    if (!branch?.trim()) errors.push('Branch / Course is required.');
    if (!photo_url) errors.push('Profile photo is required.');
    if (!interests || interests.length < 1) errors.push('Select at least 1 interest.');

    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0] }, { status: 400 });
    }

    const cleanUsername = username.toLowerCase().trim();

    if (!adminDb) {
      return NextResponse.json({ error: 'Server not initialized.' }, { status: 500 });
    }

    // ── Atomically claim username using Firestore transaction ────
    const userRef = adminDb.collection('users').doc(uid);
    const usernameRef = adminDb.collection('usernames').doc(cleanUsername);

    await adminDb.runTransaction(async (tx) => {
      const usernameSnap = await tx.get(usernameRef);

      if (usernameSnap.exists && usernameSnap.data().uid !== uid) {
        throw new Error('USERNAME_TAKEN');
      }

      // Check if user already has a different username and release it
      const userSnap = await tx.get(userRef);
      const existingUsername = userSnap.exists ? userSnap.data().username : null;
      if (existingUsername && existingUsername !== cleanUsername) {
        const oldUsernameRef = adminDb.collection('usernames').doc(existingUsername);
        tx.delete(oldUsernameRef);
      }

      // Claim new username
      tx.set(usernameRef, { uid, claimedAt: new Date().toISOString() });

      // Update user profile
      const profileData = {
        username: cleanUsername,
        full_name: full_name.trim(),
        year,
        branch: branch.trim(),
        university: university?.trim() || '',
        bio: bio?.trim() || '',
        interests: interests || [],
        instagram: instagram?.trim() || '',
        photo_url: photo_url || '',
        profileComplete: true,
        updated_at: new Date().toISOString(),
      };

      if (userSnap.exists) {
        tx.update(userRef, profileData);
      } else {
        tx.set(userRef, { ...profileData, role: 'user', created_at: new Date().toISOString() });
      }
    });

    // Update profile override cookie so server components pick up the changes instantly
    cookieStore.set(
      '__meetify_profile_overrides',
      JSON.stringify({ full_name: full_name.trim(), username: cleanUsername, photo_url: photo_url || '' }),
      { maxAge: 60 * 60 * 24 * 30, path: '/' }
    );

    // ── Critical: set profileComplete cookie so layout gate skips the Firestore
    // check on the very next request (prevents ERR_FAILED redirect loop on slow
    // connections where Firestore write hasn't propagated yet).
    cookieStore.set('__meetify_pc', '1', {
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err.message === 'USERNAME_TAKEN') {
      return NextResponse.json({ error: 'This username was just taken. Please choose another.' }, { status: 409 });
    }
    console.error('[onboarding POST]', err.message);
    return NextResponse.json({ error: err.message || 'Server error.' }, { status: 500 });
  }
}
