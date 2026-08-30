import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const currentUser = await requireAuth();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Fetch blocks where current user is blocker OR blocked
    const [{ data: blockerData }, { data: blockedData }] = await Promise.all([
      supabaseAdmin
        .from('blocks')
        .select('blocked_id')
        .eq('blocker_id', currentUser.uid),
      supabaseAdmin
        .from('blocks')
        .select('blocker_id')
        .eq('blocked_id', currentUser.uid),
    ]);

    const blockedUids = new Set([
      ...(blockerData || []).map(b => b.blocked_id),
      ...(blockedData || []).map(b => b.blocker_id),
    ]);

    return NextResponse.json({ blocks: Array.from(blockedUids) });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
