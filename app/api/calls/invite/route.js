import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { sendPush } from '@/lib/sendPushNotification';

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
    const loc = location || 'Campus Meetup';
    const roomId = `call_${bookingId || `${user.uid}_${targetUserId}`}`;

    // sendPush handles BOTH in-app notification insert + device web push in one call
    await sendPush(targetUserId, {
      title: 'Incoming Voice Call',
      body: `${name} is calling you for your meetup at ${loc}`,
      url: `/bookings?callRoom=${roomId}&callerId=${user.uid}&autoAnswer=true`,
      type: 'incoming_call',
      isCall: true,
      bookingId: bookingId || null,
      callerPhoto: callerPhoto || '',
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      roomId,
      message: 'Call invite dispatched',
    });
  } catch (err) {
    console.error('[POST /api/calls/invite]', err.message);
    return NextResponse.json({ error: 'Failed to dispatch call' }, { status: 500 });
  }
}
