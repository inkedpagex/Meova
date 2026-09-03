import { NextResponse } from 'next/server';
import { requireHostOrAdmin } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request) {
  const host = await requireHostOrAdmin();
  if (!host) {
    return NextResponse.json({ error: 'Unauthorized. Host privileges required.' }, { status: 403 });
  }

  try {
    const { postId, action = 'delete', reason = 'Violates campus guidelines' } = await request.json();

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }

    if (!reason || reason.trim().length < 3) {
      return NextResponse.json({ error: 'Please provide a valid moderation reason (at least 3 characters).' }, { status: 400 });
    }

    // 1. Fetch target post and author profile
    const { data: post, error: postErr } = await supabaseAdmin
      .from('posts')
      .select('id, user_id, content, media_urls, category')
      .eq('id', postId)
      .maybeSingle();

    if (postErr || !post) {
      return NextResponse.json({ error: 'Post not found or already removed.' }, { status: 404 });
    }

    // 2. Fetch author profile to verify security hierarchy
    const { data: authorProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, role, full_name, email')
      .eq('id', post.user_id)
      .maybeSingle();

    const targetRole = authorProfile?.role || 'user';
    const isTargetAdmin = targetRole === 'admin';
    const isTargetHost = targetRole === 'verified_host' || targetRole === 'campus_lead';

    // SECURITY GUARDRAIL: Host cannot moderate Admin or other Hosts
    if (host.role !== 'admin' && (isTargetAdmin || (isTargetHost && post.user_id !== host.uid))) {
      return NextResponse.json({
        error: 'Security Policy: Hosts cannot moderate posts created by Administrators or other Campus Hosts.'
      }, { status: 403 });
    }

    const now = new Date().toISOString();

    // 3. Perform moderation (Delete post & its likes)
    if (action === 'hide') {
      // Try hiding post if column exists, fallback to soft or direct
      const { error: hideErr } = await supabaseAdmin
        .from('posts')
        .update({
          is_hidden: true,
          moderated_by: host.uid,
          moderated_reason: reason.trim(),
        })
        .eq('id', postId);

      if (hideErr) {
        // Fallback to delete if column does not exist yet
        await supabaseAdmin.from('post_likes').delete().eq('post_id', postId);
        await supabaseAdmin.from('posts').delete().eq('id', postId);
      }
    } else {
      // Default: Direct Delete
      await supabaseAdmin.from('post_likes').delete().eq('post_id', postId);
      const { error: delErr } = await supabaseAdmin
        .from('posts')
        .delete()
        .eq('id', postId);

      if (delErr) {
        throw new Error(delErr.message);
      }
    }

    // 4. Log in audit_logs (guaranteed table)
    try {
      await supabaseAdmin.from('audit_logs').insert({
        admin_id: host.uid,
        action: 'HOST_DELETE_POST',
        target_uid: post.user_id,
        old_value: {
          postId,
          authorName: authorProfile?.full_name || 'Student',
          contentSnippet: post.content?.slice(0, 100) || '',
          category: post.category || 'General',
        },
        new_value: {
          moderatedBy: host.uid,
          hostRole: host.role,
          reason: reason.trim(),
        },
        timestamp: now,
      });
    } catch (err) {
      console.warn('[Host Moderate Post] audit_logs warning:', err?.message);
    }

    // 5. Try logging in host_moderation_logs (if migrated)
    try {
      await supabaseAdmin.from('host_moderation_logs').insert({
        host_id: host.uid,
        action_type: action === 'hide' ? 'HIDE_POST' : 'DELETE_POST',
        target_type: 'post',
        target_id: postId,
        target_user_id: post.user_id,
        reason: reason.trim(),
        metadata: {
          authorName: authorProfile?.full_name || 'Student',
          content: post.content?.slice(0, 150) || '',
        },
        created_at: now,
      });
    } catch (e) {
      // Table might not be migrated yet, fallback already logged in audit_logs
    }

    return NextResponse.json({
      ok: true,
      message: `Post deleted successfully by Host (${host.full_name || 'Campus Warden'}). Reason: ${reason.trim()}`
    });
  } catch (error) {
    console.error('[POST /api/host/moderate-post]', error);
    return NextResponse.json({ error: error.message || 'Failed to moderate post' }, { status: 500 });
  }
}
