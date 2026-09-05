import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendPush } from '@/lib/sendPushNotification';

export async function POST(request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      targetUserId,
      bookingId,
      location,
      callerName,
      callerPhoto,
      callType = 'voice',
      roomId: customRoomId,
    } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    // Server-Side Gating: Both caller and callee must be verified to use calling
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, tier')
      .in('id', [user.uid, targetUserId]);

    const callerProf = profiles?.find((p) => p.id === user.uid);
    const calleeProf = profiles?.find((p) => p.id === targetUserId);

    if (callerProf?.tier !== 'verified' || calleeProf?.tier !== 'verified') {
      return NextResponse.json(
        { error: 'Voice and video calling is available for verified peers only.' },
        { status: 403 }
      );
    }

    const name = callerName || user.full_name || 'Campus Student';
    const loc = location || 'Campus Meetup';
    const sortedPair = [user.uid, targetUserId].sort().join('_');
    const roomId = customRoomId || `call_${bookingId ? `booking_${bookingId}` : `peer_${sortedPair}`}`;
    const isVideo = callType === 'video';

    // Log call attempt in calls table
    await supabaseAdmin
      .from('calls')
      .insert({
        caller_id: user.uid,
        callee_id: targetUserId,
        call_type: callType,
        room_id: roomId,
        status: 'initiated',
        created_at: new Date().toISOString(),
      })
      .catch((err) => console.warn('[calls table insert]', err.message));

    // sendPush handles BOTH in-app notification insert + device FCM push in one call
    await sendPush(targetUserId, {
      title: isVideo ? 'Incoming Video Call' : 'Incoming Voice Call',
      body: isVideo
        ? `${name} is requesting a 1-on-1 video call`
        : `${name} is calling you for your meetup at ${loc}`,
      url: `/messages?userId=${user.uid}&callRoom=${roomId}&callType=${callType}&autoAnswer=true`,
      type: 'incoming_call',
      isCall: true,
      callType,
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
