import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/getAdminUser';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { rateLimit, getClientIp } from '../../../../lib/rateLimit';

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

    const { sparks, amount_inr, pack_name, pack_key } = await request.json();

    if (!sparks || sparks <= 0 || !amount_inr) {
      return NextResponse.json({ error: 'Invalid spark amount' }, { status: 400 });
    }

    // 1. Fetch active requests for this pack_key
    const { data: activeRequests } = await supabaseAdmin
      .from('payment_requests')
      .select('*')
      .eq('pack_key', pack_key)
      .in('status', ['pending', 'payment_intent']);

    const activeDocs = activeRequests || [];

    // 2. Check user's limit (max 3 total active)
    const userActive = activeDocs.filter(d => d.user_id === user.uid);
    if (userActive.length >= 3) {
      return NextResponse.json({ error: 'Limit of 3 pending requests reached.' }, { status: 400 });
    }

    // Reuse recent intent (< 5 mins old)
    const fiveMinsAgo = Date.now() - 5 * 60 * 1000;
    const recentIntent = userActive.find(d => {
      return d.status === 'payment_intent' && new Date(d.created_at).getTime() > fiveMinsAgo;
    });

    if (recentIntent) {
      return NextResponse.json({
        intentId: recentIntent.id,
        amount_inr: recentIntent.amount_inr
      });
    }

    // 3. Extract used decimals
    const fifteenMinsAgo = Date.now() - 15 * 60 * 1000;
    const usedDecimals = new Set();
    activeDocs.forEach(d => {
      if (d.status === 'payment_intent' && new Date(d.created_at).getTime() < fifteenMinsAgo) return;
      const amt = d.amount_inr;
      if (amt && !Number.isInteger(amt)) {
        const dec = Math.round((amt - Math.floor(amt)) * 100);
        usedDecimals.add(dec);
      }
    });

    // 4. Generate random decimal
    let randomDecimal;
    let attempts = 0;
    do {
      randomDecimal = Math.floor(Math.random() * 99) + 1;
      attempts++;
    } while (usedDecimals.has(randomDecimal) && attempts < 200);

    if (attempts >= 200) {
      return NextResponse.json({ error: 'Too many concurrent requests for this pack right now. Please try again later.' }, { status: 429 });
    }

    const uniqueAmount = Number((amount_inr + (randomDecimal / 100)).toFixed(2));

    const { data: newIntent, error: insertErr } = await supabaseAdmin
      .from('payment_requests')
      .insert({
        user_id: user.uid,
        email: user.email,
        sparks,
        amount_inr: uniqueAmount,
        pack_name,
        pack_key,
        status: 'payment_intent',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertErr) {
      console.error('[POST /api/wallet/intent insert error]', insertErr.message);
      return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 });
    }

    return NextResponse.json({
      intentId: newIntent.id,
      amount_inr: uniqueAmount
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

    const { data: doc } = await supabaseAdmin
      .from('payment_requests')
      .select('*')
      .eq('id', intentId)
      .maybeSingle();

    if (!doc || doc.user_id !== user.uid) {
      return NextResponse.json({ error: 'Intent not found' }, { status: 404 });
    }

    await supabaseAdmin
      .from('payment_requests')
      .update({
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', intentId);

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

    const { data: doc } = await supabaseAdmin
      .from('payment_requests')
      .select('*')
      .eq('id', intentId)
      .maybeSingle();

    if (doc && doc.user_id === user.uid) {
      if (doc.status === 'payment_intent') {
        await supabaseAdmin
          .from('payment_requests')
          .delete()
          .eq('id', intentId);
      } else if (doc.status === 'pending') {
        await supabaseAdmin
          .from('payment_requests')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', intentId);
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/wallet/intent]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
