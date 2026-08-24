/**
 * POST /api/gigs/[id]/complete
 *
 * Host enters the 6-digit meetingCode to mark gig as complete.
 * Releases escrowed Sparks to freelancer (90% payout, 10% platform fee).
 *
 * Anti-fraud:
 *  - Detects "circular pair" abuse: same host+freelancer completing 3+ gigs together
 *  - Flags suspicious payouts for admin review instead of auto-releasing
 */
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserWithRole } from '@/lib/getAdminUser';
import { FieldValue } from 'firebase-admin/firestore';
import { sendPush } from '@/lib/sendPushNotification';

// ── Circular pair detection ────────────────────────────────────────────────────
// If the same two UIDs have completed Gigs together 3+ times, it's suspicious.
async function isCircularPair(hostId, freelancerId) {
  try {
    const snap = await adminDb
      .collection('gigs')
      .where('authorId', '==', hostId)
      .where('acceptedApplicantId', '==', freelancerId)
      .where('status', '==', 'completed')
      .limit(3)
      .get();
    return snap.size >= 3;
  } catch {
    return false; // fail open — don't block on detection error
  }
}

export async function POST(request, { params }) {
  try {
    const user = await getUserWithRole();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!adminDb) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

    const { id } = await params;
    const { code } = await request.json();

    if (!code) return NextResponse.json({ error: 'Completion code is required' }, { status: 400 });

    const gigRef = adminDb.collection('gigs').doc(id);
    const gigSnap = await gigRef.get();
    if (!gigSnap.exists) return NextResponse.json({ error: 'Gig not found' }, { status: 404 });

    const gig = gigSnap.data();

    // Only the gig author (host) can mark as complete
    if (gig.authorId !== user.uid) {
      return NextResponse.json({ error: 'Only the gig host can mark this as complete' }, { status: 403 });
    }

    if (gig.status !== 'in_progress') {
      return NextResponse.json({ error: 'Gig is not currently in progress' }, { status: 400 });
    }

    const freelancerId = gig.acceptedApplicantId;
    if (!freelancerId) {
      return NextResponse.json({ error: 'No accepted applicant found' }, { status: 400 });
    }

    const appRef = gigRef.collection('applications').doc(freelancerId);
    const appSnap = await appRef.get();
    if (!appSnap.exists) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

    const app = appSnap.data();

    if (app.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Gig already marked as completed' }, { status: 400 });
    }

    // Verify the 6-digit code
    if (!app.meetingCode || code.trim() !== app.meetingCode) {
      return NextResponse.json({ error: 'Incorrect completion code. Ask the freelancer for their code.' }, { status: 400 });
    }

    // ── Anti-fraud: Circular pair check ────────────────────────────────────────
    const suspicious = await isCircularPair(user.uid, freelancerId);
    const escrowAmount = app.escrowAmount || parseInt(gig.budget) || 0;
    const freelancerPayout = Math.floor(escrowAmount * 0.9); // 90% to freelancer
    const now = new Date().toISOString();

    if (suspicious) {
      // Flag for admin review — DO NOT auto-release. Hold funds.
      await adminDb.runTransaction(async (tx) => {
        tx.update(appRef, { status: 'FLAGGED_REVIEW', completedAt: now });
        tx.update(gigRef, { status: 'flagged_review', completedAt: now });

        // Admin alert
        const alertRef = adminDb.collection('admin_alerts').doc();
        tx.set(alertRef, {
          type: 'circular_pair_fraud',
          hostId: user.uid,
          freelancerId,
          gigId: id,
          gigTitle: gig.title,
          amount: freelancerPayout,
          message: `Suspicious circular pair detected: same 2 users have completed 3+ gigs together. Funds held.`,
          resolved: false,
          created_at: now,
        });
      });

      return NextResponse.json({
        ok: false,
        flagged: true,
        message: 'This payout has been flagged for review due to unusual activity. Admin will process within 24 hours.',
      });
    }

    // ── Normal flow: release payout ────────────────────────────────────────────
    await adminDb.runTransaction(async (tx) => {
      // Mark application as completed
      tx.update(appRef, { status: 'COMPLETED', completedAt: now });

      // Mark gig as completed
      tx.update(gigRef, { status: 'completed', completedAt: now });

      // Credit Sparks to freelancer (creator wallet — only withdrawable bucket)
      const freelancerWalletRef = adminDb.collection('wallets').doc(freelancerId);
      tx.update(freelancerWalletRef, {
        creator: FieldValue.increment(freelancerPayout),
        lifetime_earned: FieldValue.increment(freelancerPayout),
        updated_at: now,
      });

      // Transaction log
      const txRef = adminDb.collection('transactions').doc();
      tx.set(txRef, {
        userId: freelancerId,
        type: 'gig_earnings',
        amount: freelancerPayout,
        description: `Completed gig: "${gig.title}"`,
        status: 'COMPLETED',
        created_at: now,
      });

      // Notify freelancer
      const notifRef = adminDb.collection('users').doc(freelancerId).collection('notifications').doc();
      tx.set(notifRef, {
        title: '⚡ Sparks Received!',
        body: `You earned ${freelancerPayout}⚡ for completing "${gig.title}". Check your wallet.`,
        type: 'gig_completed',
        gigId: id,
        read: false,
        created_at: FieldValue.serverTimestamp(),
      });
    });

    // FCM push (non-blocking)
    sendPush(freelancerId, {
      title: '⚡ Sparks Received!',
      body: `You earned ${freelancerPayout} Sparks for "${gig.title}"`,
      url: '/wallet',
    }).catch(() => {});

    return NextResponse.json({ ok: true, payout: freelancerPayout });
  } catch (err) {
    console.error('[POST /api/gigs/[id]/complete]', err.message);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

