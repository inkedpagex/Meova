import { NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/getAdminUser';
import { supabaseAdmin } from '../../../lib/supabase/admin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('targetUserId');

    let query = supabaseAdmin
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (targetUserId) {
      query = query.eq('target_user_id', targetUserId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[GET /api/reviews]', error.message);
      return NextResponse.json({ reviews: [] });
    }

    return NextResponse.json({ reviews: data || [] });
  } catch (err) {
    console.error('[GET /api/reviews]', err.message);
    return NextResponse.json({ reviews: [] });
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { bookingId, targetUserId, rating, written } = await request.json();

    if (!bookingId || !targetUserId || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (targetUserId === user.uid) {
      return NextResponse.json({ error: 'You cannot review yourself' }, { status: 400 });
    }

    const numRating = Math.min(5, Math.max(1, Math.round(Number(rating)) || 5));

    const review = {
      reviewer_id: user.uid,
      target_user_id: targetUserId,
      rating: numRating,
      comment: (written || '').slice(0, 500),
      created_at: new Date().toISOString(),
    };

    const { error: reviewErr } = await supabaseAdmin.from('reviews').insert(review);
    if (reviewErr) throw new Error(reviewErr.message);

    // Notify the user who received the review
    await supabaseAdmin.from('notifications').insert({
      user_id: targetUserId,
      sender_id: user.uid,
      title: 'New Review Received! ⭐',
      message: `${user.full_name || 'Someone'} left you a ${rating}-star review.`,
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
