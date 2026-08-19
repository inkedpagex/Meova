/**
 * POST /api/users/free-now
 * Toggles the user's "I'm Free Now" status.
 */
import { NextResponse } from 'next/server';
import { getUserWithRole } from '@/lib/getAdminUser';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request) {
  try {
    const user = await getUserWithRole();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!adminDb) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

    const { isFree, location, durationMinutes } = await request.json();

    const userRef = adminDb.collection('users').doc(user.uid);
    
    if (isFree) {
      // Set to free
      const until = new Date(Date.now() + (durationMinutes || 60) * 60000);
      await userRef.update({
        isLiveOnCampus: true,
        liveLocation: location || 'Campus',
        liveUntil: until.toISOString(),
      });
    } else {
      // Set to not free
      await userRef.update({
        isLiveOnCampus: false,
        liveLocation: FieldValue.delete(),
        liveUntil: FieldValue.delete(),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/users/free-now]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
