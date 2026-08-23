import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/getAdminUser';
import { adminDb } from '../../../../lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
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

  // Block if user has reached the limit of 3 pending requests
  const pendingCount = await adminDb.collection('withdrawals')
    .where('userId', '==', user.uid)
    .where('status', '==', 'pending')
    .count()
    .get();

  if (pendingCount.data().count >= 3) {
    return NextResponse.json({ error: 'You have reached the limit of 3 pending withdrawal requests' }, { status: 400 });
  }

  try {
    await adminDb.runTransaction(async (tx) => {
      const walletRef = adminDb.collection('wallets').doc(user.uid);
      const walletSnap = await tx.get(walletRef);
      if (!walletSnap.exists) throw new Error('Wallet not found');
      const w = walletSnap.data();

      if ((w.creator || 0) < amount) throw new Error('Insufficient Creator Sparks');

      // Deduct immediately (Escrow)
      tx.update(walletRef, {
        creator: FieldValue.increment(-amount),
        updated_at: new Date().toISOString()
      });

      // Create withdrawal request
      const wdRef = adminDb.collection('withdrawals').doc();
      tx.set(wdRef, {
        userId:       user.uid,
        email:        user.email,
        amount,
        method,
        upi_id:       upi_id || null,
        bank_details: bank_details || null,
        status:       'pending',
        requested_at: new Date().toISOString(),
      });
    });

    return NextResponse.json({ ok: true, message: 'Withdrawal request submitted' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
