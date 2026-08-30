/**
 * GET  /api/wallet      — Returns the current user's wallet + recent transactions
 * POST /api/wallet      — Submit a payment request (buy sparks)
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/getAdminUser';
import { getOrCreateWallet, getTransactions, getUserPendingPayments } from '../../../lib/wallet';
import { supabaseAdmin } from '../../../lib/supabase/admin';

export async function GET() {
  try {
    const user = await requireAuth();
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
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { sparks, amount_inr, pack_name, pack_key, reference_code } = await request.json();

    if (!sparks || sparks <= 0) {
      return NextResponse.json({ error: 'Invalid spark amount' }, { status: 400 });
    }

    // Fetch all pending payment requests for this user
    const { data: pendingPayments } = await supabaseAdmin
      .from('payment_requests')
      .select('id, pack_key')
      .eq('user_id', user.uid)
      .eq('status', 'pending');

    if ((pendingPayments || []).length >= 3) {
      return NextResponse.json({
        error: 'You have reached the limit of 3 pending payment requests. Please wait for admin verification.'
      }, { status: 400 });
    }

    // Check if user already has a pending request for this specific pack
    const existing = (pendingPayments || []).find(p => p.pack_key === pack_key);
    if (existing) {
      return NextResponse.json({ exists: true, request: existing });
    }

    // Create new payment request
    const { data: newReq, error } = await supabaseAdmin
      .from('payment_requests')
      .insert({
        user_id: user.uid,
        email: user.email,
        sparks,
        amount_inr,
        pack_name,
        pack_key,
        reference_code: reference_code || '',
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select('id, status')
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ exists: false, request: newReq });
  } catch (err) {
    console.error('[POST /api/wallet]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
