/**
 * POST /api/fcm/register
 * Save an FCM device token for the authenticated user.
 * Called by the client's useFCM hook on first permission grant.
 */
import { NextResponse } from 'next/server';
import { getUserWithRole } from '../../../../lib/getAdminUser';
import { adminDb } from '../../../../lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request) {
  try {
    const user = await getUserWithRole();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!adminDb) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

    const { token } = await request.json();
    if (!token || typeof token !== 'string' || token.length < 10) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    // Store token in users/{uid}/fcmTokens/{token} (token as doc ID for easy dedup)
    const tokenRef = adminDb
      .collection('users')
      .doc(user.uid)
      .collection('fcmTokens')
      .doc(token.slice(-40)); // Use last 40 chars as doc ID to avoid Firestore path length limits

    await tokenRef.set({
      token,
      platform: 'web',
      userAgent: request.headers.get('user-agent') || '',
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/fcm/register]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  // Unregister a token (when user logs out)
  try {
    const user = await getUserWithRole();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!adminDb) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

    const { token } = await request.json();
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

    await adminDb
      .collection('users')
      .doc(user.uid)
      .collection('fcmTokens')
      .doc(token.slice(-40))
      .delete();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/fcm/register]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
