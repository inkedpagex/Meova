import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/getAdminUser';
import { rateLimit } from '@/lib/rateLimit';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Post ID required' }, { status: 400 });

    // 1. Try querying post_comments table
    try {
      const { data: tableComments, error: tblErr } = await supabaseAdmin
        .from('post_comments')
        .select('*')
        .eq('post_id', id)
        .order('created_at', { ascending: true });

      if (!tblErr && tableComments) {
        return NextResponse.json({ success: true, comments: tableComments });
      }
    } catch {
      // fallback below
    }

    // 2. Resilient fallback: query from audit_logs
    const { data: logs, error: logErr } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('action', 'POST_COMMENT')
      .eq('target_id', id)
      .order('created_at', { ascending: true });

    if (logErr) {
      return NextResponse.json({ success: true, comments: [] });
    }

    const comments = (logs || []).map((l) => ({
      id: l.id,
      post_id: id,
      user_id: l.details?.user_id || l.admin_uid || '',
      author_name: l.details?.author_name || 'Campus Student',
      author_photo: l.details?.author_photo || '',
      content: l.details?.content || l.message || '',
      created_at: l.details?.created_at || l.created_at,
    }));

    return NextResponse.json({ success: true, comments });
  } catch (err) {
    console.error('[GET /api/posts/[id]/comments]', err);
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized. Please login to comment.' }, { status: 401 });

    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Post ID required' }, { status: 400 });

    // Rate Limit: 30 comments / min per user
    const rl = rateLimit(`comment:${user.uid}`, { limit: 30, windowMs: 60 * 1000 });
    if (!rl.ok) {
      return NextResponse.json({ error: 'Slow down. Too many comments.' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const content = (body.content || '').trim();

    if (!content || content.length < 1) {
      return NextResponse.json({ error: 'Comment cannot be empty.' }, { status: 400 });
    }
    if (content.length > 500) {
      return NextResponse.json({ error: 'Comment must be under 500 characters.' }, { status: 400 });
    }

    // Fetch user profile for display
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, photo_url, username')
      .eq('id', user.uid)
      .maybeSingle();

    const authorName = profile?.full_name || user.email?.split('@')?.[0] || 'Campus Student';
    const authorPhoto = profile?.photo_url || '';
    const now = new Date().toISOString();

    let createdComment = null;

    // 1. Try post_comments table
    try {
      const { data: tblComment, error: inErr } = await supabaseAdmin
        .from('post_comments')
        .insert({
          post_id: id,
          user_id: user.uid,
          author_name: authorName,
          author_photo: authorPhoto,
          content,
          created_at: now,
        })
        .select()
        .single();

      if (!inErr && tblComment) {
        createdComment = tblComment;
      }
    } catch {
      // fallback below
    }

    // 2. Always persist to audit_logs
    const { data: logEntry } = await supabaseAdmin
      .from('audit_logs')
      .insert({
        action: 'POST_COMMENT',
        target_id: id,
        admin_uid: user.uid,
        message: content.slice(0, 150),
        details: {
          user_id: user.uid,
          author_name: authorName,
          author_photo: authorPhoto,
          content,
          created_at: now,
        },
      })
      .select()
      .single();

    if (!createdComment) {
      createdComment = {
        id: logEntry?.id || String(Date.now()),
        post_id: id,
        user_id: user.uid,
        author_name: authorName,
        author_photo: authorPhoto,
        content,
        created_at: now,
      };
    }

    return NextResponse.json({ success: true, comment: createdComment });
  } catch (err) {
    console.error('[POST /api/posts/[id]/comments]', err);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}
