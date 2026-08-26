import { NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/getAdminUser';
import { adminDb } from '../../../lib/firebaseAdmin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('targetUserId');
    
    if (!adminDb) return NextResponse.json({ reviews: [] });

    let query = adminDb.collection('reviews');
    if (targetUserId) {
      query = query.where('targetUserId', '==', targetUserId);
    }
    
    const snap = await query.orderBy('created_at', 'desc').limit(20).get();
    const reviews = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return NextResponse.json({ reviews });
  } catch (err) {
    console.error('[GET /api/reviews]', err.message);
    return NextResponse.json({ reviews: [] });
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!adminDb) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

    const { bookingId, experienceId, targetUserId, rating, written, categories } = await request.json();

    if (!bookingId || !targetUserId || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const review = {
      bookingId,
      experienceId: experienceId || '',
      authorId: user.uid,
      authorName: user.full_name || 'Student',
      targetUserId,
      rating: Number(rating) || 5,
      written: written || '',
      categories: categories || [],
      created_at: new Date().toISOString(),
    };

    await adminDb.collection('reviews').add(review);

    // Notify the user who received the review
    await adminDb.collection('notifications').add({
      userId: targetUserId,
      title: 'New Review Received! ⭐',
      body: `${user.full_name || 'Someone'} left you a ${rating}-star review.`,
      type: 'review',
      read: false,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/reviews]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

