import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/getAdminUser';
import { rateLimit } from '@/lib/rateLimit';
import { sendPushToUser } from '@/lib/pushNotifications';

export async function POST(request, { params }) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });

    // Anti-Spam: Max 40 likes per minute per user
    const rl = rateLimit(`like_post:${user.uid}`, { limit: 40, windowMs: 60 * 1000 });
    if (!rl.ok) {
      return NextResponse.json({ error: 'Too many like requests. Please slow down.' }, { status: 429 });
    }

    // Check post exists
    const { data: post, error: fetchErr } = await supabaseAdmin
      .from('posts')
      .select('id, user_id, likes_count, author_name')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user already liked this post
    const { data: existingLike } = await supabaseAdmin
      .from('post_likes')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', user.uid)
      .maybeSingle();

    if (existingLike) {
      // ── UNLIKE FLOW ──────────────────────────────────────────────
      await supabaseAdmin
        .from('post_likes')
        .delete()
        .eq('post_id', id)
        .eq('user_id', user.uid);

      const newCount = Math.max(0, (post.likes_count || 1) - 1);
      await supabaseAdmin.from('posts').update({ likes_count: newCount }).eq('id', id);

      return NextResponse.json({ ok: true, liked: false, likes: newCount });
    }

    // ── LIKE FLOW ────────────────────────────────────────────────
    await supabaseAdmin.from('post_likes').insert({ post_id: id, user_id: user.uid });

    const newCount = (post.likes_count || 0) + 1;
    await supabaseAdmin.from('posts').update({ likes_count: newCount }).eq('id', id);

    // Send notification to post author (if not self-like)
    if (post.user_id && post.user_id !== user.uid) {
      const senderName = user.full_name || 'A student';
      const notifTitle = `${senderName} liked your moment`;
      const notifBody = 'Tap to view your post on campus feed.';

      // Deduplication: Check if a like notification from this sender was already sent within the last 15 minutes
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { data: recentNotif } = await supabaseAdmin
        .from('notifications')
        .select('id')
        .eq('user_id', post.user_id)
        .eq('sender_id', user.uid)
        .eq('type', 'like')
        .gte('created_at', fifteenMinutesAgo)
        .maybeSingle();

      if (!recentNotif) {
        // 1. In-app notification row
        supabaseAdmin.from('notifications').insert({
          user_id: post.user_id,
          sender_id: user.uid,
          sender_name: senderName,
          sender_photo: user.photo_url || null,
          title: notifTitle,
          message: notifBody,
          type: 'like',
          read: false,
          url: '/?tab=feed',
          created_at: new Date().toISOString(),
        }).then(() => {}).catch((err) => console.error('[Notif on like error]', err.message));

        // 2. WebPush background notification
        sendPushToUser(post.user_id, {
          title: notifTitle,
          body: notifBody,
          url: '/?tab=feed',
          type: 'like',
          senderPhoto: user.photo_url || null,
          senderName,
        }).catch((err) => console.error('[Push on like error]', err.message));
      }
    }

    return NextResponse.json({ ok: true, liked: true, likes: newCount });
  } catch (err) {
    console.error(`[POST /api/posts/${params.id}/like]`, err.message);
    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
  }
}
