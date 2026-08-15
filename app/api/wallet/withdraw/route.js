import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/getAdminUser';
import { adminDb } from '../../../../lib/firebaseAdmin';
import { getWallet, getWithdrawals } from '../../../../lib/wallet';
import { rateLimit, getClientIp } from '../../../../lib/rateLimit';

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  try {
    const list = await getWithdrawals(user.uid);
    return NextResponse.json({ withdrawals: list });
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

  const { amount, method, upi_id, bank_details } = await request.json();

  if (!amount || amount < 500) {
    return NextResponse.json({ error: 'Minimum withdrawal is 500 Creator Sparks' }, { status: 400 });
  }
  if (!method || !['upi', 'bank'].includes(method)) {
    return NextResponse.json({ error: 'Method must be upi or bank' }, { status: 400 });
  }
  if (method === 'upi' && !upi_id) {
    return NextResponse.json({ error: 'UPI ID required' }, { status: 400 });
  }

  const wallet = await getWallet(user.uid);
  if (!wallet || (wallet.creator || 0) < amount) {
    return NextResponse.json({ error: 'Insufficient Creator Sparks' }, { status: 400 });
  }

  // Block if user has reached the limit of 3 pending requests
  const pendingCount = await adminDb.collection('withdrawals')
    .where('userId', '==', user.uid)
    .where('status', '==', 'pending')
    .count()
    .get();

  if (pendingCount.data().count >= 3) {
    return NextResponse.json({ error: 'You have reached the limit of 3 pending withdrawal requests' }, { status: 400 });
  }

  await adminDb.collection('withdrawals').add({
    userId:       user.uid,
    email:        user.email,
    amount,
    method,
    upi_id:       upi_id || null,
    bank_details: bank_details || null,
    status:       'pending',
    requested_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, message: 'Withdrawal request submitted' });
}
