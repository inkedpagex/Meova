import { NextResponse } from 'next/server';
import { requireAmbassador } from '../dashboard/route';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/ambassador/college-users
 * Paginated list of users from ambassador's own college.
 * Server-side scoped: WHERE college_id = ambassador.college_id
 * Returns: id, name, photo, tier, college_confirmed — no private data.
 */
export async function GET(request) {
  try {
    const { user, error: authError } = await requireAmbassador('probation');
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 20;
    const offset = (page - 1) * limit;
    const filterUnconfirmed = searchParams.get('unconfirmed') === 'true';
    const requestedCollegeId = searchParams.get('college_id');
    const targetCollegeId = (user.isAdmin && requestedCollegeId) ? requestedCollegeId : user.college_id;

    let query = supabaseAdmin
      .from('profiles')
      .select('id, full_name, username, photo_url, tier, college_confirmed, college_confirmed_via, created_at, is_blocked', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (targetCollegeId) {
      query = query.eq('college_id', targetCollegeId);
    } else if (!user.isAdmin) {
      return NextResponse.json({ users: [], total: 0 });
    }

    if (filterUnconfirmed) {
      query = query.eq('college_confirmed', false);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('[GET /api/ambassador/college-users]', error.message);
      return NextResponse.json({ users: [], total: 0 });
    }

    return NextResponse.json({
      users: data || [],
      total: count || 0,
      page,
      hasMore: offset + limit < (count || 0),
    });
  } catch (err) {
    console.error('[GET /api/ambassador/college-users]', err.message);
    return NextResponse.json({ users: [], total: 0 });
  }
}
