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

  try {
    // ── Anti-fraud checks ──────────────────────────────────────────────────────

    // 1. Phone number must be verified (strongest anti-fake-account measure)
    //    One phone = one withdrawal account. Verified via OTP during onboarding.
    const userDoc = await adminDb.collection('users').doc(user.uid).get();
    const userData = userDoc.data() || {};
    if (!userData.phone_verified) {
      return NextResponse.json({
        error: 'Please verify your phone number first. Go to Profile → Settings → Verify Phone.'
      }, { status: 403 });
    }

    // 2. Must have at least 1 completed Gig as freelancer
    const completedGigSnap = await adminDb
      .collection('gigs')
      .where('acceptedApplicantId', '==', user.uid)
      .where('status', '==', 'completed')
      .limit(1)
      .get();
    if (completedGigSnap.empty) {
      return NextResponse.json({
        error: 'You must complete at least 1 Gig before requesting a withdrawal.'
      }, { status: 403 });
    }

    // 3. UPI ID uniqueness — flag if another account used the same UPI
    if (upi_id) {
      const upiSnap = await adminDb
        .collection('withdrawals')
        .where('upi_id', '==', upi_id.trim().toLowerCase())
        .where('userId', '!=', user.uid)
        .limit(1)
        .get();
      if (!upiSnap.empty) {
        await adminDb.collection('admin_alerts').doc().set({
          type: 'duplicate_upi',
          userId: user.uid,
          upi_id: upi_id.trim(),
          message: `UPI ID "${upi_id}" already used by another account. Manual review needed.`,
          resolved: false,
          created_at: new Date().toISOString(),
        });
        return NextResponse.json({
          error: 'This UPI ID is already linked to another account. Our team will review and contact you within 24 hours.'
        }, { status: 403 });
      }
    }

    // 4. Max 1 pending withdrawal at a time
    const pendingCount = await adminDb.collection('withdrawals')
      .where('userId', '==', user.uid)
      .where('status', '==', 'pending')
      .count()
      .get();

    if (pendingCount.data().count >= 1) {
      return NextResponse.json({ error: 'You already have a pending withdrawal request. Please wait for it to be processed.' }, { status: 400 });
    }

    // ── Execute withdrawal transaction ─────────────────────────────────────────
    await adminDb.runTransaction(async (tx) => {
      const walletRef = adminDb.collection('wallets').doc(user.uid);
      const walletSnap = await tx.get(walletRef);
      if (!walletSnap.exists) throw new Error('Wallet not found');
      const w = walletSnap.data();

      if ((w.creator || 0) < amount) throw new Error('Insufficient Creator Sparks');

      // Deduct immediately (hold in escrow until admin approves)
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
        upi_id:       upi_id ? upi_id.trim().toLowerCase() : null,
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

