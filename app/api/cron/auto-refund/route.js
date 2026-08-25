/**
 * GET /api/cron/auto-refund
 *
 * Called every hour by Vercel Cron (vercel.json) or an external cron service.
 * Protected by Authorization: Bearer <CRON_SECRET> header.
 *
 * Logic:
 *   - Find all bookings with status = "Requested" or "Confirmed" (i.e. Accepted)
 *   - Where scheduledAt < (now - 60 minutes) — meeting time has passed
 *   - Auto-refund guest's Sparks and set status = "AutoRefunded"
 *   - Notify guest + host via Firestore notifications + FCM push
 */
import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendPush } from '../../../../lib/sendPushNotification';

const CRON_SECRET = process.env.CRON_SECRET || 'Meova-cron-secret-2024';

export async function GET(request) {
  // Security check
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  const now = new Date();
  // 60 minutes ago
  const cutoff = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

  let processed = 0;
  const errors = [];

  try {
    // Query bookings that are still in a "pending meeting" state
    const snap = await adminDb
      .collection('bookings')
      .where('status', 'in', ['Requested', 'Confirmed'])
      .get();

    const eligibleBookings = snap.docs.filter(doc => {
      const data = doc.data();
      if (data.scheduledAt) {
        // Real scheduled time exists — check if it's past the cutoff
        return data.scheduledAt < cutoff;
      }
      // Fallback: no scheduledAt (weekday-name bookings) — use created_at + 24h
      if (data.created_at) {
        const fallbackCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        return data.created_at < fallbackCutoff;
      }
      return false;
    });

    for (const doc of eligibleBookings) {
      const booking = { id: doc.id, ...doc.data() };

      try {
        await adminDb.runTransaction(async (t) => {
          const freshSnap = await t.get(doc.ref);
          const fresh = freshSnap.data();

          // Double-check status hasn't changed between query and transaction
          if (!['Requested', 'Confirmed'].includes(fresh.status)) return;

          // Mark as auto-refunded
          t.update(doc.ref, {
            status: 'AutoRefunded',
            autoRefundedAt: now.toISOString(),
          });

          // Refund sparks to guest wallet
          const guestWalletRef = adminDb.collection('wallets').doc(booking.guestId);
          t.update(guestWalletRef, {
            purchased: FieldValue.increment(booking.price || 0),
            updated_at: now.toISOString(),
          });

          // Refund transaction log
          const txRef = adminDb.collection('transactions').doc();
          t.set(txRef, {
            userId: booking.guestId,
            type: 'auto_refund',
            amount: booking.price || 0,
            description: `Auto-refund: Meeting "${booking.title}" didn't happen`,
            status: 'COMPLETED',
            created_at: now.toISOString(),
          });

          // Notify guest
          const guestNotifRef = adminDb
            .collection('users')
            .doc(booking.guestId)
            .collection('notifications')
            .doc();
          t.set(guestNotifRef, {
            title: '\u26a1 Sparks Refunded',
            body: `Meeting "${booking.title}" was auto-refunded since no QR scan occurred.`,
            type: 'auto_refund',
            bookingId: booking.id,
            read: false,
            created_at: FieldValue.serverTimestamp(),
          });

          // Notify host
          const hostNotifRef = adminDb
            .collection('users')
            .doc(booking.hostId)
            .collection('notifications')
            .doc();
          t.set(hostNotifRef, {
            title: '\u26a0\ufe0f Meeting Auto-Cancelled',
            body: `"${booking.title}" was auto-cancelled as QR wasn't scanned within 1 hour.`,
            type: 'auto_refund',
            bookingId: booking.id,
            read: false,
            created_at: FieldValue.serverTimestamp(),
          });
        });

        // FCM pushes (fire-and-forget, outside transaction)
        sendPush(booking.guestId, {
          title: '\u26a1 Sparks Refunded',
          body: `Meeting "${booking.title}" was auto-refunded.`,
          url: '/bookings',
        }).catch(() => {});

        sendPush(booking.hostId, {
          title: '\u26a0\ufe0f Meeting Auto-Cancelled',
          body: `"${booking.title}" auto-cancelled — QR wasn't scanned in time.`,
          url: '/bookings',
        }).catch(() => {});

        processed++;
      } catch (err) {
        errors.push({ bookingId: booking.id, error: err.message });
        console.error(`[auto-refund] Failed for booking ${booking.id}:`, err.message);
      }
    }

    return NextResponse.json({
      ok: true,
      processed,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: now.toISOString(),
    });
  } catch (err) {
    console.error('[auto-refund] Fatal error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
