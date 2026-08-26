import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/getAdminUser';
import { adminDb } from '../../../../lib/firebaseAdmin';
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
    if (!adminDb) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

    // 1. Fetch all active requests (pending or intent) for this pack_key to find used decimals
    const activeSnap = await adminDb.collection('payment_requests')
      .where('pack_key', '==', pack_key)
      .where('status', 'in', ['pending', 'payment_intent'])
      .get();

    // 2. Check user's own limit (max 3 total active)
    const userActive = activeSnap.docs.filter(d => d.data().userId === user.uid);
    if (userActive.length >= 3) {
      return NextResponse.json({ error: 'Limit of 3 pending requests reached.' }, { status: 400 });
    }

    // 2.5 Lock intent: if user generated an intent for this pack < 5 mins ago, reuse it!
    const fiveMinsAgo = Date.now() - 5 * 60 * 1000;
    const recentIntent = userActive.find(d => {
      const data = d.data();
      return data.status === 'payment_intent' && new Date(data.created_at).getTime() > fiveMinsAgo;
    });

    if (recentIntent) {
      return NextResponse.json({
        intentId: recentIntent.id,
        amount_inr: recentIntent.data().amount_inr
      });
    }

    // 3. Extract used decimals (ignore intents older than 15 mins to free slots)
    const fifteenMinsAgo = Date.now() - 15 * 60 * 1000;
    const usedDecimals = new Set();
    activeSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.status === 'payment_intent' && new Date(data.created_at).getTime() < fifteenMinsAgo) return;
      
      const amt = data.amount_inr;
      if (amt && !Number.isInteger(amt)) {
        const dec = Math.round((amt - Math.floor(amt)) * 100);
        usedDecimals.add(dec);
      }
    });

    // 4. Generate a unique random decimal (between 1 and 99)
    let randomDecimal;
    let attempts = 0;
    do {
      randomDecimal = Math.floor(Math.random() * 99) + 1; // 1 to 99
      attempts++;
    } while (usedDecimals.has(randomDecimal) && attempts < 200);

    if (attempts >= 200) {
      return NextResponse.json({ error: 'Too many concurrent requests for this pack right now. Please try again later.' }, { status: 429 });
    }

    // 5. Calculate exact unique amount and fix JS float precision issues
    const uniqueAmount = Number((amount_inr + (randomDecimal / 100)).toFixed(2));

    // 6. Create intent
    const ref = await adminDb.collection('payment_requests').add({
      userId: user.uid,
      email: user.email,
      sparks,
      amount_inr: uniqueAmount,
      pack_name,
      pack_key,
      status: 'payment_intent',
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      intentId: ref.id,
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

    const ref = adminDb.collection('payment_requests').doc(intentId);
    const doc = await ref.get();
    
    if (!doc.exists || doc.data().userId !== user.uid) {
      return NextResponse.json({ error: 'Intent not found' }, { status: 404 });
    }

    await ref.update({
      status: 'pending',
      updated_at: new Date().toISOString()
    });

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

    const ref = adminDb.collection('payment_requests').doc(intentId);
    const doc = await ref.get();
    if (doc.exists && doc.data().userId === user.uid) {
      if (doc.data().status === 'payment_intent') {
        await ref.delete();
      } else if (doc.data().status === 'pending') {
        await ref.update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/wallet/intent]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

