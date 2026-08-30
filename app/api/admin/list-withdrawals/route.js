import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/getAdminUser';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const { data, error } = await supabaseAdmin
      .from('withdrawals')
      .select('*')
      .order('requested_at', { ascending: false });

    if (error) throw new Error(error.message);

    return NextResponse.json({ withdrawals: data || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
