import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/getAdminUser';
import { adminDb } from '../../../../lib/firebaseAdmin';
import { getWallet } from '../../../../lib/wallet';

export async function POST(request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  const { amount, method, upi_id, bank_details } = await request.json();

  if (!amount || amount < 1000) {
    return NextResponse.json({ error: 'Minimum withdrawal is 1000 Creator Sparks' }, { status: 400 });
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

  // Block duplicate pending requests
  const existing = await adminDb.collection('withdrawals')
    .where('userId', '==', user.uid)
    .where('status', '==', 'pending')
    .get();
  if (!existing.empty) {
    return NextResponse.json({ error: 'You already have a pending withdrawal request' }, { status: 409 });
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
