/**
 * GET  /api/bookings    — Get user's bookings (enriched with profiles)
 * POST /api/bookings    — Create a booking (deducts sparks via wallet & creates escrow)
 * PATCH /api/bookings   — Update booking status (accept/reject/complete/dispute/cancel)
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/getAdminUser';
import { supabaseAdmin } from '../../../lib/supabase/admin';
import { spendSparks, creditSparks } from '../../../lib/wallet';
import { sendPushToUser } from '../../../lib/pushNotifications';
import { rateLimit } from '../../../lib/rateLimit';

export async function GET() {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .or(`guest_id.eq.${user.uid},host_id.eq.${user.uid}`)
      .order('created_at', { ascending: false });

    if (error || !bookings) {
      console.error('[GET /api/bookings]', error?.message);
      return NextResponse.json({ bookings: [] });
    }

    // Collect user IDs to batch fetch profiles
    const userIds = new Set();
    bookings.forEach((b) => {
      if (b.guest_id) userIds.add(b.guest_id);
      if (b.host_id) userIds.add(b.host_id);
    });

    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, photo_url, username')
      .in('id', Array.from(userIds));

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    const enriched = bookings.map((b) => {
      const guest = profileMap.get(b.guest_id);
      const host = profileMap.get(b.host_id);
      return {
        ...b,
        price: b.sparks_spent !== undefined ? b.sparks_spent : 50,
        sparks_amount: b.sparks_spent !== undefined ? b.sparks_spent : 50,
        meeting_code: b.meeting_code || '',
        meetingCode: b.meeting_code || '',
        guest_name: guest?.full_name || 'Campus Peer',
        guest_photo: guest?.photo_url || '',
        guest_username: guest?.username || '',
        host_name: host?.full_name || 'Campus Host',
        host_photo: host?.photo_url || '',
        host_username: host?.username || '',
        title: b.agenda || '1-on-1 Campus Meetup',
        date: b.time_slot ? b.time_slot.split(' ')[0] : '',
        time: b.time_slot ? b.time_slot.split(' ').slice(1).join(' ') : '',
      };
    });

    return NextResponse.json({ bookings: enriched });
  } catch (err) {
    console.error('[GET /api/bookings]', err.message);
    return NextResponse.json({ bookings: [] });
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { hostId, price, location, date, time, timeSlot, agenda, title } = body;

    const meetTargetId = hostId;
    if (!meetTargetId) {
      return NextResponse.json({ error: 'Missing hostId' }, { status: 400 });
    }

    if (meetTargetId === user.uid) {
      return NextResponse.json({ error: 'Cannot book a meetup with yourself' }, { status: 400 });
    }

    // Rate Limiting (Anti-Spam): Max 5 pending requests
    const { count: pendingCount, error: countErr } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('guest_id', user.uid)
      .eq('status', 'Requested');

    if (!countErr && (pendingCount || 0) >= 5) {
      return NextResponse.json(
        { error: 'You have too many pending requests (Max: 5). Please wait for hosts to respond.' },
        { status: 429 }
      );
    }

    const priceAmount = Math.max(0, Number(price) || 50);
    let sparksDeducted = false;

    if (priceAmount > 0) {
      const spendResult = await spendSparks(
        user.uid,
        priceAmount,
        `Booked meetup: "${title || agenda || 'Campus Meet'}"`,
        'booking_escrow',
        null
      );

      if (!spendResult.ok) {
        return NextResponse.json({ error: spendResult.error || 'Insufficient Sparks' }, { status: 402 });
      }
      sparksDeducted = true;
    }

    const formattedTimeSlot = (timeSlot || [date, time].filter(Boolean).join(' ')).trim() || 'Flexible';
    const formattedAgenda = (agenda || title || '1-on-1 Campus Meetup').trim();
    const generatedCode = String(Math.floor(100000 + Math.random() * 900000));

    // Match exact Supabase public.bookings columns:
    // ['id', 'guest_id', 'host_id', 'sparks_spent', 'status', 'location', 'time_slot', 'agenda', 'meeting_code', 'created_at', 'updated_at']
    const bookingPayload = {
      guest_id: user.uid,
      host_id: meetTargetId,
      sparks_spent: priceAmount,
      status: 'Requested',
      location: location?.trim() || 'Campus',
      time_slot: formattedTimeSlot,
      agenda: formattedAgenda,
      meeting_code: generatedCode,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newBooking, error: insertErr } = await supabaseAdmin
      .from('bookings')
      .insert(bookingPayload)
      .select()
      .single();

    if (insertErr) {
      console.error('[POST /api/bookings insert error]', insertErr.message);
      // Auto-Rollback: Refund sparks if booking insertion failed
      if (sparksDeducted && priceAmount > 0) {
        await creditSparks(
          user.uid,
          priceAmount,
          'purchased',
          'refund',
          `Auto-refund for failed booking: "${formattedAgenda}"`
        ).catch((err) => console.error('[POST /api/bookings rollback failed]', err.message));
      }
      return NextResponse.json({ error: `Failed to create booking: ${insertErr.message}` }, { status: 500 });
    }

    // Notify host via notifications table
    await supabaseAdmin.from('notifications').insert({
      user_id: meetTargetId,
      sender_id: user.uid,
      title: 'New Booking Request',
      message: `${user.full_name || 'A classmate'} requested a meetup with you at ${bookingPayload.location}.`,
      type: 'booking',
      read: false,
      created_at: new Date().toISOString(),
    });

    // Send background PWA push notification to host
    sendPushToUser(meetTargetId, {
      title: 'New Booking Request',
      body: `${user.full_name || 'A classmate'} requested a meetup with you at ${bookingPayload.location}.`,
      url: '/bookings',
    }).catch(() => {});

    return NextResponse.json({
      booking: {
        ...newBooking,
        meeting_code: generatedCode,
        meetingCode: generatedCode,
        price: priceAmount,
        sparks_amount: priceAmount,
        title: formattedAgenda,
      },
    });
  } catch (err) {
    console.error('[POST /api/bookings]', err.message);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { bookingId, action, code } = await request.json();
    if (!bookingId || !action) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const { data: booking, error: fetchErr } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle();

    if (fetchErr || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Security check
    if (booking.host_id !== user.uid && booking.guest_id !== user.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const price = Number(booking.sparks_spent) || Number(booking.price) || 0;

    if (action === 'accept' && booking.host_id === user.uid) {
      await supabaseAdmin
        .from('bookings')
        .update({ status: 'Confirmed', updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      // Notification to guest
      await supabaseAdmin.from('notifications').insert({
        user_id: booking.guest_id,
        sender_id: user.uid,
        title: 'Booking Accepted!',
        message: `${user.full_name || 'Host'} accepted your meetup request.`,
        type: 'accepted',
        read: false,
        created_at: new Date().toISOString(),
      });

      sendPushToUser(booking.guest_id, {
        title: 'Booking Accepted!',
        body: `${user.full_name || 'Host'} accepted your meetup request.`,
        url: '/bookings',
      }).catch(() => {});

      return NextResponse.json({ success: true });
    }

    if (action === 'reject' && booking.host_id === user.uid) {
      if (booking.status !== 'Requested') {
        return NextResponse.json({ error: 'Booking cannot be rejected at this stage' }, { status: 400 });
      }

      await supabaseAdmin
        .from('bookings')
        .update({ status: 'Rejected', updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      // Refund guest via creditSparks
      if (price > 0) {
        await creditSparks(
          booking.guest_id,
          price,
          'purchased',
          'refund',
          `Booking rejected refund for meetup`,
          bookingId
        );
      }

      await supabaseAdmin.from('notifications').insert({
        user_id: booking.guest_id,
        sender_id: user.uid,
        title: 'Booking Declined',
        message: `Your meetup request was declined and ${price} Sparks have been refunded to your wallet.`,
        type: 'alert',
        read: false,
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'dispute' && booking.guest_id === user.uid) {
      if (!['Requested', 'Confirmed', 'Accepted'].includes(booking.status)) {
        return NextResponse.json({ error: 'Cannot dispute this booking at this stage' }, { status: 400 });
      }

      await supabaseAdmin
        .from('bookings')
        .update({
          status: 'Disputed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      await supabaseAdmin.from('notifications').insert({
        user_id: booking.host_id,
        sender_id: user.uid,
        title: 'Meeting Disputed',
        message: `${user.full_name || 'Guest'} reported the meeting didn't happen. Admin review initiated.`,
        type: 'alert',
        read: false,
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'complete') {
      if (booking.status === 'Meeting Completed') {
        return NextResponse.json({ error: 'Already completed' }, { status: 400 });
      }

      // If host is completing, verify the 6-digit code or QR code
      if (user.uid === booking.host_id) {
        const expectedCode = booking.meeting_code;
        if (expectedCode && code && code.trim() !== String(expectedCode).trim()) {
          return NextResponse.json({ error: 'Invalid meeting passcode. Ask the student for their 6-digit code.' }, { status: 400 });
        }
      }

      const hostShare = Math.floor(price * 0.9);

      await supabaseAdmin
        .from('bookings')
        .update({ status: 'Meeting Completed', updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (hostShare > 0) {
        await creditSparks(
          booking.host_id,
          hostShare,
          'creator',
          'booking_payout',
          `Completed meetup payout`,
          bookingId
        );
      }

      await supabaseAdmin.from('notifications').insert({
        user_id: booking.host_id,
        sender_id: booking.guest_id,
        title: 'Meetup Completed',
        message: `Your meetup was marked completed. +${hostShare} Sparks added to your Creator Balance!`,
        type: 'sparks',
        read: false,
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'cancel' && booking.guest_id === user.uid) {
      if (['Meeting Completed', 'Canceled', 'Rejected', 'Disputed', 'Refunded', 'Booking Closed'].includes(booking.status)) {
        return NextResponse.json({ error: 'Cannot cancel this booking at this stage' }, { status: 400 });
      }

      await supabaseAdmin
        .from('bookings')
        .update({ status: 'Canceled', updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (price > 0) {
        await creditSparks(
          booking.guest_id,
          price,
          'purchased',
          'refund',
          `Booking cancelled refund for meetup`,
          bookingId
        );
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'close') {
      await supabaseAdmin
        .from('bookings')
        .update({ status: 'Booking Closed', updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action or unauthorized' }, { status: 400 });
  } catch (err) {
    console.error('[PATCH /api/bookings]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
