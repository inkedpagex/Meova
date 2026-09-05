import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/getAdminUser';
import { rateLimit, getClientIp } from '../../../../lib/rateLimit';
import {
  createPaymentReservation,
  RECHARGE_PACKS
} from '../../../../lib/paymentReservations';

export async function POST(request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`payment_req:${ip}`, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a minute.' },
      { status: 429, headers: { 'Retry-After': rl.retryAfter } }
    );
  }

  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  let sparks, baseAmount, pack_name, pack_key;
  try {
    const body = await request.json();
    pack_key = body.pack_key || body.packKey || 'popular';
    const pack = RECHARGE_PACKS[pack_key] || RECHARGE_PACKS.popular;
    sparks = Number(body.sparks || pack.sparks);
    baseAmount = Number(body.amount_inr || pack.inr);
    pack_name = body.pack_name || pack.label || `${sparks} Sparks`;
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const result = await createPaymentReservation({
    userId: user.uid,
    baseAmount,
    sparks,
    packKey: pack_key,
    packName: pack_name,
    userEmail: user.email || '',
    userName: user.full_name || '',
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error, activeReservation: result.activeReservation }, { status: 400 });
  }

  const res = result.reservation;
  return NextResponse.json({
    ok: true,
    reference_code: res.reference_code,
    amount_inr: res.final_amount,
    unique_decimal: res.unique_decimal,
    sparks: res.sparks,
    expires_at: res.expires_at,
    id: res.id,
    reservationId: res.id
  });
}
