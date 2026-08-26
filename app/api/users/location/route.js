/**
 * POST /api/users/location
 * Updates the authenticated user's isLiveOnCampus status.
 * Called by the useCampusPresence hook every 5 minutes.
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/getAdminUser';
import { adminDb } from '../../../../lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!adminDb) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

    const body = await request.json();
    const isLiveOnCampus = !!body.isLiveOnCampus;

    await adminDb.collection('users').doc(user.uid).set(
      {
        isLiveOnCampus,
        lastLocationUpdate: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, isLiveOnCampus });
  } catch (err) {
    console.error('[POST /api/users/location]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

