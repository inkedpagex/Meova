import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/getAdminUser';
import { adminDb } from '../../../../lib/firebaseAdmin';

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
  if (!adminDb) {
    return generate5CharAlphanumeric();
  }
  let attempts = 0;
  while (attempts < 100) {
    const code = generate5CharAlphanumeric();
    try {
      const snap = await adminDb.collection('payment_requests')
        .where('reference_code', '==', code)
        .where('status', '==', 'pending')
        .get();
      if (snap.empty) {
        return code;
      }
    } catch (err) {
      console.warn("Firestore unique code check failed. Returning generated code:", err.message);
      return code;
    }
    attempts++;
  }
  return generate5CharAlphanumeric();
}

export async function POST(request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  let packKey;
  try {
    const body = await request.json();
    packKey = body.packKey;
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const pack = PACKS[packKey];
  if (!pack) return NextResponse.json({ error: 'Invalid pack' }, { status: 400 });

  try {
    if (!adminDb) throw new Error('Database not configured');

    // Check for existing pending request for this user+pack
    const existing = await adminDb.collection('payment_requests')
      .where('userId', '==', user.uid)
      .where('pack_key', '==', packKey)
      .where('status', '==', 'pending')
      .get();

    if (!existing.empty) {
      const ex = existing.docs[0];
      return NextResponse.json({ ok: true, reference_code: ex.data().reference_code, existing: true });
    }

    const reference_code = await generateUnique5CharRefCode();

    await adminDb.collection('payment_requests').add({
      userId:         user.uid,
      email:          user.email,
      pack_key:       packKey,
      pack_name:      pack.name,
      sparks:         pack.sparks,
      amount_inr:     pack.amount_inr,
      reference_code,
      status:         'pending',
      created_at:     new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, reference_code });
  } catch (err) {
    console.warn("Payment request creation in Firestore failed (likely quota limit). Using fallback code:", err.message);
    const reference_code = generate5CharAlphanumeric();
    return NextResponse.json({ ok: true, reference_code, fallback: true });
  }
}
