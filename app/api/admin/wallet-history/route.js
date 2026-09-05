import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/getAdminUser';
import { getUserLedgerHistory, recordRefund, recordAdminAdjustment, getDerivedBalance } from '@/lib/walletLedger';

export async function GET(request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId parameter required' }, { status: 400 });
  }

  try {
    const [history, balanceInfo] = await Promise.all([
      getUserLedgerHistory(userId, 100),
      getDerivedBalance(userId),
    ]);

    return NextResponse.json({
      userId,
      balanceInfo,
      history,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const body = await request.json();
    const { action, userId, amount, reason, referenceId } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: 'userId and action required' }, { status: 400 });
    }

    if (action === 'refund') {
      const result = await recordRefund({
        userId,
        originalTransactionId: referenceId,
        amount,
        reason,
        adminId: admin.uid
      });
      return NextResponse.json({ ok: true, result });
    }

    if (action === 'adjust') {
      const result = await recordAdminAdjustment({
        userId,
        amount,
        reason,
        referenceId,
        adminId: admin.uid
      });
      return NextResponse.json({ ok: true, result });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
