import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const { data: payments, error } = await supabaseAdmin
      .from('payment_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    const userIds = [...new Set((payments || []).map(p => p.user_id).filter(Boolean))];
    let profileMap = new Map();

    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, photo_url, branch, year')
        .in('id', userIds);

      if (profiles) {
        profileMap = new Map(profiles.map(p => [p.id, p]));
      }
    }

    const enriched = (payments || []).map(p => {
      const prof = profileMap.get(p.user_id) || {};
      return {
        ...p,
        user_name: p.user_name || prof.full_name || 'Classmate',
        user_email: p.user_email || p.email || prof.email || 'No email',
        avatar_url: prof.photo_url || null,
        branch: prof.branch || null,
        year: prof.year || null,
        amount_inr: p.amount_inr ?? p.rupees ?? 0,
        reference_code: p.reference_code || p.utr_number || null,
      };
    });

    return NextResponse.json({ payments: enriched });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
