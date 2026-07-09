import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/getAdminUser';
import { adminDb } from '../../../../lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { withdrawalId, action, remarks } = await request.json();

  if (!withdrawalId || !action) {
    return NextResponse.json({ error: 'withdrawalId and action required' }, { status: 400 });
  }

  const wdRef  = adminDb.collection('withdrawals').doc(withdrawalId);
  const wdSnap = await wdRef.get();

  if (!wdSnap.exists) return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });

  const wd = wdSnap.data();
  if (wd.status !== 'pending') {
    return NextResponse.json({ error: `Already ${wd.status}` }, { status: 409 });
  }

  const now = new Date().toISOString();

  if (action === 'reject') {
    await wdRef.update({ status: 'rejected', admin_id: admin.uid, remarks: remarks || '', reviewed_at: now });
    return NextResponse.json({ ok: true });
  }

  if (action === 'approve') {
    // Deduct from wallet (creator balance)
    const walletRef = adminDb.collection('wallets').doc(wd.userId);

    await adminDb.runTransaction(async (tx) => {
      const walletSnap = await tx.get(walletRef);
      if (!walletSnap.exists) throw new Error('Wallet not found');
      const w = walletSnap.data();
      if ((w.creator || 0) < wd.amount) throw new Error('Insufficient Creator Sparks');

      tx.update(walletRef, {
        creator:            FieldValue.increment(-wd.amount),
        lifetime_withdrawn: FieldValue.increment(wd.amount),
        updated_at:         now,
      });
    });

    await wdRef.update({ status: 'approved', admin_id: admin.uid, remarks: remarks || '', approved_at: now });

    // Transaction record
    await adminDb.collection('transactions').add({
      userId:    wd.userId,
      type:      'withdrawal',
      spark_type:'creator',
      amount:    -wd.amount,
      status:    'completed',
      metadata: { withdrawal_id: withdrawalId, method: wd.method },
      created_at: now,
    });

    // Audit log
    await adminDb.collection('audit_logs').add({
      admin_id:   admin.uid,
      action:     'APPROVE_WITHDRAWAL',
      target_uid: wd.userId,
      old_value:  { status: 'pending' },
      new_value:  { status: 'approved', amount: wd.amount },
      timestamp:  now,
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
