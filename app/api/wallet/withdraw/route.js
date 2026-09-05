import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/getAdminUser';
import { getWithdrawals, requestWithdrawal, getOrCreateWallet } from '../../../../lib/wallet';
import { getDerivedBalance } from '../../../../lib/walletLedger';
import { rateLimit, getClientIp } from '../../../../lib/rateLimit';

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  try {
    const [list, derived, wallet] = await Promise.all([
      getWithdrawals(user.uid),
      getDerivedBalance(user.uid),
      getOrCreateWallet(user.uid, user.email)
    ]);

    return NextResponse.json({
      withdrawals: list || [],
      withdrawable: derived.withdrawable,
      earned: derived.earned,
      purchased: derived.purchased,
      total_balance: derived.balance,
      wallet
    });
  } catch (err) {
    console.error('[GET /api/wallet/withdraw]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`withdraw:${ip}`, { limit: 5, windowMs: 10 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many withdrawal requests. Please try again later.' }, {
      status: 429,
      headers: { 'Retry-After': rl.retryAfter }
    });
  }

  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { amount, method, upi_id, bank_details } = body;

  const result = await requestWithdrawal({
    userId: user.uid,
    email: user.email,
    amount,
    method: method || 'upi',
    upiId: upi_id,
    bankDetails: bank_details
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message: 'Withdrawal request submitted successfully',
    withdrawal: result.withdrawal,
    remainingEarnedBalance: result.remainingEarnedBalance
  });
}

