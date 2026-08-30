import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/getAdminUser';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

/**
 * POST /api/admin/repair-wallets
 * Finds all wallets with negative balances and resets those fields to 0.
 * Only callable by admins.
 */
export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const { data: wallets, error } = await supabaseAdmin
      .from('wallets')
      .select('user_id, creator, purchased, bonus, lifetime_withdrawn');

    if (error) throw new Error(error.message);

    const repairs = [];
    for (const w of (wallets || [])) {
      const updates = {};
      if ((w.creator || 0) < 0) updates.creator = 0;
      if ((w.purchased || 0) < 0) updates.purchased = 0;
      if ((w.bonus || 0) < 0) updates.bonus = 0;
      if ((w.lifetime_withdrawn || 0) < 0) updates.lifetime_withdrawn = 0;

      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString();
        await supabaseAdmin.from('wallets').update(updates).eq('user_id', w.user_id);
        repairs.push({ uid: w.user_id, fixed: updates });
      }
    }

    return NextResponse.json({ ok: true, repaired: repairs.length, details: repairs });
  } catch (err) {
    console.error('[repair-wallets]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
