import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/getAdminUser';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { rateLimit, getClientIp } from '../../../../lib/rateLimit';
import { logger } from '../../../../utils/logger';
import { sendAdminAlert } from '../../../../utils/alerts';
import { sanitizeText } from '../../../../lib/validations';

const PACKS = {
  starter: { sparks: 100,  amount_inr: 49,  name: 'Starter' },
  popular: { sparks: 250,  amount_inr: 99,  name: 'Popular' },
  growth:  { sparks: 700,  amount_inr: 249, name: 'Growth' },
  pro:     { sparks: 1600, amount_inr: 499, name: 'Pro' },
};

function generate5CharAlphanumeric() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function generateUnique5CharRefCode() {
  let attempts = 0;
  while (attempts < 100) {
    const code = generate5CharAlphanumeric();
    try {
      const { data } = await supabaseAdmin
        .from('payment_requests')
        .select('id')
        .eq('reference_code', code)
        .eq('status', 'pending')
        .maybeSingle();
      if (!data) return code; // No existing match — this code is unique
    } catch (err) {
      logger.warn('Supabase unique code check failed. Returning generated code:', { error: err.message });
      return code;
    }
    attempts++;
  }
  return generate5CharAlphanumeric();
}

export async function POST(request) {
  const ip = getClientIp(request);
  const { ok, retryAfter } = rateLimit(`payment_req:${ip}`, { limit: 10, windowMs: 60_000 });
  if (!ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a minute.' },
      { status: 429, headers: { 'Retry-After': retryAfter } }
    );
  }

  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  let sparks, amount_inr, pack_name, pack_key;
  try {
    const body = await request.json();
    pack_key = body.pack_key || body.packKey || 'pack_custom';
    sparks = Number(body.sparks || PACKS[pack_key]?.sparks || 100);
    amount_inr = Number(body.amount_inr || PACKS[pack_key]?.amount_inr || sparks);
    pack_name = body.pack_name || `${sparks} Sparks`;
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!sparks || sparks <= 0 || !amount_inr) {
    return NextResponse.json({ error: 'Invalid spark amount' }, { status: 400 });
  }

  try {
    const reference_code = await generateUnique5CharRefCode();

    const basePayload = {
      user_id: user.uid,
      sparks,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    // Try standard schema first (rupees, unique_decimal, user_email)
    const dec = Math.round((amount_inr - Math.floor(amount_inr)) * 100);
    const { error: primaryErr } = await supabaseAdmin
      .from('payment_requests')
      .insert({
        ...basePayload,
        user_email: user.email || '',
        user_name: user.full_name || '',
        rupees: amount_inr,
        unique_decimal: dec > 0 ? String(dec) : '',
      });

    if (primaryErr) {
      // Fallback to alternate schema columns
      await supabaseAdmin
        .from('payment_requests')
        .insert({
          ...basePayload,
          email: user.email,
          pack_key,
          pack_name,
          amount_inr,
          reference_code,
        });
    }

    logger.audit('PAYMENT_REQUEST_CREATED', user.uid, {
      reference_code,
      pack_key,
      amount: amount_inr,
    });

    sendAdminAlert({
      title: 'New Payment Recharge Request',
      message: `User ${user.email} requested ${sparks} Sparks (₹${amount_inr})`,
      fields: [
        { name: 'Ref Code', value: reference_code },
        { name: 'Amount', value: `₹${amount_inr}` },
        { name: 'User', value: user.email },
      ],
    }).catch(() => {});

    return NextResponse.json({ ok: true, reference_code });
  } catch (err) {
    logger.error('Payment request creation failed', err, { userId: user.uid });
    const reference_code = generate5CharAlphanumeric();
    return NextResponse.json({ ok: true, reference_code, fallback: true });
  }
}
