/**
 * POST /api/notifications
 * Server-side utility to write a notification to a user's sub-collection.
 * Called internally from bookings, wallet, and messages API routes.
 *
 * Body: { userId, title, body, type }
 * Types: 'booking' | 'sparks' | 'message'
 */
import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { rateLimit } from '../../../lib/rateLimit';
import { getUserWithRole } from '../../../lib/getAdminUser';

export async function GET(req) {
  try {
    const user = await getUserWithRole();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const snap = await adminDb
      .collection('users')
      .doc(user.id)
      .collection('notifications')
      .orderBy('created_at', 'desc')
      .limit(30)
      .get();

    const notifications = snap.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        title: d.title,
        body: d.body,
        type: d.type,
        read: d.read,
        created_at: d.created_at?.toDate?.()?.toISOString() || null,
      };
    });

    const unreadCount = notifications.filter(n => !n.read).length;
    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    console.error('[GET /api/notifications]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(req) {
  // Mark all as read
  try {
    const user = await getUserWithRole();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const snap = await adminDb
      .collection('users')
      .doc(user.id)
      .collection('notifications')
      .where('read', '==', false)
      .get();

    const batch = adminDb.batch();
    snap.docs.forEach(doc => batch.update(doc.ref, { read: true }));
    await batch.commit();

    return NextResponse.json({ success: true, marked: snap.size });
  } catch (err) {
    console.error('[PATCH /api/notifications]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req) {
  const limited = rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const { userId, title, body, type } = await req.json();
    if (!userId || !title || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validTypes = ['booking', 'sparks', 'message'];
    const notifType = validTypes.includes(type) ? type : 'system';

    await adminDb
      .collection('users')
      .doc(userId)
      .collection('notifications')
      .add({
        title,
        body,
        type: notifType,
        read: false,
        created_at: FieldValue.serverTimestamp(),
      });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/notifications]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
