import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Shared helper: enforce ambassador gate.
 * Super Admin / Admin has full access to all ambassador tools.
 * Returns the ambassador profile or a NextResponse error.
 */
export async function requireAmbassador(minTier = 'probation') {
  const user = await requireAuth();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, is_ambassador, ambassador_tier, college_id, role')
    .eq('id', user.uid)
    .maybeSingle();

  // ── SUPER ADMIN / ADMIN BYPASS ─────────────────────────────
  // Admins have automatic full access to all ambassador tools & college views
  const isAdmin = user.role === 'admin' || profile?.role === 'admin';
  if (isAdmin) {
    let collegeId = profile?.college_id;
    if (!collegeId) {
      // Pick first active college (e.g. GLA University) as default view for admin
      const { data: col } = await supabaseAdmin
        .from('colleges')
        .select('id')
        .order('name', { ascending: true })
        .limit(1)
        .maybeSingle();
      collegeId = col?.id || null;
    }
    return {
      user: {
        ...user,
        ...profile,
        is_ambassador: true,
        ambassador_tier: 'full',
        college_id: collegeId,
        isAdmin: true,
      }
    };
  }

  if (!profile?.is_ambassador) {
    return { error: NextResponse.json({ error: 'Ambassador access required' }, { status: 403 }) };
  }

  if (!profile.college_id) {
    return { error: NextResponse.json({ error: 'Ambassador college not set. Contact admin.' }, { status: 403 }) };
  }

  if (minTier === 'full' && profile.ambassador_tier !== 'full') {
    return { error: NextResponse.json({ error: 'Full ambassador tier required for this action' }, { status: 403 }) };
  }

  return { user: { ...user, ...profile, isAdmin: false } };
}

/**
 * GET /api/ambassador/dashboard
 * Returns college-scoped stats for the ambassador's dashboard.
 * All queries are server-side scoped to ambassador's college_id.
 * Admins can pass ?college_id=... to inspect any college.
 */
export async function GET(request) {
  try {
    const { user, error: authError } = await requireAmbassador('probation');
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const requestedCollegeId = searchParams.get('college_id');
    const collegeId = (user.isAdmin && requestedCollegeId) ? requestedCollegeId : user.college_id;

    // If no college is found yet, return empty stats cleanly
    if (!collegeId) {
      return NextResponse.json({
        ok: true,
        stats: {
          totalUsers: 0,
          verifiedUsers: 0,
          confirmedUsers: 0,
          newSignups7d: 0,
          activeUsers7d: 0,
        },
        ambassadorTier: user.ambassador_tier || 'full',
        isAdmin: Boolean(user.isAdmin),
      });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Run all stat queries in parallel
    const [
      totalUsersRes,
      verifiedUsersRes,
      confirmedUsersRes,
      newSignupsRes,
      activeUsersRes,
      collegeInfoRes,
    ] = await Promise.all([
      // Total users in this college
      supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('college_id', collegeId),

      // Verified users (tier = 'verified')
      supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('college_id', collegeId)
        .eq('tier', 'verified'),

      // College-confirmed users
      supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('college_id', collegeId)
        .eq('college_confirmed', true),

      // New signups in last 7 days
      supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('college_id', collegeId)
        .gte('created_at', sevenDaysAgo),

      // Active users in last 7 days (updated_at as proxy)
      supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('college_id', collegeId)
        .gte('updated_at', sevenDaysAgo),

      // College info
      supabaseAdmin
        .from('colleges')
        .select('id, name, city')
        .eq('id', collegeId)
        .maybeSingle(),
    ]);

    return NextResponse.json({
      ok: true,
      college: collegeInfoRes.data || null,
      stats: {
        totalUsers: totalUsersRes.count || 0,
        verifiedUsers: verifiedUsersRes.count || 0,
        confirmedUsers: confirmedUsersRes.count || 0,
        newSignups7d: newSignupsRes.count || 0,
        activeUsers7d: activeUsersRes.count || 0,
      },
      ambassadorTier: user.ambassador_tier,
      isAdmin: Boolean(user.isAdmin),
    });
  } catch (err) {
    console.error('[GET /api/ambassador/dashboard]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
