import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { targetUserId, bookingId, location, callerName, callerPhoto } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    const name = callerName || user.full_name || 'Campus Student';
    const photo = callerPhoto || user.photo_url || '';
    const loc = location || 'Campus Meetup';
    const roomId = `call_${bookingId || `${user.uid}_${targetUserId}`}`;

    // 1. Insert In-App Notification
    await supabaseAdmin.from('notifications').insert({
      user_id: targetUserId,
      title: 'Incoming Campus Voice Call',
      message: `${name} is calling you for your meetup at ${loc}`,
      type: 'incoming_call',
      booking_id: bookingId || null,
      action_url: `/bookings?callRoom=${roomId}&callerId=${user.uid}&autoAnswer=true`,
      read: false,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      roomId,
      message: 'Call invite dispatched'
    });
  } catch (err) {
    console.error('[POST /api/calls/invite]', err.message);
    return NextResponse.json({ error: 'Failed to dispatch call' }, { status: 500 });
  }
}
