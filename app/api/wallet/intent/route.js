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

    // 1. Fetch active decimal allocations
    const { data: activeRequests } = await supabaseAdmin
      .from('payment_requests')
      .select('*')
      .eq('pack_key', pack_key)
      .in('status', ['pending', 'payment_intent']);

    const activeDocs = activeRequests || [];

    // 2. Check user limit on submitted pending requests only (max 3 pending)
    const userSubmittedPending = activeDocs.filter(d => d.user_id === user.uid && d.status === 'pending');
    if (userSubmittedPending.length >= 3) {
      return NextResponse.json({ error: 'Limit of 3 pending verification requests reached. Please wait for review.' }, { status: 400 });
    }

    // Auto-cleanup previous unsubmitted intent rows for this user
    await supabaseAdmin
      .from('payment_requests')
      .delete()
      .eq('user_id', user.uid)
      .eq('status', 'payment_intent');

    // 3. Auto-expire stale intents (> 10 mins old)
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    await supabaseAdmin
      .from('payment_requests')
      .update({ status: 'expired' })
      .eq('status', 'payment_intent')
      .lt('created_at', tenMinsAgo);

    // Extract used decimals from genuinely active intents
    const usedDecimals = new Set();
    activeDocs.forEach(d => {
      if (d.status === 'payment_intent' && new Date(d.created_at).getTime() < (Date.now() - 10 * 60 * 1000)) return;
      const amt = d.amount_inr;
      if (amt && !Number.isInteger(amt)) {
        const dec = Math.round((amt - Math.floor(amt)) * 100);
        usedDecimals.add(dec);
      }
    });

    // 4. Deterministically find an available slot (1 to 99)
    let selectedDecimal = null;
    // Try random first for uniform spread
    for (let i = 0; i < 30; i++) {
      const rand = Math.floor(Math.random() * 99) + 1;
      if (!usedDecimals.has(rand)) {
        selectedDecimal = rand;
        break;
      }
    }
    // Fallback: Linear search for first free slot
    if (!selectedDecimal) {
      for (let slot = 1; slot <= 99; slot++) {
        if (!usedDecimals.has(slot)) {
          selectedDecimal = slot;
          break;
        }
      }
    }

    if (!selectedDecimal) {
      return NextResponse.json({ error: 'All payment slots are currently active. Please try again in 2 minutes.' }, { status: 429 });
    }

    const basePayload = {
      user_id: user.uid,
      sparks,
      status: 'payment_intent',
      created_at: new Date().toISOString(),
    };

    let newIntent = null;
    // 1. Try standard schema shape (rupees, unique_decimal, user_email)
    const { data: primaryData, error: primaryErr } = await supabaseAdmin
      .from('payment_requests')
      .insert({
        ...basePayload,
        user_email: user.email || '',
        user_name: user.full_name || '',
        rupees: uniqueAmount,
        unique_decimal: String(selectedDecimal),
      })
      .select('id')
      .single();

    if (!primaryErr && primaryData) {
      newIntent = primaryData;
    } else {
      // 2. Fallback to extended schema shape if table columns vary
      const { data: fallbackData, error: fallbackErr } = await supabaseAdmin
        .from('payment_requests')
        .insert({
          ...basePayload,
          email: user.email,
          amount_inr: uniqueAmount,
          pack_name,
          pack_key,
        })
        .select('id')
        .single();

      if (!fallbackErr && fallbackData) {
        newIntent = fallbackData;
      } else {
        console.warn('[POST /api/wallet/intent insert warning]', primaryErr?.message || fallbackErr?.message);
      }
    }

    return NextResponse.json({
      intentId: newIntent?.id || `intent_${Date.now()}`,
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
