import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/getAdminUser';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { rateLimit, getClientIp } from '../../../../lib/rateLimit';
import { logger } from '../../../../utils/logger';
import { sendAdminAlert } from '../../../../utils/alerts';

const PACKS = {
  starter: { sparks: 100,  amount_inr: 49,  name: 'Starter' },
  popular: { sparks: 250,  amount_inr: 99,  name: 'Popular' },
  growth:  { sparks: 500,  amount_inr: 249, name: 'Growth' },
  pro:     { sparks: 1000, amount_inr: 499, name: 'Pro (Max)' },
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
      if (!data) return code;
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

  let sparks, baseAmount, pack_name, pack_key;
  try {
    const body = await request.json();
    pack_key = body.pack_key || body.packKey || 'pro';
    sparks = Number(body.sparks || PACKS[pack_key]?.sparks || 100);
    baseAmount = Number(body.amount_inr || PACKS[pack_key]?.amount_inr || 49);
    pack_name = body.pack_name || PACKS[pack_key]?.name || `${sparks} Sparks`;
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!sparks || sparks <= 0 || !baseAmount) {
    return NextResponse.json({ error: 'Invalid spark amount' }, { status: 400 });
  }

  try {
    const reference_code = await generateUnique5CharRefCode();

    // 1. Allocate active unique decimal slot (1 to 99) for automated UPI matching
    const { data: activeDocs } = await supabaseAdmin
      .from('payment_requests')
      .select('unique_decimal')
      .eq('status', 'pending');

    const usedDecimals = new Set((activeDocs || []).map(d => Number(d.unique_decimal)).filter(Boolean));
    let selectedDecimal = null;
    for (let i = 0; i < 30; i++) {
      const rand = Math.floor(Math.random() * 99) + 1;
      if (!usedDecimals.has(rand)) {
        selectedDecimal = rand;
        break;
      }
    }
    if (!selectedDecimal) {
      for (let s = 1; s <= 99; s++) {
        if (!usedDecimals.has(s)) {
          selectedDecimal = s;
          break;
        }
      }
    }
    if (!selectedDecimal) selectedDecimal = Math.floor(Math.random() * 99) + 1;

    const uniqueDecimalStr = String(selectedDecimal).padStart(2, '0');
    const finalAmount = Number((Math.floor(baseAmount) + (selectedDecimal / 100)).toFixed(2));

    const payload = {
      user_id: user.uid,
      sparks,
      status: 'pending',
      created_at: new Date().toISOString(),
      reference_code,
      pack_key,
      pack_name,
      rupees: finalAmount,
      amount_inr: finalAmount,
      unique_decimal: uniqueDecimalStr,
      user_email: user.email || '',
      user_name: user.full_name || '',
      email: user.email || '',
    };

    const { error: insertErr } = await supabaseAdmin
      .from('payment_requests')
      .insert(payload);

    if (insertErr) {
      logger.warn('[request-payment] primary insert failed, trying minimal:', insertErr.message);
      await supabaseAdmin
        .from('payment_requests')
        .insert({
          user_id: user.uid,
          sparks,
          status: 'pending',
          created_at: payload.created_at,
          rupees: finalAmount,
          unique_decimal: uniqueDecimalStr,
          user_email: user.email || '',
          user_name: user.full_name || '',
        });
    }

    logger.audit('PAYMENT_REQUEST_CREATED', user.uid, {
      reference_code,
      pack_key,
      amount: finalAmount,
      decimal: uniqueDecimalStr,
    });

    sendAdminAlert({
      title: 'New Payment Recharge Request',
      message: `Student ${user.full_name || user.email} requested ${sparks} Sparks (₹${finalAmount})`,
      fields: [
        { name: 'Ref Code', value: reference_code },
        { name: 'Amount', value: `₹${finalAmount}` },
        { name: 'User', value: user.email },
      ],
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      reference_code,
      amount_inr: finalAmount,
      unique_decimal: uniqueDecimalStr,
      sparks,
    });
  } catch (err) {
    logger.error('Payment request creation failed', err, { userId: user.uid });
    const reference_code = generate5CharAlphanumeric();
    return NextResponse.json({ ok: true, reference_code, amount_inr: baseAmount, fallback: true });
  }
}
