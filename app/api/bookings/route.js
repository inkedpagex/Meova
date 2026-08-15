/**
 * GET  /api/bookings    — Get user's bookings
 * POST /api/bookings    — Create a booking (deducts sparks via Firestore transaction)
 * PATCH /api/bookings   — Update booking status (accept/reject/complete)
 */
import { NextResponse } from 'next/server';
import { getUserWithRole } from '../../../lib/getAdminUser';
import { adminDb } from '../../../lib/firebaseAdmin';
import { spendSparks } from '../../../lib/wallet';
import { FieldValue } from 'firebase-admin/firestore';

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
    const { experienceId, title, price, duration, location, category, hostId, hostName, date, time } = body;

    if (!experienceId || !hostId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (hostId === user.uid) {
      return NextResponse.json({ error: 'Cannot book your own experience' }, { status: 400 });
    }

    // Deduct sparks atomically
    const spendResult = await spendSparks(user.uid, price || 0);
    if (!spendResult.ok) {
      return NextResponse.json({ error: spendResult.error || 'Insufficient Sparks' }, { status: 402 });
    }

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
      status: 'Requested',
      meetingCode,
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

    // Notify host via sub-collection
    await adminDb
      .collection('users')
      .doc(hostId)
      .collection('notifications')
      .add({
        title: 'New Booking Request ⚡',
        body: `${user.full_name || 'Someone'} requested to join "${title}"`,
        type: 'booking',
        bookingId: ref.id,
        read: false,
        created_at: FieldValue.serverTimestamp(),
      });

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
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const booking = { id: snap.id, ...snap.data() };

    // Security: only host or guest can modify their booking
    if (booking.hostId !== user.uid && booking.guestId !== user.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (action === 'accept' && booking.hostId === user.uid) {
      await ref.update({ status: 'Confirmed' });
      await adminDb.collection('notifications').add({
        userId: booking.guestId,
        title: 'Booking Accepted! 🎉',
        body: `${user.full_name || 'Host'} accepted "${booking.title}".`,
        type: 'accepted', bookingId, read: false,
        created_at: new Date().toISOString(),
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'reject' && booking.hostId === user.uid) {
      await ref.update({ status: 'Rejected' });
      // Refund
      await adminDb.collection('wallets').doc(booking.guestId).update({
        purchased: FieldValue.increment(booking.price || 0),
        updated_at: new Date().toISOString(),
      });
      await adminDb.collection('transactions').add({
        userId: booking.guestId, type: 'refund',
        amount: booking.price || 0, description: 'Booking rejected — refund',
        status: 'COMPLETED', created_at: new Date().toISOString(),
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'complete' && booking.hostId === user.uid) {
      if (!code || code !== booking.meetingCode) {
        return NextResponse.json({ error: 'Incorrect meeting code' }, { status: 400 });
      }
      const hostShare = Math.floor((booking.price || 0) * 0.9);
      await ref.update({ status: 'Meeting Completed' });
      await adminDb.collection('wallets').doc(booking.hostId).update({
        creator: FieldValue.increment(hostShare),
        lifetime_earned: FieldValue.increment(hostShare),
        updated_at: new Date().toISOString(),
      });
      await adminDb.collection('transactions').add({
        userId: booking.hostId, type: 'creator_earnings',
        amount: hostShare, description: `Hosted "${booking.title}"`,
        status: 'COMPLETED', created_at: new Date().toISOString(),
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'cancel') {
      await ref.update({ status: 'Canceled' });
      await adminDb.collection('wallets').doc(booking.guestId).update({
        purchased: FieldValue.increment(booking.price || 0),
        updated_at: new Date().toISOString(),
      });
      await adminDb.collection('transactions').add({
        userId: booking.guestId, type: 'refund',
        amount: booking.price || 0, description: 'Booking cancelled — refund',
        status: 'COMPLETED', created_at: new Date().toISOString(),
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('[PATCH /api/bookings]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
