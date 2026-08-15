import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/getAdminUser';
import { adminDb } from '../../../../lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * POST /api/admin/repair-wallets
 * Finds all wallets with negative balances caused by the buggy SET-instead-of-increment bug
 * and resets those fields to 0. Only callable by admins.
 */
export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const walletsSnap = await adminDb.collection('wallets').get();
    const repairs = [];

    for (const doc of walletsSnap.docs) {
      const w = doc.data();
      const updates = {};

      if ((w.creator || 0) < 0) updates.creator = 0;
      if ((w.purchased || 0) < 0) updates.purchased = 0;
      if ((w.bonus || 0) < 0) updates.bonus = 0;
      if ((w.lifetime_withdrawn || 0) < 0) updates.lifetime_withdrawn = 0;

      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString();
        await doc.ref.update(updates);
        repairs.push({ uid: doc.id, fixed: updates });
      }
    }

    return NextResponse.json({
      ok: true,
      repaired: repairs.length,
      details: repairs,
    });
  } catch (err) {
    console.error('[repair-wallets]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
