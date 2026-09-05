import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/getAdminUser';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { getDerivedBalance } from '../../../../lib/walletLedger';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const { data: withdrawals, error } = await supabaseAdmin
      .from('withdrawals')
      .select('*')
      .order('requested_at', { ascending: false });

    if (error) throw new Error(error.message);

    const userIds = Array.from(new Set((withdrawals || []).map(w => w.user_id).filter(Boolean)));

    let profilesMap = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, phone_verified')
        .in('id', userIds);

      (profiles || []).forEach(p => {
        profilesMap[p.id] = p;
      });
    }

    // Enrich withdrawals with user profile info
    const enriched = (withdrawals || []).map(w => {
      const p = profilesMap[w.user_id] || {};
      return {
        ...w,
        user_name: p.full_name || 'Anonymous User',
        user_email: p.email || w.email,
        phone_verified: p.phone_verified || false,
        amount: Number(w.amount || w.sparks || w.rupees || 0),
        sparks: Number(w.sparks || w.amount || 0),
      };
    });

    return NextResponse.json({ withdrawals: enriched });
  } catch (error) {
    console.error('[GET /api/admin/list-withdrawals]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

