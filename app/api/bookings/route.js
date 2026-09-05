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
import { rateLimit, getClientIp } from '../../../lib/rateLimit';
import { calculateMeetupRate } from '../../../lib/pricing';

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
      const codeMatch = b.agenda?.match(/\[CODE:(\d{6})\]/);
      const meetingCode = codeMatch ? codeMatch[1] : (b.meeting_code || String(b.id).replace(/\D/g, '').slice(0, 6) || '123456');
      const cleanAgenda = b.agenda ? b.agenda.replace(/\[CODE:\d{6}\]\s*/, '').trim() : '1-on-1 Campus Meetup';

      return {
        ...b,
        price: b.sparks_spent !== undefined ? b.sparks_spent : 50,
        sparks_amount: b.sparks_spent !== undefined ? b.sparks_spent : 50,
        meeting_code: meetingCode,
        meetingCode: meetingCode,
        guest_name: guest?.full_name || 'Campus Peer',
        guest_photo: guest?.photo_url || '',
        guest_username: guest?.username || '',
        host_name: host?.full_name || 'Campus Host',
        host_photo: host?.photo_url || '',
        host_username: host?.username || '',
        title: cleanAgenda,
        agenda: cleanAgenda,
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
    const ip = getClientIp(request);
    const rl = rateLimit(`booking:${ip}`, { limit: 10, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json({ error: 'Too many booking requests. Please slow down.' }, { status: 429 });
    }

    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { targetUserId, hostId, title, timeSlot, date, time, location, agenda } = await request.json();
    const meetTargetId = targetUserId || hostId;

    if (!meetTargetId) {
      return NextResponse.json({ error: 'Target user required' }, { status: 400 });
    }

    if (meetTargetId === user.uid) {
      return NextResponse.json({ error: 'You cannot book a meetup with yourself.' }, { status: 400 });
    }

    // Safety 1: Max 3 active pending outgoing requests
    const { count: pendingCount, error: countErr } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('guest_id', user.uid)
      .in('status', ['Requested', 'requested', 'Pending']);

    if (!countErr && (pendingCount || 0) >= 3) {
      return NextResponse.json(
        { error: 'You already have 3 pending meetup requests. Please wait for hosts to respond before sending more.' },
        { status: 429 }
      );
    }

    // Safety 2: 48-hour cooldown if this host recently declined your request
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: recentRejection } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('guest_id', user.uid)
      .eq('host_id', meetTargetId)
      .in('status', ['Rejected', 'rejected'])
      .gt('updated_at', fortyEightHoursAgo)
      .maybeSingle();

    if (recentRejection) {
      return NextResponse.json({
        error: 'This student recently declined your meetup request. Please respect their privacy and wait 48 hours before requesting again.'
      }, { status: 429 });
    }

    // Tier Verification & Matching Gating
    const { data: peerProfiles, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('id, tier, current_meeting_rate, completed_meeting_count, completed_meets_count')
      .in('id', [user.uid, meetTargetId]);

    const guestProfile = peerProfiles?.find((p) => p.id === user.uid);
    const hostProfile = peerProfiles?.find((p) => p.id === meetTargetId);

    const guestTier = guestProfile?.tier || 'not_verified';
    const hostTier = hostProfile?.tier || 'not_verified';

    // Enforcement: Verified peers only meet Verified peers; Unverified only meet Unverified
    if (guestTier !== hostTier) {
      return NextResponse.json(
        { error: 'Meetups can only be scheduled between peers of the same tier.' },
        { status: 403 }
      );
    }

    // Dynamic Pricing:
    // If unverified: Meeting is 100% Free (0 Sparks)
    // If verified: Paid at host's current tier rate
    let priceAmount = 0;
    if (hostTier === 'verified') {
      const hostMeetsCount = hostProfile?.completed_meeting_count ?? hostProfile?.completed_meets_count ?? 0;
      priceAmount = hostProfile?.current_meeting_rate || calculateMeetupRate(hostMeetsCount);
    }

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
        return NextResponse.json({ error: spendResult.error || 'Insufficient Sparks in wallet' }, { status: 402 });
      }
      sparksDeducted = true;
    }

    const formattedTimeSlot = (timeSlot || [date, time].filter(Boolean).join(' ')).trim() || 'Flexible';
    const formattedAgenda = (agenda || title || '1-on-1 Campus Meetup').trim();
    const generatedCode = String(Math.floor(100000 + Math.random() * 900000));

    const bookingPayload = {
      guest_id: user.uid,
      host_id: meetTargetId,
      sparks_spent: priceAmount,
      status: 'Requested',
      location: location?.trim() || 'Campus',
      time_slot: formattedTimeSlot,
      agenda: `[CODE:${generatedCode}] ${formattedAgenda}`,
      confirmed_by_initiator: false,
      confirmed_by_recipient: false,
      counted_for_tier: false,
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

    if (action === 'start_meeting' || action === 'verify_code') {
      if (booking.status === 'Meeting Completed' || booking.status === 'In Progress') {
        return NextResponse.json({ success: true, status: booking.status, started_at: booking.started_at });
      }

      // Verify the 6-digit code or QR code
      const codeMatch = booking.agenda?.match(/\[CODE:(\d{6})\]/);
      const expectedCode = codeMatch ? codeMatch[1] : (booking.meeting_code || String(booking.id).replace(/\D/g, '').slice(0, 6));
      if (expectedCode && (!code || code.trim() !== String(expectedCode).trim())) {
        return NextResponse.json({ error: 'Invalid 6-digit code. Please verify the code on your classmate’s screen.' }, { status: 400 });
      }

      const now = new Date().toISOString();
      await supabaseAdmin
        .from('bookings')
        .update({
          status: 'In Progress',
          started_at: now,
          duration_minutes: 20,
          updated_at: now,
        })
        .eq('id', bookingId);

      // Notify both participants
      const otherUserId = user.uid === booking.host_id ? booking.guest_id : booking.host_id;
      await supabaseAdmin.from('notifications').insert({
        user_id: otherUserId,
        sender_id: user.uid,
        title: 'Meeting Started!',
        message: `Your 20-minute meetup is now live! Timer has started.`,
        type: 'accepted',
        read: false,
        created_at: now,
      });

      return NextResponse.json({ success: true, status: 'In Progress', started_at: now, duration_minutes: 20 });
    }

    if (action === 'complete') {
      if (booking.status === 'Meeting Completed' && booking.counted_for_tier) {
        return NextResponse.json({ error: 'Already completed and counted' }, { status: 400 });
      }

      const now = new Date().toISOString();
      const isInitiator = user.uid === booking.guest_id;
      const newConfirmedByInitiator = isInitiator ? true : Boolean(booking.confirmed_by_initiator);
      const newConfirmedByRecipient = !isInitiator ? true : Boolean(booking.confirmed_by_recipient);
      const mutuallyConfirmed = newConfirmedByInitiator && newConfirmedByRecipient;

      // ── Step 1: If only one side confirmed, record their confirmation & notify peer
      if (!mutuallyConfirmed) {
        await supabaseAdmin
          .from('bookings')
          .update({
            confirmed_by_initiator: newConfirmedByInitiator,
            confirmed_by_recipient: newConfirmedByRecipient,
            updated_at: now,
          })
          .eq('id', bookingId);

        const otherUserId = isInitiator ? booking.host_id : booking.guest_id;
        await supabaseAdmin.from('notifications').insert({
          user_id: otherUserId,
          sender_id: user.uid,
          title: 'Confirm Meetup Completion',
          message: `${user.full_name || 'Your peer'} marked the meetup as completed. Please confirm to finalize!`,
          type: 'accepted',
          read: false,
          created_at: now,
        });

        return NextResponse.json({
          success: true,
          status: 'Awaiting Peer Confirmation',
          mutually_confirmed: false,
          confirmed_by_initiator: newConfirmedByInitiator,
          confirmed_by_recipient: newConfirmedByRecipient,
        });
      }

      // ── Step 2: Mutual Confirmation Complete (both participants confirmed)
      const hostShare = Math.floor(price * 0.9);

      await supabaseAdmin
        .from('bookings')
        .update({
          status: 'Meeting Completed',
          confirmed_by_initiator: true,
          confirmed_by_recipient: true,
          completed_at: now,
          updated_at: now,
          counted_for_tier: true,
        })
        .eq('id', bookingId);

      // Release escrow payout to host if paid
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

      // ── Step 3: Anti-Fraud Cross-Checks before incrementing tier count
      // Check for shared device tokens (multi-account self-dealing)
      const { data: tokens } = await supabaseAdmin
        .from('device_tokens')
        .select('user_id, token')
        .in('user_id', [booking.guest_id, booking.host_id]);

      const guestTokens = new Set(tokens?.filter((t) => t.user_id === booking.guest_id).map((t) => t.token));
      const hostTokens = new Set(tokens?.filter((t) => t.user_id === booking.host_id).map((t) => t.token));
      let isSharedDevice = false;
      for (const t of guestTokens) {
        if (hostTokens.has(t)) {
          isSharedDevice = true;
          break;
        }
      }

      // Check frequency of repeat meetings between this exact pair in the past 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count: repeatCount } = await supabaseAdmin
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('guest_id', booking.guest_id)
        .eq('host_id', booking.host_id)
        .in('status', ['Meeting Completed', 'Completed'])
        .gt('completed_at', sevenDaysAgo);

      const isSuspicious = isSharedDevice || (repeatCount || 0) >= 4;

      if (isSuspicious) {
        // Flag both accounts for review and pause tier progression
        await supabaseAdmin.from('user_reports').insert([
          {
            reported_user_id: booking.host_id,
            reporter_id: user.uid,
            reason: 'Self-dealing meeting pattern: shared device or abnormal repeat meetup frequency.',
            created_at: now,
          },
          {
            reported_user_id: booking.guest_id,
            reporter_id: user.uid,
            reason: 'Self-dealing meeting pattern: shared device or abnormal repeat meetup frequency.',
            created_at: now,
          },
        ]).catch(() => {});
      } else {
        // Increment tier progression count & update dynamic meeting rate
        const { data: hostProf } = await supabaseAdmin
          .from('profiles')
          .select('id, completed_meeting_count, completed_meets_count, tier')
          .eq('id', booking.host_id)
          .maybeSingle();

        if (hostProf) {
          const nextHostCount = (hostProf.completed_meeting_count ?? hostProf.completed_meets_count ?? 0) + 1;
          const nextRate = calculateMeetupRate(nextHostCount);
          await supabaseAdmin
            .from('profiles')
            .update({
              completed_meeting_count: nextHostCount,
              completed_meets_count: nextHostCount,
              current_meeting_rate: nextRate,
              updated_at: now,
            })
            .eq('id', booking.host_id);
        }

        const { data: guestProf } = await supabaseAdmin
          .from('profiles')
          .select('id, completed_meeting_count, completed_meets_count, tier')
          .eq('id', booking.guest_id)
          .maybeSingle();

        if (guestProf) {
          const nextGuestCount = (guestProf.completed_meeting_count ?? guestProf.completed_meets_count ?? 0) + 1;
          const nextGuestRate = calculateMeetupRate(nextGuestCount);
          await supabaseAdmin
            .from('profiles')
            .update({
              completed_meeting_count: nextGuestCount,
              completed_meets_count: nextGuestCount,
              current_meeting_rate: nextGuestRate,
              updated_at: now,
            })
            .eq('id', booking.guest_id);
        }
      }

      await supabaseAdmin.from('notifications').insert({
        user_id: booking.host_id,
        sender_id: booking.guest_id,
        title: 'Meetup Completed',
        message: `Your meetup was mutually confirmed completed.${hostShare > 0 ? ` +${hostShare} Sparks added to your Creator Balance!` : ''}`,
        type: 'sparks',
        read: false,
        created_at: now,
      });

      return NextResponse.json({
        success: true,
        status: 'Meeting Completed',
        mutually_confirmed: true,
        counted_for_tier: !isSuspicious,
      });
    }

    if (action === 'cancel') {
      if (booking.guest_id !== user.uid && booking.host_id !== user.uid) {
        return NextResponse.json({ error: 'Unauthorized to cancel this booking' }, { status: 403 });
      }

      if (['Meeting Completed', 'Canceled', 'Cancelled', 'Rejected', 'Disputed', 'AutoRefunded', 'Booking Closed', 'In Progress'].includes(booking.status)) {
        return NextResponse.json({ error: 'Cannot cancel this booking at this stage' }, { status: 400 });
      }

      const isHostCancelling = booking.host_id === user.uid;
      const otherUserId = isHostCancelling ? booking.guest_id : booking.host_id;
      const now = new Date().toISOString();

      await supabaseAdmin
        .from('bookings')
        .update({ status: 'Canceled', updated_at: now })
        .eq('id', bookingId);

      // 100% Escrow Refund to Guest
      if (price > 0) {
        await creditSparks(
          booking.guest_id,
          price,
          'purchased',
          'refund',
          `Meetup cancelled refund: "${booking.title || 'Campus meet'}"`,
          bookingId
        );
      }

      // Notification to other participant
      await supabaseAdmin.from('notifications').insert({
        user_id: otherUserId,
        sender_id: user.uid,
        title: 'Meeting Cancelled',
        message: isHostCancelling
          ? `The host cancelled the meetup. ${price > 0 ? `${price} Sparks have been refunded to your wallet.` : ''}`
          : `${user.full_name || 'Guest'} cancelled the meetup. ${price > 0 ? `${price} Sparks have been refunded.` : ''}`,
        type: 'alert',
        read: false,
        created_at: now,
      });

      return NextResponse.json({ success: true, message: 'Meeting cancelled and Sparks refunded.' });
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
