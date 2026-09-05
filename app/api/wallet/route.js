/**
 * GET  /api/wallet      — Returns current user's wallet with ledger-derived balance + recent transactions
 * POST /api/wallet      — Create a payment reservation (1:1 Sparks to INR)
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/getAdminUser';
import { getOrCreateWallet } from '../../../lib/wallet';
import { getDerivedBalance, getUserLedgerHistory } from '../../../lib/walletLedger';
import {
  getActiveUserReservation,
  createPaymentReservation,
  RECHARGE_PACKS
} from '../../../lib/paymentReservations';
import { supabaseAdmin } from '../../../lib/supabase/admin';

export async function GET() {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [cachedWallet, derivedInfo, ledgerHistory, activeReservation] = await Promise.all([
      getOrCreateWallet(user.uid, user.email),
      getDerivedBalance(user.uid),
      getUserLedgerHistory(user.uid, 30),
      getActiveUserReservation(user.uid),
    ]);

    // Use derived ledger balance with fallback to cached wallet
    const wallet = {
      ...cachedWallet,
      purchased: derivedInfo.purchased ?? (cachedWallet.purchased || 0),
      earned: derivedInfo.earned ?? (cachedWallet.creator || 0),
      withdrawable: derivedInfo.withdrawable ?? (cachedWallet.creator || 0),
      creator: derivedInfo.earned ?? (cachedWallet.creator || 0),
      bonus: derivedInfo.bonus ?? (cachedWallet.bonus || 0),
      total_balance: derivedInfo.balance,
      ledger_entries: derivedInfo.ledgerEntryCount || 0,
    };

    // Format transactions list with bucket tags
    const transactions = (ledgerHistory || []).map(tx => ({
      id: tx.id,
      amount: Number(tx.amount || 0),
      type: tx.type,
      bucket: tx.bucket || (tx.spark_type === 'creator' || tx.spark_type === 'earned' ? 'earned' : 'purchased'),
      description: tx.description || tx.title || 'Transaction',
      created_at: tx.created_at,
      status: tx.status || 'completed',
      reference_id: tx.reference_id,
      metadata: tx.metadata || {},
    }));

    // Check pending reservations
    let pendingReservations = [];
    try {
      const { data } = await supabaseAdmin
        .from('payment_reservations')
        .select('*')
        .eq('user_id', user.uid)
        .in('status', ['pending', 'paid_claimed'])
        .order('created_at', { ascending: false });
      if (data) pendingReservations = data;
    } catch {}

    return NextResponse.json({
      wallet,
      transactions,
      activeReservation,
      pendingRequests: pendingReservations.length > 0 ? pendingReservations : (activeReservation ? [activeReservation] : []),
      packs: RECHARGE_PACKS
    });
  } catch (err) {
    console.error('[GET /api/wallet]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const packKey = body.packKey || body.pack_key || 'popular';
    const pack = RECHARGE_PACKS[packKey] || RECHARGE_PACKS.popular;

    const sparks = Number(body.sparks || pack.sparks);
    const baseAmount = Number(body.amount_inr || body.baseAmount || pack.inr);

    const result = await createPaymentReservation({
      userId: user.uid,
      baseAmount,
      sparks,
      packKey: pack.key,
      packName: pack.label || `${sparks} Sparks`,
      userEmail: user.email || '',
      userName: user.full_name || '',
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error, activeReservation: result.activeReservation }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      exists: false,
      request: result.reservation,
      reservation: result.reservation
    });
  } catch (err) {
    console.error('[POST /api/wallet]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

