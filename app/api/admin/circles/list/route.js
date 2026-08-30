/**
 * GET /api/admin/circles/list - Returns all community creation requests for admin review
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const user = await requireAuth();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { data: circles, error } = await supabaseAdmin
      .from('circles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    // Sort: Pending first, then newest
    const enriched = (circles || []).sort((a, b) => {
      if (a.status === 'pending_approval' && b.status !== 'pending_approval') return -1;
      if (a.status !== 'pending_approval' && b.status === 'pending_approval') return 1;
      return (b.created_at || '').localeCompare(a.created_at || '');
    });

    return NextResponse.json({ success: true, circles: enriched });
  } catch (err) {
    console.error('[GET /api/admin/circles/list]', err.message);
    return NextResponse.json({ error: 'Failed to list circles for admin' }, { status: 500 });
  }
}
