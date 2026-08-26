/**
 * GET  /api/gigs/[id]/applications  — host fetches all applicants for their gig
 * PATCH /api/gigs/[id]/applications — host accepts or rejects an applicant
 *
 * On ACCEPT:
 *   - Deduct escrow Sparks from host wallet
 *   - Generate 6-digit meetingCode stored on application doc
 *   - Auto-open DM thread between host + freelancer
 *   - Notify freelancer (in-app)
 *
 * On REJECT:
 *   - Update status to REJECTED
 *   - Notify freelancer (in-app)
 */
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAuth } from '@/lib/getAdminUser';
import { spendSparks } from '@/lib/wallet';
import { FieldValue } from 'firebase-admin/firestore';
import { sendPush } from '@/lib/sendPushNotification';

// ── GET — list all applicants ───────────────────────────────────────────────
export async function GET(request, { params }) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!adminDb) return NextResponse.json({ applications: [] });

    const { id } = await params;
    const gigRef = adminDb.collection('gigs').doc(id);
    const gigSnap = await gigRef.get();

    if (!gigSnap.exists) {
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 });
    }

    // Only the gig author can see applicants
    if (gigSnap.data().authorId !== user.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const appsSnap = await gigRef.collection('applications').orderBy('appliedAt', 'desc').get();
    const applications = appsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ applications });
  } catch (err) {
    console.error('[GET /api/gigs/[id]/applications]', err.message);
    return NextResponse.json({ applications: [] });
  }
}

// ── PATCH — accept or reject an applicant ──────────────────────────────────
export async function PATCH(request, { params }) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!adminDb) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

    const { id } = await params;
    const { applicantId, action } = await request.json();

    if (!applicantId || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Missing applicantId or invalid action' }, { status: 400 });
    }

    const gigRef = adminDb.collection('gigs').doc(id);
    const gigSnap = await gigRef.get();

    if (!gigSnap.exists) return NextResponse.json({ error: 'Gig not found' }, { status: 404 });
    const gig = gigSnap.data();

    if (gig.authorId !== user.uid) {
      return NextResponse.json({ error: 'Only the gig author can manage applications' }, { status: 403 });
    }

    const appRef = gigRef.collection('applications').doc(applicantId);
    const appSnap = await appRef.get();
    if (!appSnap.exists) return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    const app = appSnap.data();
    if (app.status !== 'PENDING') {
      return NextResponse.json({ error: 'Application already processed' }, { status: 400 });
    }

    // ── ACCEPT ──────────────────────────────────────────────────────────────
    if (action === 'accept') {
      const budget = parseInt(gig.budget) || 0;

      // Deduct Sparks from host as escrow
      if (budget > 0) {
        const spendResult = await spendSparks(user.uid, budget);
        if (!spendResult.ok) {
          return NextResponse.json({ error: spendResult.error || 'Insufficient Sparks to fund this gig' }, { status: 402 });
        }
      }

      const meetingCode = String(Math.floor(100000 + Math.random() * 900000));

      await adminDb.runTransaction(async (tx) => {
        // Update application
        tx.update(appRef, {
          status: 'ACCEPTED',
          meetingCode,
          acceptedAt: new Date().toISOString(),
          escrowAmount: budget,
        });

        // Mark gig as in-progress (still visible but not accepting new apps)
        tx.update(gigRef, { status: 'in_progress', acceptedApplicantId: applicantId });

        // Open DM thread between host and freelancer
        const sortedIds = [user.uid, applicantId].sort();
        const chatId = `${sortedIds[0]}_${sortedIds[1]}`;
        const chatRef = adminDb.collection('chats').doc(chatId);
        tx.set(chatRef, {
          participants: [user.uid, applicantId],
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });

        const msgRef = chatRef.collection('messages').doc();
        tx.set(msgRef, {
          senderId: 'system',
          text: `🎉 You've been accepted for the gig "${gig.title}"! Connect here to coordinate.`,
          timestamp: FieldValue.serverTimestamp(),
          status: 'delivered',
        });

        // Notify freelancer
        const notifRef = adminDb.collection('users').doc(applicantId).collection('notifications').doc();
        tx.set(notifRef, {
          title: '🎉 Gig Accepted!',
          body: `${user.full_name || 'Host'} accepted you for "${gig.title}". Check messages to get started.`,
          type: 'gig_accepted',
          gigId: id,
          read: false,
          created_at: FieldValue.serverTimestamp(),
        });
      });

      // FCM push (non-blocking)
      sendPush(applicantId, {
        title: '🎉 Gig Accepted!',
        body: `You got the gig: "${gig.title}"`,
        url: '/gigs',
      }).catch(() => {});

      return NextResponse.json({ ok: true, action: 'accepted', meetingCode });
    }

    // ── REJECT ──────────────────────────────────────────────────────────────
    if (action === 'reject') {
      await adminDb.runTransaction(async (tx) => {
        tx.update(appRef, { status: 'REJECTED', rejectedAt: new Date().toISOString() });

        const notifRef = adminDb.collection('users').doc(applicantId).collection('notifications').doc();
        tx.set(notifRef, {
          title: 'Application Update',
          body: `Your application for "${gig.title}" was not selected this time.`,
          type: 'gig_rejected',
          gigId: id,
          read: false,
          created_at: FieldValue.serverTimestamp(),
        });
      });

      sendPush(applicantId, {
        title: 'Application Update',
        body: `Your application for "${gig.title}" was not selected.`,
        url: '/gigs',
      }).catch(() => {});

      return NextResponse.json({ ok: true, action: 'rejected' });
    }
  } catch (err) {
    console.error('[PATCH /api/gigs/[id]/applications]', err.message);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

