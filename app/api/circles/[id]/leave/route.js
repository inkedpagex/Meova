import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request, { params }) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: circleId } = await params;
    if (!circleId) return NextResponse.json({ error: 'Invalid community ID' }, { status: 400 });

    const { data: circle, error: fetchErr } = await supabaseAdmin
      .from('circles')
      .select('id, name, creator_id, member_count, members_count')
      .eq('id', circleId)
      .maybeSingle();

    if (fetchErr || !circle) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    if (circle.creator_id === user.uid) {
      return NextResponse.json({ error: 'As host/creator, you cannot leave your own community.' }, { status: 400 });
    }

    const { error: deleteErr } = await supabaseAdmin
      .from('circle_members')
      .delete()
      .eq('circle_id', circleId)
      .eq('user_id', user.uid);

    if (deleteErr) {
      console.error('[POST /api/circles/[id]/leave] delete error:', deleteErr.message);
      return NextResponse.json({ error: 'Failed to leave community' }, { status: 500 });
    }

    const currentCount = circle.member_count || circle.members_count || 1;
    const newCount = Math.max(1, currentCount - 1);

    await supabaseAdmin
      .from('circles')
      .update({
        member_count: newCount,
        members_count: newCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', circleId);

    return NextResponse.json({
      success: true,
      message: `Left ${circle.name}`
    });
  } catch (err) {
    console.error('[POST /api/circles/[id]/leave]', err.message);
    return NextResponse.json({ error: 'Failed to leave community' }, { status: 500 });
  }
}
