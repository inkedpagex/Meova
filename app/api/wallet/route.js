/**
 * GET  /api/wallet      — Returns the current user's wallet + recent transactions
 * POST /api/wallet      — Submit a payment request (buy sparks)
 */
import { NextResponse } from 'next/server';
import { getUserWithRole } from '../../../lib/getAdminUser';
import { getOrCreateWallet, getTransactions, getUserPendingPayments } from '../../../lib/wallet';
import { adminDb } from '../../../lib/firebaseAdmin';

export async function GET() {
  try {
    const user = await getUserWithRole();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [wallet, transactions, pendingRequests] = await Promise.all([
      getOrCreateWallet(user.uid, user.email),
      getTransactions(user.uid, 30),
      getUserPendingPayments(user.uid),
    ]);

    return NextResponse.json({ wallet, transactions, pendingRequests });
  } catch (err) {
    console.error('[GET /api/wallet]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserWithRole();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { sparks, amount_inr, pack_name, pack_key, reference_code } = await request.json();

    if (!sparks || sparks <= 0) {
      return NextResponse.json({ error: 'Invalid spark amount' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    // Fetch all pending payment requests for this user
    const pendingSnap = await adminDb
      .collection('payment_requests')
      .where('userId', '==', user.uid)
      .where('status', '==', 'pending')
      .get();

    if (pendingSnap.size >= 3) {
      return NextResponse.json({ 
        error: 'You have reached the limit of 3 pending payment requests. Please wait for admin verification.' 
      }, { status: 400 });
    }

    // Check if user already has a pending request for this specific pack
    const existing = pendingSnap.docs.find(doc => doc.data().pack_key === pack_key);

    if (existing) {
      return NextResponse.json({
        exists: true,
        request: { id: existing.id, ...existing.data() }
      });
    }

    // Create new payment request
    const ref = await adminDb.collection('payment_requests').add({
      userId: user.uid,
      email: user.email,
      sparks,
      amount_inr,
      pack_name,
      pack_key,
      reference_code: reference_code || '',
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      exists: false,
      request: { id: ref.id, status: 'pending' }
    });
  } catch (err) {
    console.error('[POST /api/wallet]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
