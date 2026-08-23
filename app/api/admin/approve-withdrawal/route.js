import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/getAdminUser';
import { adminDb } from '../../../../lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '../../../../utils/logger';
import { sendAdminAlert } from '../../../../utils/alerts';
import { sanitizeText } from '../../../../lib/validations';

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const withdrawalId = sanitizeText(body.withdrawalId, 64);
  const action = sanitizeText(body.action, 20);
  const remarks = sanitizeText(body.remarks || '', 200);

  if (!withdrawalId || !action) {
    return NextResponse.json({ error: 'withdrawalId and action required' }, { status: 400 });
  }

  const wdRef = adminDb.collection('withdrawals').doc(withdrawalId);
  const wdSnap = await wdRef.get();

  if (!wdSnap.exists) return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });

  const wd = wdSnap.data();
  if (wd.status !== 'pending') {
    return NextResponse.json({ error: `Already ${wd.status}` }, { status: 409 });
  }

  const now = new Date().toISOString();

  if (action === 'reject') {
    const walletRef = adminDb.collection('wallets').doc(wd.userId);
    try {
      await adminDb.runTransaction(async (tx) => {
        const freshWd = await tx.get(wdRef);
        if (!freshWd.exists || freshWd.data().status !== 'pending') {
          throw new Error(`Already ${freshWd.data()?.status || 'processed'}`);
        }
        // Refund escrowed sparks back to creator wallet
        tx.update(walletRef, {
          creator: FieldValue.increment(wd.amount),
          updated_at: now,
        });
        tx.update(wdRef, { status: 'rejected', admin_id: admin.uid, remarks, reviewed_at: now });
      });
    } catch (err) {
      if (err.message?.startsWith('Already ')) {
        return NextResponse.json({ error: err.message }, { status: 409 });
      }
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    logger.audit('WITHDRAWAL_REJECTED', admin.uid, { withdrawalId, targetUid: wd.userId });
    return NextResponse.json({ ok: true });
  }

  if (action === 'approve') {
    const walletRef = adminDb.collection('wallets').doc(wd.userId);

    try {
      // Atomic ACID transaction: re-check status + deduct creator sparks + mark approved — all in one transaction
      await adminDb.runTransaction(async (tx) => {
        const freshWd = await tx.get(wdRef);
        if (!freshWd.exists || freshWd.data().status !== 'pending') {
          throw new Error(`Already ${freshWd.data()?.status || 'processed'}`);
        }

        const walletSnap = await tx.get(walletRef);
        if (!walletSnap.exists) throw new Error('Wallet not found');

        // Sparks were already deducted during the request (Escrow)
        tx.update(walletRef, {
          lifetime_withdrawn: FieldValue.increment(wd.amount),
          updated_at: now,
        });

        // Mark withdrawal as approved inside the same transaction
        tx.update(wdRef, { status: 'approved', admin_id: admin.uid, remarks, approved_at: now });
      });
    } catch (err) {
      logger.error('Withdrawal approval failed inside transaction', err, { withdrawalId, targetUid: wd.userId });
      if (err.message?.startsWith('Already ')) {
        return NextResponse.json({ error: err.message }, { status: 409 });
      }
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    // Ledger audit records
    await adminDb.collection('transactions').add({
      userId:    wd.userId,
      type:      'withdrawal',
      spark_type:'creator',
      amount:    -wd.amount,
      status:    'completed',
      metadata: { withdrawal_id: withdrawalId, method: wd.method },
      created_at: now,
    });

    await adminDb.collection('audit_logs').add({
      admin_id:   admin.uid,
      action:     'APPROVE_WITHDRAWAL',
      target_uid: wd.userId,
      old_value:  { status: 'pending' },
      new_value:  { status: 'approved', amount: wd.amount },
      timestamp:  now,
    });

    logger.audit('WITHDRAWAL_APPROVED', admin.uid, {
      withdrawalId,
      targetUid: wd.userId,
      amount: wd.amount,
    });

    // Alert
    sendAdminAlert({
      title: 'Withdrawal Approved',
      message: `Admin approved payout of ${wd.amount} Sparks for user ${wd.userEmail || wd.userId}`,
      fields: [
        { name: 'Withdrawal ID', value: withdrawalId },
        { name: 'Sparks', value: wd.amount },
        { name: 'Method', value: wd.method || 'UPI' },
      ],
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
