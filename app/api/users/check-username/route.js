import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// Allowed: lowercase letters, numbers, underscores, 3-20 chars
const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username')?.toLowerCase().trim();

  if (!username) {
    return NextResponse.json({ available: false, error: 'Username is required.' }, { status: 400 });
  }

  if (!USERNAME_REGEX.test(username)) {
    return NextResponse.json({
      available: false,
      error: 'Username must be 3-20 characters: lowercase letters, numbers, underscores only.',
    });
  }

  // Reserved usernames
  const RESERVED = ['admin', 'Meova', 'Meova', 'support', 'help', 'api', 'root', 'system', 'user', 'mod', 'moderator'];
  if (RESERVED.includes(username)) {
    return NextResponse.json({ available: false, error: 'This username is reserved.' });
  }

  if (!adminDb) {
    // If admin not init, fall through as available (dev mode)
    return NextResponse.json({ available: true });
  }

  try {
    // Check /usernames/{username} shadow collection — fastest uniqueness check
    const usernameDoc = await adminDb.collection('usernames').doc(username).get();
    if (usernameDoc.exists) {
      return NextResponse.json({ available: false });
    }

    // Double-check in users collection
    const usersSnap = await adminDb
      .collection('users')
      .where('username', '==', username)
      .limit(1)
      .get();

    return NextResponse.json({ available: usersSnap.empty });
  } catch (err) {
    console.error('[check-username]', err.message);
    return NextResponse.json({ available: false, error: 'Server error.' }, { status: 500 });
  }
}
