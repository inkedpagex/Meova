import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/getAdminUser';
import { adminDb } from '../../../../lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  let id, referenceCode, action;
  try {
    const body = await request.json();
    id = body.id;
    referenceCode = body.referenceCode;
    action = body.action;
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if ((!id && !referenceCode) || !action) {
    return NextResponse.json({ error: 'id or referenceCode, and action required' }, { status: 400 });
  }

  try {
    let docRef;

    if (id) {
      docRef = adminDb.collection('payment_requests').doc(id);
    } else {
      const snap = await adminDb.collection('payment_requests')
        .where('reference_code', '==', referenceCode)
        .where('status', '==', 'pending')
        .limit(1)
        .get();
      if (snap.empty) return NextResponse.json({ error: 'Payment request not found' }, { status: 404 });
      docRef = snap.docs[0].ref;
    }

    const now = new Date().toISOString();

    if (action === 'reject') {
      // Use a transaction to guard against race conditions on reject too
      await adminDb.runTransaction(async (tx) => {
        const snap = await tx.get(docRef);
        if (!snap.exists) throw new Error('Payment request not found');
        if (snap.data().status !== 'pending') throw new Error(`Already ${snap.data().status}`);
        tx.update(docRef, { status: 'rejected', reviewed_at: now, admin_id: admin.uid });
      });
      return NextResponse.json({ ok: true, message: 'Payment rejected successfully' });
    }

    if (action === 'approve') {
      let reqData;

      // Atomic transaction: re-read status + credit sparks + mark approved all in one go
      await adminDb.runTransaction(async (tx) => {
        const snap = await tx.get(docRef);
        if (!snap.exists) throw new Error('Payment request not found');
        reqData = snap.data();

        // Guard: if already approved/rejected, abort immediately
        if (reqData.status !== 'pending') throw new Error(`Already ${reqData.status}`);

        const walletRef = adminDb.collection('wallets').doc(reqData.userId);
        const walletSnap = await tx.get(walletRef);

        if (walletSnap.exists) {
          tx.update(walletRef, {
            purchased: FieldValue.increment(reqData.sparks),
            lifetime_purchased: FieldValue.increment(reqData.sparks),
            updated_at: now,
          });
        } else {
          tx.set(walletRef, {
            userId: reqData.userId,
            purchased: reqData.sparks,
            bonus: 0,
            creator: 0,
            lifetime_purchased: reqData.sparks,
            lifetime_earned: 0,
            lifetime_withdrawn: 0,
            updated_at: now,
          });
        }

        // Mark as approved inside the same transaction
        tx.update(docRef, { status: 'approved', reviewed_at: now, admin_id: admin.uid });
      });

      // Transaction record (outside tx — if this fails, data is still consistent)
      await adminDb.collection('transactions').add({
        userId: reqData.userId,
        type: 'payment',
        spark_type: 'purchased',
        amount: reqData.sparks,
        status: 'completed',
        metadata: {
          payment_request_id: docRef.id,
          pack_name: reqData.pack_name || '',
          amount_inr: reqData.amount_inr || 0,
          reference_code: reqData.reference_code || ''
        },
        created_at: now
      });

      // Notify user: Sparks received
      try {
        await adminDb
          .collection('users')
          .doc(reqData.userId)
          .collection('notifications')
          .add({
            title: `⚡ ${reqData.sparks} Sparks Added!`,
            body: `Your payment of ₹${reqData.amount_inr || reqData.sparks} was approved. Sparks are now in your wallet!`,
            type: 'sparks',
            read: false,
            created_at: FieldValue.serverTimestamp(),
          });
      } catch (notifErr) {
        console.warn('[verify-payment] Notification failed (non-critical):', notifErr.message);
      }

      return NextResponse.json({ ok: true, message: 'Payment approved successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    // Surface idempotency errors clearly
    if (err.message?.startsWith('Already ')) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

