import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/getAdminUser';
import { fetchPendingCirclesAdmin } from '@/lib/supabaseQueries';

export async function GET(request) {
  try {
    const adminUser = await requireAdmin();
    if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const communities = await fetchPendingCirclesAdmin();
    return NextResponse.json({ communities });
  } catch (err) {
    console.error('[GET /api/admin/circles/pending]', err.message);
    return NextResponse.json({ error: 'Failed to fetch pending communities' }, { status: 500 });
  }
}
