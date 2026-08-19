/**
 * GET  /api/bookings    — Get user's bookings
 * POST /api/bookings    — Create a booking (deducts sparks via Firestore transaction)
 * PATCH /api/bookings   — Update booking status (accept/reject/complete/dispute/auto_refund)
 */
import { NextResponse } from 'next/server';
import { getUserWithRole } from '../../../lib/getAdminUser';
import { adminDb } from '../../../lib/firebaseAdmin';
import { spendSparks } from '../../../lib/wallet';
import { FieldValue } from 'firebase-admin/firestore';
import { sendPush } from '../../../lib/sendPushNotification';

export async function GET() {
  try {
    const user = await getUserWithRole();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!adminDb) return NextResponse.json({ bookings: [] });

    const [asGuest, asHost] = await Promise.all([
      adminDb.collection('bookings').where('guestId', '==', user.uid).get(),
      adminDb.collection('bookings').where('hostId', '==', user.uid).get(),
    ]);

    const toObj = doc => ({ id: doc.id, ...doc.data() });
    const all = [...asGuest.docs.map(toObj), ...asHost.docs.map(toObj)];
    const seen = new Set();
    const bookings = all.filter(b => { if (seen.has(b.id)) return false; seen.add(b.id); return true; });

    return NextResponse.json({ bookings });
  } catch (err) {
    console.error('[GET /api/bookings]', err.message);
    return NextResponse.json({ bookings: [] });
  }
}

export async function POST(request) {
  try {
    const user = await getUserWithRole();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!adminDb) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

    const body = await request.json();
    const { experienceId, title, price, duration, location, category, hostId, hostName, date, time, agenda } = body;

    if (!experienceId || !hostId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (hostId === user.uid) {
      return NextResponse.json({ error: 'Cannot book your own experience' }, { status: 400 });
    }

    // Rate Limiting (Anti-Spam): Max 3 pending requests
    const pendingSnap = await adminDb.collection('bookings')
      .where('guestId', '==', user.uid)
      .where('status', '==', 'Requested')
      .get();
      
    if (pendingSnap.size >= 3) {
      return NextResponse.json({ error: 'You have too many pending requests (Max: 3). Please wait for hosts to respond.' }, { status: 429 });
    }

    // Deduct sparks atomically
    const spendResult = await spendSparks(user.uid, price || 0);
    if (!spendResult.ok) {
      return NextResponse.json({ error: spendResult.error || 'Insufficient Sparks' }, { status: 402 });
    }

    // Build scheduledAt from date + time.
    // Since experience days are stored as weekday names ("Monday" etc.),
    // we first try to parse it as a real date. If that fails (NaN),
    // we store null — the auto-refund cron will fall back to created_at + 24h.
    let scheduledAt = null;
    try {
      if (date && time) {
        const parsed = new Date(`${date} ${time}`);
        if (!isNaN(parsed.getTime())) {
          scheduledAt = parsed.toISOString();
        }
        // Also accept ISO date strings directly (for future calendar picker)
        const iso = new Date(date);
        if (!scheduledAt && !isNaN(iso.getTime()) && time) {
          const [h, m] = time.replace(/ ?[AP]M/i, '').split(':').map(Number);
          const isPM = /PM/i.test(time);
          iso.setHours(isPM && h !== 12 ? h + 12 : (!isPM && h === 12 ? 0 : h), m || 0, 0, 0);
          if (!isNaN(iso.getTime())) scheduledAt = iso.toISOString();
        }
      }
    } catch (_) {}

    // Create the booking
    const meetingCode = String(Math.floor(100000 + Math.random() * 900000));
    const booking = {
      experienceId,
      title,
      price: price || 0,
      duration: duration || 45,
      location: location || '',
      category: category || '',
      hostId,
      hostName: hostName || '',
      guestId: user.uid,
      guestName: user.full_name || '',
      date: date || '',
      time: time || '',
      agenda: agenda || '',
      status: 'Requested',
      meetingCode,
      scheduledAt,
      created_at: new Date().toISOString(),
    };

    const ref = await adminDb.collection('bookings').add(booking);

    // Log spend transaction
    await adminDb.collection('transactions').add({
      userId: user.uid,
      type: 'event_booking',
      amount: -(price || 0),
      description: `Booked "${title}"`,
      status: 'COMPLETED',
      created_at: new Date().toISOString(),
    });

    // Notify host — Firestore + FCM push
    await adminDb
      .collection('users')
      .doc(hostId)
      .collection('notifications')
      .add({
        title: 'New Booking Request ⚡',
        body: `${user.full_name || 'Someone'} requested ${title}. ${agenda ? `Agenda: "${agenda}"` : ''}`,
        type: 'booking',
        bookingId: ref.id,
        read: false,
        created_at: FieldValue.serverTimestamp(),
      });

    // FCM push (non-blocking)
    sendPush(hostId, {
      title: 'New Booking Request ⚡',
      body: `${user.full_name || 'Someone'} wants to join "${title}"`,
      url: '/bookings',
    }).catch(() => {});

    return NextResponse.json({ booking: { id: ref.id, ...booking } });
  } catch (err) {
    console.error('[POST /api/bookings]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await getUserWithRole();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!adminDb) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

    const { bookingId, action, code } = await request.json();
    if (!bookingId || !action) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const ref = adminDb.collection('bookings').doc(bookingId);
    // ACID Transaction for booking state changes
    await adminDb.runTransaction(async (t) => {
      const snap = await t.get(ref);
      if (!snap.exists) throw new Error('Booking not found');
      const booking = { id: snap.id, ...snap.data() };

      // Security
      if (booking.hostId !== user.uid && booking.guestId !== user.uid) {
        throw new Error('Unauthorized');
      }

      if (action === 'accept' && booking.hostId === user.uid) {
        t.update(ref, { status: 'Confirmed' });
        const notifRef = adminDb.collection('users').doc(booking.guestId).collection('notifications').doc();
        t.set(notifRef, {
          title: 'Booking Accepted! 🎉',
          body: `${user.full_name || 'Host'} accepted "${booking.title}".`,
          type: 'accepted', bookingId, read: false,
          created_at: FieldValue.serverTimestamp(),
        });

        // System Chat Nudge
        const sortedIds = [booking.guestId, booking.hostId].sort();
        const chatId = `${sortedIds[0]}_${sortedIds[1]}`;
        
        const chatDocRef = adminDb.collection('chats').doc(chatId);
        t.set(chatDocRef, {
          participants: [booking.guestId, booking.hostId],
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });

        const chatMsgRef = chatDocRef.collection('messages').doc();
        t.set(chatMsgRef, {
          senderId: 'system',
          text: `Meeting confirmed for "${booking.title}"! Say hi 👋`,
          timestamp: FieldValue.serverTimestamp(),
          status: 'delivered'
        });

        return;
      }

      if (action === 'reject' && booking.hostId === user.uid) {
        if (booking.status !== 'Requested') throw new Error('Booking cannot be rejected at this stage');
        t.update(ref, { status: 'Rejected' });
        // Refund
        const guestWalletRef = adminDb.collection('wallets').doc(booking.guestId);
        t.update(guestWalletRef, {
          purchased: FieldValue.increment(booking.price || 0),
          updated_at: new Date().toISOString(),
        });
        const txRef = adminDb.collection('transactions').doc();
        t.set(txRef, {
          userId: booking.guestId, type: 'refund',
          amount: booking.price || 0, description: 'Booking rejected — refund',
          status: 'COMPLETED', created_at: new Date().toISOString(),
        });
        return;
      }

      if (action === 'dispute' && booking.guestId === user.uid) {
        if (!['Requested', 'Confirmed', 'Accepted'].includes(booking.status)) {
          throw new Error('Cannot dispute this booking at this stage');
        }
        t.update(ref, { status: 'Disputed', disputedAt: new Date().toISOString(), disputedBy: user.uid });
        // Notify host
        const hostNotifRef = adminDb.collection('users').doc(booking.hostId).collection('notifications').doc();
        t.set(hostNotifRef, {
          title: '⚠️ Meeting Disputed',
          body: `${user.full_name || 'Guest'} reported the meeting "${booking.title}" didn't happen.`,
          type: 'dispute', bookingId, read: false,
          created_at: FieldValue.serverTimestamp(),
        });
        return;
      }

      if (action === 'complete' && booking.hostId === user.uid) {
        if (booking.status === 'Meeting Completed') throw new Error('Already completed');
        if (!code || code !== booking.meetingCode) {
          throw new Error('Incorrect meeting code');
        }
        const hostShare = Math.floor((booking.price || 0) * 0.9);
        t.update(ref, { status: 'Meeting Completed' });
        
        const hostWalletRef = adminDb.collection('wallets').doc(booking.hostId);
        t.update(hostWalletRef, {
          creator: FieldValue.increment(hostShare),
          lifetime_earned: FieldValue.increment(hostShare),
          updated_at: new Date().toISOString(),
        });
        
        const txRef = adminDb.collection('transactions').doc();
        t.set(txRef, {
          userId: booking.hostId, type: 'creator_earnings',
          amount: hostShare, description: `Hosted "${booking.title}"`,
          status: 'COMPLETED', created_at: new Date().toISOString(),
        });
        return;
      }

      if (action === 'cancel' && booking.guestId === user.uid) {
        if (['Meeting Completed', 'Canceled', 'Rejected'].includes(booking.status)) {
          throw new Error('Cannot cancel this booking anymore');
        }
        t.update(ref, { status: 'Canceled' });
        
        const guestWalletRef = adminDb.collection('wallets').doc(booking.guestId);
        t.update(guestWalletRef, {
          purchased: FieldValue.increment(booking.price || 0),
          updated_at: new Date().toISOString(),
        });
        
        const txRef = adminDb.collection('transactions').doc();
        t.set(txRef, {
          userId: booking.guestId, type: 'refund',
          amount: booking.price || 0, description: 'Booking cancelled — refund',
          status: 'COMPLETED', created_at: new Date().toISOString(),
        });
        return;
      }

      if (action === 'close') {
        t.update(ref, { status: 'Booking Closed' });
        return;
      }

      throw new Error('Invalid action or unauthorized');
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PATCH /api/bookings]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
