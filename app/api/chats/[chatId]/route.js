/**
 * PATCH /api/chats/[chatId]  — Mark chat as read for current user
 */
import { NextResponse } from 'next/server';
import { getUserWithRole } from '../../../../lib/getAdminUser';
import { adminDb } from '../../../../lib/firebaseAdmin';

export async function PATCH(request, { params }) {
  try {
    const user = await getUserWithRole();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!adminDb) return NextResponse.json({ ok: false });

    const { chatId } = await params;
    const chatRef = adminDb.collection('chats').doc(chatId);
    const snap = await chatRef.get();

    if (!snap.exists) return NextResponse.json({ error: 'Chat not found' }, { status: 404 });

    const data = snap.data();
    if (!data.participants.includes(user.uid)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Reset unread count for this user
    await chatRef.update({
      [`unreadCount.${user.uid}`]: 0,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /api/chats/[chatId]]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
