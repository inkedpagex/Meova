/**
 * GET  /api/chats/[id]/messages - Get messages for a specific chat
 * POST /api/chats/[id]/messages - Send a new message to a specific chat
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../../lib/getAdminUser';
import { adminDb } from '../../../../../lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendPush } from '../../../../../lib/sendPushNotification';

export async function GET(request, { params }) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!adminDb) return NextResponse.json({ messages: [] });

    const { id: chatId } = await params;
    
    const chatDoc = await adminDb.collection('chats').doc(chatId).get();
    if (!chatDoc.exists) {
      return NextResponse.json({ messages: [] });
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
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!adminDb) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

    const { id: chatId } = await params;
    const { text } = await request.json();
    
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    const chatRef = adminDb.collection('chats').doc(chatId);
    let chatDoc = await chatRef.get();

    if (!chatDoc.exists) {
      // Auto-create chat document if it doesn't exist yet
      const rawParts = chatId.startsWith('group_')
        ? [user.uid, 'group']
        : chatId.split('_').filter(Boolean);
      const participants = Array.from(new Set([user.uid, ...rawParts]));

      await chatRef.set({
        id: chatId,
        participants,
        participantNames: { [user.uid]: user.name || user.email || 'User' },
        createdAt: FieldValue.serverTimestamp(),
        lastMessage: text.trim(),
        lastMessageAt: FieldValue.serverTimestamp(),
        lastSenderId: user.uid,
      }, { merge: true });

      chatDoc = await chatRef.get();
    } else {
      const currentParts = chatDoc.data()?.participants || [];
      if (!currentParts.includes(user.uid)) {
        await chatRef.update({
          participants: FieldValue.arrayUnion(user.uid)
        });
      }
    }

    const chatData = chatDoc.data() || {};
    const otherId = (chatData.participants || []).find(p => p !== user.uid);
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

    // 3. Push notification to the recipient (fire-and-forget, non-blocking)
    if (otherId) {
      const senderName = user.name || user.email?.split('@')[0] || 'Someone';
      const preview = text.trim().length > 60 ? text.trim().slice(0, 60) + '…' : text.trim();
      sendPush(otherId, {
        title: `💬 ${senderName}`,
        body: preview,
        url: `/messages`,
      }).catch(() => {}); // never block the response
    }

    return NextResponse.json({ ok: true, messageId: msgRef.id });
  } catch (err) {
    console.error('[POST /api/chats/[id]/messages]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}



