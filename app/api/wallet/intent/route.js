import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/getAdminUser';
import { rateLimit, getClientIp } from '../../../../lib/rateLimit';
import {
  createPaymentReservation,
  claimPaymentReservation,
  cancelPaymentReservation,
  RECHARGE_PACKS
} from '../../../../lib/paymentReservations';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`intent:${ip}`, { limit: 10, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json({ error: 'Too many requests. Please slow down.' }, {
        status: 429,
        headers: { 'Retry-After': rl.retryAfter }
      });
    }

    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const pack_key = body.pack_key || body.packKey || 'popular';
    const pack = RECHARGE_PACKS[pack_key] || RECHARGE_PACKS.popular;
    const sparks = Number(body.sparks || pack.sparks);
    const amount_inr = Number(body.amount_inr || pack.inr);

    const result = await createPaymentReservation({
      userId: user.uid,
      baseAmount: amount_inr,
      sparks,
      packKey: pack_key,
      packName: pack.label || `${sparks} Sparks`,
      userEmail: user.email || '',
      userName: user.full_name || '',
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error, activeReservation: result.activeReservation }, { status: 400 });
    }

    return NextResponse.json({
      intentId: result.reservation.id,
      amount_inr: result.reservation.final_amount,
      unique_decimal: result.reservation.unique_decimal,
      reference_code: result.reservation.reference_code,
      expires_at: result.reservation.expires_at,
    });
  } catch (err) {
    console.error('[POST /api/wallet/intent]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { intentId } = await request.json();
    if (!intentId) return NextResponse.json({ error: 'Missing intentId' }, { status: 400 });

    const result = await claimPaymentReservation({
      reservationId: intentId,
      userId: user.uid
    });

    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /api/wallet/intent]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { intentId } = await request.json();
    if (!intentId) return NextResponse.json({ error: 'Missing intentId' }, { status: 400 });

    await cancelPaymentReservation({
      reservationId: intentId,
      userId: user.uid
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/wallet/intent]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
