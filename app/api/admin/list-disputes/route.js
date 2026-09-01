import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .in('status', ['Disputed', 'disputed'])
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return NextResponse.json({ disputes: data || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
