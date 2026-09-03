import { NextResponse } from 'next/server';
import { requireHostOrAdmin } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request) {
  const host = await requireHostOrAdmin();
  if (!host) {
    return NextResponse.json({ error: 'Unauthorized. Host privileges required.' }, { status: 403 });
  }

  try {
    const [usersCountRes, suspendedCountRes, circlesCountRes, postsCountRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).or('is_blocked.eq.true,status.eq.blocked'),
      supabaseAdmin.from('circles').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('posts').select('id', { count: 'exact', head: true }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalStudents: usersCountRes.count || 0,
        suspendedUsers: suspendedCountRes.count || 0,
        totalCircles: circlesCountRes.count || 0,
        totalPosts: postsCountRes.count || 0,
        hostCampus: host.branch ? `${host.branch} / GLA` : 'GLA University, Mathura',
      }
    });
  } catch (error) {
    console.error('[GET /api/host/stats]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch host stats' }, { status: 500 });
  }
}
