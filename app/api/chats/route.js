/**
 * GET  /api/chats  — Get current user's chat list (sorted by lastMessageAt desc)
 * POST /api/chats  — Create or get a DM chat with another user
 */
import { NextResponse } from 'next/server';
import { getUserWithRole } from '../../../lib/getAdminUser';
import { adminDb } from '../../../lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET() {
  try {
    const user = await getUserWithRole();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!adminDb) return NextResponse.json({ chats: [] });

    const snap = await adminDb
      .collection('chats')
      .where('participants', 'array-contains', user.uid)
      .get();

    const chats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Client-side sort by lastMessageAt descending
    chats.sort((a, b) => {
      const timeA = a.lastMessageAt?.toMillis ? a.lastMessageAt.toMillis() : 0;
      const timeB = b.lastMessageAt?.toMillis ? b.lastMessageAt.toMillis() : 0;
      return timeB - timeA;
    });

    return NextResponse.json({ chats: chats.slice(0, 50) });
  } catch (err) {
    console.error('[GET /api/chats]', err.message);
    return NextResponse.json({ chats: [] });
  }
}

export async function POST(request) {
  try {
    const user = await getUserWithRole();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!adminDb) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

    const { otherUserId } = await request.json();
    if (!otherUserId) return NextResponse.json({ error: 'otherUserId required' }, { status: 400 });
    if (otherUserId === user.uid) return NextResponse.json({ error: 'Cannot chat with yourself' }, { status: 400 });

    // Deterministic chat ID — sorted so both users get same ID
    const sorted = [user.uid, otherUserId].sort();
    const chatId = `${sorted[0]}_${sorted[1]}`;

    // Fetch other user's profile for name/photo
    let otherName = 'User';
    let otherPhoto = '';
    try {
      const otherDoc = await adminDb.collection('users').doc(otherUserId).get();
      if (otherDoc.exists) {
        const d = otherDoc.data();
        otherName = d.full_name || d.email?.split('@')[0] || 'User';
        otherPhoto = d.photo_url || '';
      }
    } catch (_) {}

    // Create chat doc if it doesn't exist (merge = safe idempotent)
    const chatRef = adminDb.collection('chats').doc(chatId);
    const existing = await chatRef.get();

    if (!existing.exists) {
      await chatRef.set({
        participants: [user.uid, otherUserId],
        participantNames: {
          [user.uid]: user.full_name || 'User',
          [otherUserId]: otherName,
        },
        participantPhotos: {
          [user.uid]: user.photo_url || '',
          [otherUserId]: otherPhoto,
        },
        lastMessage: '',
        lastMessageAt: FieldValue.serverTimestamp(),
        lastSenderId: '',
        unreadCount: { [user.uid]: 0, [otherUserId]: 0 },
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ chatId });
  } catch (err) {
    console.error('[POST /api/chats]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
