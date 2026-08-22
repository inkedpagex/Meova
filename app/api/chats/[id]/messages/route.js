/**
 * GET  /api/chats/[id]/messages - Get messages for a specific chat
 * POST /api/chats/[id]/messages - Send a new message to a specific chat
 */
import { NextResponse } from 'next/server';
import { getUserWithRole } from '../../../../../lib/getAdminUser';
import { adminDb } from '../../../../../lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request, { params }) {
  try {
    const user = await getUserWithRole();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!adminDb) return NextResponse.json({ messages: [] });

    const { id: chatId } = await params;
    
    // Security check: verify user is part of the chat
    const chatDoc = await adminDb.collection('chats').doc(chatId).get();
    if (!chatDoc.exists || !chatDoc.data().participants.includes(user.uid)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const messagesSnap = await adminDb
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .limit(100)
      .get();

    const messages = messagesSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : Date.now()
      };
    });

    return NextResponse.json({ messages });
  } catch (err) {
    console.error('[GET /api/chats/[id]/messages]', err.message);
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(request, { params }) {
  try {
    const user = await getUserWithRole();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!adminDb) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

    const { id: chatId } = await params;
    const { text } = await request.json();
    
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    const chatRef = adminDb.collection('chats').doc(chatId);
    const chatDoc = await chatRef.get();

    if (!chatDoc.exists || !chatDoc.data().participants.includes(user.uid)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const chatData = chatDoc.data();
    const otherId = chatData.participants.find(p => p !== user.uid);
    const ts = FieldValue.serverTimestamp();

    // 1. Add message
    const msgRef = chatRef.collection('messages').doc();
    const messageData = {
      senderId: user.uid,
      text: text.trim(),
      timestamp: ts,
      status: 'sent',
    };
    
    // We use a batch so message and chat update are atomic
    const batch = adminDb.batch();
    batch.set(msgRef, messageData);

    // 2. Update chat metadata
    const chatUpdate = {
      lastMessage: text.trim(),
      lastMessageAt: ts,
      lastSenderId: user.uid,
      [`unreadCount.${user.uid}`]: 0,
    };
    if (otherId) {
      chatUpdate[`unreadCount.${otherId}`] = FieldValue.increment(1);
    }
    
    batch.update(chatRef, chatUpdate);
    await batch.commit();

    return NextResponse.json({ ok: true, messageId: msgRef.id });
  } catch (err) {
    console.error('[POST /api/chats/[id]/messages]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
