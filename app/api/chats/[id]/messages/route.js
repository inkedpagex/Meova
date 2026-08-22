/**
 * POST /api/chats/[id]/messages
 * Send a message via server-side Admin SDK — no Firebase Client Auth needed.
 */
import { NextResponse } from 'next/server';
import { getUserWithRole } from '../../../../lib/getAdminUser';
import { adminDb } from '../../../../lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request, { params }) {
  try {
    const user = await getUserWithRole();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: chatId } = await params;
    const { text } = await request.json();
    if (!text?.trim()) return NextResponse.json({ error: 'Message text required' }, { status: 400 });

    if (!adminDb) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

    const chatRef = adminDb.collection('chats').doc(chatId);
    const chatSnap = await chatRef.get();
    if (!chatSnap.exists) return NextResponse.json({ error: 'Chat not found' }, { status: 404 });

    const chatData = chatSnap.data();
    // Security: only chat participants can send messages
    if (!chatData.participants?.includes(user.uid)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const otherId = chatData.participants.find(p => p !== user.uid);
    const ts = FieldValue.serverTimestamp();

    // Add message to sub-collection
    const msgRef = await adminDb
      .collection('chats').doc(chatId)
      .collection('messages')
      .add({
        senderId: user.uid,
        text: text.trim(),
        timestamp: ts,
        status: 'sent',
      });

    // Update chat metadata + increment unread for other user
    await chatRef.update({
      lastMessage: text.trim(),
      lastMessageAt: ts,
      lastSenderId: user.uid,
      ...(otherId ? { [`unreadCount.${otherId}`]: FieldValue.increment(1) } : {}),
      [`unreadCount.${user.uid}`]: 0,
    });

    return NextResponse.json({ success: true, messageId: msgRef.id });
  } catch (err) {
    console.error('[POST /api/chats/[id]/messages]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
