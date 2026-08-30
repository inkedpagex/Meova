/**
 * GET /api/circles/[id]/members - Host & Admin endpoint to fetch joined student roster & revenue metrics
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request, { params }) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: circleId } = await params;
    if (!circleId) return NextResponse.json({ error: 'Invalid community ID' }, { status: 400 });

    // Fetch circle
    const { data: circle, error: circleErr } = await supabaseAdmin
      .from('circles')
      .select('id, name, creator_id, total_sparks_earned, member_count')
      .eq('id', circleId)
      .maybeSingle();

    if (circleErr || !circle) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    const isHost = circle.creator_id === user.uid;
    const isAdmin = user.role === 'admin';

    if (!isHost && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Only host can view member details' }, { status: 403 });
    }

    // Fetch all members with their profile info via join
    const { data: members, error: membersErr } = await supabaseAdmin
      .from('circle_members')
      .select(`
        circle_id,
        user_id,
        role,
        sparks_paid,
        joined_at,
        profiles (
          id,
          full_name,
          photo_url,
          year,
          branch,
          email
        )
      `)
      .eq('circle_id', circleId)
      .order('joined_at', { ascending: false });

    if (membersErr) throw new Error(membersErr.message);

    const roster = (members || []).map(m => ({
      circle_id: m.circle_id,
      user_id: m.user_id,
      role: m.role,
      sparks_paid: m.sparks_paid,
      joined_at: m.joined_at,
      student: {
        id: m.profiles?.id || m.user_id,
        full_name: m.profiles?.full_name || 'Campus Student',
        photo_url: m.profiles?.photo_url || '',
        year: m.profiles?.year || 'Student',
        branch: m.profiles?.branch || '',
        email: m.profiles?.email || '',
      },
    }));

    return NextResponse.json({
      success: true,
      circleId,
      circleName: circle.name,
      total_members: roster.length,
      total_sparks_earned: circle.total_sparks_earned || 0,
      roster,
    });
  } catch (err) {
    console.error('[GET /api/circles/[id]/members]', err.message);
    return NextResponse.json({ error: 'Failed to fetch member details' }, { status: 500 });
  }
}
