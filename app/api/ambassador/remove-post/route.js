import { NextResponse } from 'next/server';
import { requireAmbassador } from '../dashboard/route';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/ambassador/remove-post
 * Tier 2 (full) ambassador hides a post from their college's feed.
 * HARD RULE: Post author must be from ambassador's college.
 */
export async function POST(request) {
  try {
    const { user: ambassador, error: authError } = await requireAmbassador('full');
    if (authError) return authError;

    const { post_id, reason } = await request.json();

    if (!post_id) {
      return NextResponse.json({ error: 'post_id is required' }, { status: 400 });
    }

    // Fetch post with author
    const { data: post, error: fetchErr } = await supabaseAdmin
      .from('posts')
      .select('id, user_id, content, college_id')
      .eq('id', post_id)
      .maybeSingle();

    if (fetchErr || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Verify post author is from ambassador's college
    // Check via post.college_id or fetch the author's profile
    let authorCollegeId = post.college_id;

    if (!authorCollegeId) {
      const { data: authorProfile } = await supabaseAdmin
        .from('profiles')
        .select('college_id')
        .eq('id', post.user_id)
        .maybeSingle();
      authorCollegeId = authorProfile?.college_id;
    }

    if (!ambassador.isAdmin && authorCollegeId !== ambassador.college_id) {
      return NextResponse.json(
        { error: 'You can only remove posts from users of your own college.' },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();

    // Hide the post
    const { error: updateErr } = await supabaseAdmin
      .from('posts')
      .update({
        is_hidden: true,
        moderated_by: ambassador.id,
        moderated_reason: reason?.trim() || 'Removed by Campus Ambassador',
      })
      .eq('id', post_id);

    if (updateErr) {
      console.error('[POST /api/ambassador/remove-post]', updateErr.message);
      return NextResponse.json({ error: 'Failed to hide post' }, { status: 500 });
    }

    // Audit log
    await supabaseAdmin.from('ambassador_audit_logs').insert({
      ambassador_id: ambassador.id,
      action: 'remove_post',
      target_id: post_id,
      target_type: 'post',
      college_id: ambassador.college_id,
      note: reason?.trim() || null,
      created_at: now,
    });

    return NextResponse.json({ ok: true, message: 'Post has been removed from the feed.' });
  } catch (err) {
    console.error('[POST /api/ambassador/remove-post]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
