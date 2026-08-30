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

  let packKey;
  try {
    const body = await request.json();
    packKey = sanitizeText(body.packKey, 20);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const pack = PACKS[packKey];
  if (!pack) return NextResponse.json({ error: 'Invalid pack selection' }, { status: 400 });

  try {
    // Check for existing pending request for this user+pack
    const { data: existing } = await supabaseAdmin
      .from('payment_requests')
      .select('id, reference_code')
      .eq('user_id', user.uid)
      .eq('pack_key', packKey)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: true, reference_code: existing.reference_code, existing: true });
    }

    const reference_code = await generateUnique5CharRefCode();

    const { error } = await supabaseAdmin.from('payment_requests').insert({
      user_id:        user.uid,
      email:          user.email,
      pack_key:       packKey,
      pack_name:      pack.name,
      sparks:         pack.sparks,
      amount_inr:     pack.amount_inr,
      reference_code,
      status:         'pending',
      created_at:     new Date().toISOString(),
    });

    if (error) throw new Error(error.message);

    logger.audit('PAYMENT_REQUEST_CREATED', user.uid, {
      reference_code,
      packKey,
      amount: pack.amount_inr,
    });

    // Send real-time alert to admin webhook if configured
    sendAdminAlert({
      title: 'New Payment Recharge Request',
      message: `User ${user.email} requested ${pack.sparks} Sparks (₹${pack.amount_inr})`,
      fields: [
        { name: 'Ref Code', value: reference_code },
        { name: 'Amount', value: `₹${pack.amount_inr}` },
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
