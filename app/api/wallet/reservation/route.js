import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/getAdminUser';
import { rateLimit, getClientIp } from '../../../../lib/rateLimit';
import {
  createPaymentReservation,
  claimPaymentReservation,
  cancelPaymentReservation,
  getActiveUserReservation,
  RECHARGE_PACKS
} from '../../../../lib/paymentReservations';

export async function GET(request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const activeRes = await getActiveUserReservation(user.uid);
    return NextResponse.json({ activeReservation: activeRes, packs: RECHARGE_PACKS });
  } catch (err) {
    console.error('[GET /api/wallet/reservation]', err.message);
    return NextResponse.json({ error: 'Failed to fetch reservation' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`res_create:${ip}`, { limit: 12, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429, headers: { 'Retry-After': rl.retryAfter } }
      );
    }

    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const packKey = body.packKey || body.pack_key || 'popular';
    const selectedPack = RECHARGE_PACKS[packKey] || RECHARGE_PACKS.popular;

    const sparks = Number(body.sparks || selectedPack.sparks);
    const baseAmount = Number(body.baseAmount || body.amount_inr || selectedPack.inr);

    const result = await createPaymentReservation({
      userId: user.uid,
      baseAmount,
      sparks,
      packKey: selectedPack.key,
      packName: selectedPack.label || `${sparks} Sparks`,
      userEmail: user.email || '',
      userName: user.full_name || '',
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error, activeReservation: result.activeReservation }, { status: 400 });
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[POST /api/wallet/reservation]', err.message);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const reservationId = body.reservationId || body.id;
    const utrNumber = body.utrNumber || body.utr || '';

    if (!reservationId) {
      return NextResponse.json({ error: 'reservationId is required' }, { status: 400 });
    }

    const result = await claimPaymentReservation({
      reservationId,
      userId: user.uid,
      utrNumber
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[PATCH /api/wallet/reservation]', err.message);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const reservationId = body.reservationId || body.id;

    if (!reservationId) {
      return NextResponse.json({ error: 'reservationId is required' }, { status: 400 });
    }

    const result = await cancelPaymentReservation({
      reservationId,
      userId: user.uid
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/wallet/reservation]', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
