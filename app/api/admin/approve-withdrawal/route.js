import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/getAdminUser';
import { approveWithdrawal, rejectWithdrawal } from '../../../../lib/wallet';
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
  const payoutReference = sanitizeText(body.payoutReference || body.utr || '', 100);
  const remarks = sanitizeText(body.remarks || '', 200);

  if (!withdrawalId || !action) {
    return NextResponse.json({ error: 'withdrawalId and action required' }, { status: 400 });
  }

  if (action === 'reject') {
    const res = await rejectWithdrawal({
      withdrawalId,
      adminId: admin.uid,
      reason: remarks || 'Rejected by Admin'
    });

    if (!res.ok) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    logger.audit('WITHDRAWAL_REJECTED', admin.uid, { withdrawalId, reason: remarks });
    return NextResponse.json({ ok: true, message: 'Withdrawal rejected and Sparks returned to user earned balance' });
  }

  if (action === 'approve') {
    const res = await approveWithdrawal({
      withdrawalId,
      adminId: admin.uid,
      payoutReference,
      remarks
    });

    if (!res.ok) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    logger.audit('WITHDRAWAL_APPROVED', admin.uid, {
      withdrawalId,
      payoutReference,
      amount: res.amount
    });

    sendAdminAlert({
      title: 'Withdrawal Paid',
      message: `Admin paid payout of ₹${res.amount} Sparks. UTR: ${payoutReference || 'N/A'}`,
      fields: [
        { name: 'Withdrawal ID', value: withdrawalId },
        { name: 'Amount', value: `₹${res.amount}` },
        { name: 'UTR', value: payoutReference || 'N/A' },
      ],
    }).catch(() => {});

    return NextResponse.json({ ok: true, message: 'Withdrawal approved & marked paid' });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

