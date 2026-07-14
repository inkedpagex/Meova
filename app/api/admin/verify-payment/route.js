import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/getAdminUser';
// import { adminDb } from '../../../../lib/firebaseAdmin';

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { referenceCode, action } = await request.json(); // action: 'approve' | 'reject'

  if (!referenceCode || !action) {
    return NextResponse.json({ error: 'referenceCode and action required' }, { status: 400 });
  }

  // Find the payment request by reference code
  const snap = await adminDb
    .collection('payment_requests')
    .where('reference_code', '==', referenceCode.trim().toUpperCase())
    .get();

  if (snap.empty) {
    return NextResponse.json({ error: 'Payment request not found' }, { status: 404 });
  }

  const payDoc = snap.docs[0];
  const pay = payDoc.data();

  if (pay.status !== 'pending') {
    return NextResponse.json({ error: `Payment already ${pay.status}` }, { status: 409 });
  }

  if (action === 'reject') {
    await payDoc.ref.update({ status: 'rejected', reviewed_at: new Date().toISOString(), admin_id: admin.uid });
    return NextResponse.json({ ok: true, message: 'Payment rejected' });
  }

  if (action === 'approve') {
    // Credit the wallet
    const walletRef = adminDb.collection('wallets').doc(pay.userId);
    const walletSnap = await walletRef.get();

    if (!walletSnap.exists) {
      // Create wallet if doesn't exist
      await walletRef.set({
        userId: pay.userId,
        purchased: pay.sparks,
        bonus: 0,
        creator: 0,
        lifetime_purchased: pay.sparks,
        lifetime_earned: 0,
        lifetime_withdrawn: 0,
        updated_at: new Date().toISOString(),
      });
    } else {
      await walletRef.update({
        purchased:          pay.sparks,
        lifetime_purchased: pay.sparks,
        updated_at:         new Date().toISOString(),
      });
    }

    // Create transaction record
    await adminDb.collection('transactions').add({
      userId:    pay.userId,
      type:      'purchase',
      spark_type:'purchased',
      amount:    pay.sparks,
      status:    'completed',
      metadata: {
        pack_name:      pay.pack_name,
        amount_inr:     pay.amount_inr,
        reference_code: pay.reference_code,
      },
      created_at: new Date().toISOString(),
    });

    // Mark payment approved
    await payDoc.ref.update({
      status:      'approved',
      reviewed_at: new Date().toISOString(),
      admin_id:    admin.uid,
    });

    // Audit log
    await adminDb.collection('audit_logs').add({
      admin_id:   admin.uid,
      action:     'APPROVE_PAYMENT',
      target_uid: pay.userId,
      old_value:  null,
      new_value:  { sparks: pay.sparks, ref: pay.reference_code },
      timestamp:  new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, message: `Credited ${pay.sparks} Purchased Sparks` });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
