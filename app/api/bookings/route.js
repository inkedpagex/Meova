/**
 * GET  /api/bookings    — Get user's bookings
 * POST /api/bookings    — Create a booking (deducts sparks via spend_sparks RPC)
 * PATCH /api/bookings   — Update booking status (accept/reject/complete/dispute/cancel)
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/getAdminUser';
import { supabaseAdmin } from '../../../lib/supabase/admin';
import { spendSparks, creditSparks } from '../../../lib/wallet';
import { sendPush } from '../../../lib/sendPushNotification';
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

    if (error) {
      console.error('[GET /api/bookings]', error.message);
      return NextResponse.json({ bookings: [] });
    }

    return NextResponse.json({ bookings: bookings || [] });
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
    const { experienceId, title, price, duration, location, category, hostId, hostName, hostPhoto, date, time, agenda } = body;

    const meetTargetId = hostId;
    if (!meetTargetId) {
      return NextResponse.json({ error: 'Missing hostId' }, { status: 400 });
    }

    if (meetTargetId === user.uid) {
      return NextResponse.json({ error: 'Cannot book a meetup with yourself' }, { status: 400 });
    }

    // Rate Limiting (Anti-Spam): Max 3 pending requests
    const { count: pendingCount, error: countErr } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('guest_id', user.uid)
      .eq('status', 'Requested');

    if (!countErr && (pendingCount || 0) >= 3) {
      return NextResponse.json({ error: 'You have too many pending requests (Max: 3). Please wait for hosts to respond.' }, { status: 429 });
    }

    // Deduct sparks atomically via spend_sparks RPC (includes row lock and transaction logging)
    const priceAmount = Math.max(0, Number(price) || 0);
    let sparksDeducted = false;

    if (priceAmount > 0) {
      const spendResult = await spendSparks(
        user.uid,
        priceAmount,
        `Booked "${title || 'Campus Meet'}"`,
        'booking_escrow',
        null
      );

      if (!spendResult.ok) {
        return NextResponse.json({ error: spendResult.error || 'Insufficient Sparks' }, { status: 402 });
      }
      sparksDeducted = true;
    }

    // Build scheduledAt timestamp
    let scheduledAt = null;
    try {
      if (date && time) {
        const parsed = new Date(`${date} ${time}`);
        if (!isNaN(parsed.getTime())) {
          scheduledAt = parsed.toISOString();
        }
      }
    } catch (_) {}

    const meetingCode = String(Math.floor(100000 + Math.random() * 900000));
    const bookingPayload = {
      experience_id: experienceId || `meet_${meetTargetId}`,
      title: title || 'Campus Meetup',
      price: priceAmount,
      sparks_amount: priceAmount,
      duration: duration || 45,
      location: location || '',
      category: category || 'General',
      host_id: meetTargetId,
      host_name: hostName || '',
      host_photo: hostPhoto || '',
      guest_id: user.uid,
      guest_name: user.full_name || '',
      guest_photo: user.photo_url || '',
      date: date || '',
      time: time || '',
      agenda: agenda || '',
      status: 'Requested',
      meeting_code: meetingCode,
      scheduled_at: scheduledAt,
      created_at: new Date().toISOString(),
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
          'dispute_refund',
          `Auto-refund for failed booking: "${title || 'Campus Meet'}"`
        ).catch(err => console.error('[POST /api/bookings rollback failed]', err.message));
      }
      return NextResponse.json({ error: 'Failed to create booking. Sparks refunded if deducted.' }, { status: 500 });
    }

    // Notify host via in-app notifications table
    await supabaseAdmin.from('notifications').insert({
      user_id: hostId,
      sender_id: user.uid,
      title: 'New Booking Request ⚡',
      message: `${user.full_name || 'Someone'} requested ${title}. ${agenda ? `Agenda: "${agenda}"` : ''}`,
      type: 'booking',
      booking_id: newBooking.id,
      read: false,
      created_at: new Date().toISOString(),
    });

    // FCM push (non-blocking)
    sendPush(hostId, {
      title: 'New Booking Request ⚡',
      body: `${user.full_name || 'Someone'} wants to join "${title}"`,
      url: '/bookings',
    }).catch(() => {});

    return NextResponse.json({ booking: newBooking });
  } catch (err) {
    console.error('[POST /api/bookings]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
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

    if (action === 'accept' && booking.host_id === user.uid) {
      await supabaseAdmin
        .from('bookings')
        .update({ status: 'Confirmed' })
        .eq('id', bookingId);

      // Notification to guest
      await supabaseAdmin.from('notifications').insert({
        user_id: booking.guest_id,
        sender_id: user.uid,
        title: 'Booking Accepted! 🎉',
        message: `${user.full_name || 'Host'} accepted "${booking.title}".`,
        type: 'accepted',
        booking_id: bookingId,
        read: false,
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'reject' && booking.host_id === user.uid) {
      if (booking.status !== 'Requested') {
        return NextResponse.json({ error: 'Booking cannot be rejected at this stage' }, { status: 400 });
      }

      await supabaseAdmin
        .from('bookings')
        .update({ status: 'Rejected' })
        .eq('id', bookingId);

      // Refund guest via credit_sparks RPC
      const price = booking.price || booking.sparks_amount || 0;
      if (price > 0) {
        await creditSparks(
          booking.guest_id,
          price,
          'purchased',
          'dispute_refund',
          `Booking rejected refund for "${booking.title}"`,
          bookingId
        );
      }

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
          disputed_at: new Date().toISOString(),
          disputed_by: user.uid,
        })
        .eq('id', bookingId);

      await supabaseAdmin.from('notifications').insert({
        user_id: booking.host_id,
        sender_id: user.uid,
        title: '⚠️ Meeting Disputed',
        message: `${user.full_name || 'Guest'} reported the meeting "${booking.title}" didn't happen.`,
        type: 'dispute',
        booking_id: bookingId,
        read: false,
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'complete' && booking.host_id === user.uid) {
      if (booking.status === 'Meeting Completed') {
        return NextResponse.json({ error: 'Already completed' }, { status: 400 });
      }

      // Brute-force protection: Max 5 code attempts per 15 minutes
      const rl = rateLimit(`meeting_code:${user.uid}:${bookingId}`, { limit: 5, windowMs: 15 * 60 * 1000 });
      if (!rl.ok) {
        return NextResponse.json({
          error: `Too many wrong attempts. Please wait ${rl.retryAfter}s before trying again.`
        }, { status: 429, headers: { 'Retry-After': rl.retryAfter } });
      }

      const expectedCode = String(booking.meeting_code || booking.meetingCode || '').trim();
      if (!code || String(code).trim() !== expectedCode) {
        return NextResponse.json({ error: 'Incorrect meeting code. Ask your guest for the 6-digit code.' }, { status: 400 });
      }

      const price = booking.price || booking.sparks_amount || 0;
      const hostShare = Math.floor(price * 0.9);

      await supabaseAdmin
        .from('bookings')
        .update({ status: 'Meeting Completed' })
        .eq('id', bookingId);

      if (hostShare > 0) {
        await creditSparks(
          booking.host_id,
          hostShare,
          'creator',
          'booking_payout',
          `Hosted "${booking.title}"`,
          bookingId
        );
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'cancel' && booking.guest_id === user.uid) {
      if (['Meeting Completed', 'Canceled', 'Rejected'].includes(booking.status)) {
        return NextResponse.json({ error: 'Cannot cancel this booking anymore' }, { status: 400 });
      }

      await supabaseAdmin
        .from('bookings')
        .update({ status: 'Canceled' })
        .eq('id', bookingId);

      const price = booking.price || booking.sparks_amount || 0;
      if (price > 0) {
        await creditSparks(
          booking.guest_id,
          price,
          'purchased',
          'dispute_refund',
          `Booking cancelled refund for "${booking.title}"`,
          bookingId
        );
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'close') {
      await supabaseAdmin
        .from('bookings')
        .update({ status: 'Booking Closed' })
        .eq('id', bookingId);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action or unauthorized' }, { status: 400 });
  } catch (err) {
    console.error('[PATCH /api/bookings]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
