import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    // Fetch users with their wallet balances via join
    const { data: profiles, error: profilesErr } = await supabaseAdmin
      .from('profiles')
      .select(`
        *,
        wallets (
          purchased,
          bonus,
          creator
        )
      `)
      .order('created_at', { ascending: false });

    if (profilesErr) throw new Error(profilesErr.message);

    const users = (profiles || []).map(p => ({
      ...p,
      sparksBalance: p.wallets
        ? (p.wallets.purchased || 0) + (p.wallets.bonus || 0) + (p.wallets.creator || 0)
        : 0,
      wallets: undefined, // remove nested wallet object from response
    }));

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
