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

    // Anti-Spam: Max 60 likes per minute per user
    const rl = rateLimit(`like_post:${user.uid}`, { limit: 60, windowMs: 60 * 1000 });
    if (!rl.ok) {
      return NextResponse.json({ error: 'Too many like requests. Please slow down.' }, { status: 429 });
    }

    // Parallel fetch: check post existence and current user's like state in 1 network roundtrip
    const [postRes, existingLikeRes] = await Promise.all([
      supabaseAdmin
        .from('posts')
        .select('id, user_id, likes_count, author_name')
        .eq('id', id)
        .maybeSingle(),
      supabaseAdmin
        .from('post_likes')
        .select('id')
        .eq('post_id', id)
        .eq('user_id', user.uid)
        .maybeSingle(),
    ]);

    const post = postRes.data;
    if (postRes.error || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const existingLike = existingLikeRes.data;

    if (existingLike) {
      // ── UNLIKE FLOW (Instant & Parallel) ─────────────────────────
      const newCount = Math.max(0, (post.likes_count || 1) - 1);

      // Run DB updates concurrently
      Promise.all([
        supabaseAdmin.from('post_likes').delete().eq('post_id', id).eq('user_id', user.uid),
        supabaseAdmin.from('posts').update({ likes_count: newCount }).eq('id', id),
      ]).catch((err) => console.error('[Unlike DB error]', err.message));

      return NextResponse.json({ ok: true, liked: false, likes: newCount });
    }

    // ── LIKE FLOW (Instant & Parallel) ───────────────────────────
    const newCount = (post.likes_count || 0) + 1;

    // Run DB updates concurrently
    Promise.all([
      supabaseAdmin.from('post_likes').insert({ post_id: id, user_id: user.uid }),
      supabaseAdmin.from('posts').update({ likes_count: newCount }).eq('id', id),
    ]).catch((err) => console.error('[Like DB error]', err.message));

    // Async Background Notification (Does NOT block HTTP response)
    if (post.user_id && post.user_id !== user.uid) {
      (async () => {
        try {
          const senderName = user.full_name || 'A student';
          const notifTitle = `${senderName} liked your moment`;
          const notifBody = 'Tap to view your post on campus feed.';

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
            // In-app notification
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
            }).catch(() => {});

            // WebPush
            sendPushToUser(post.user_id, {
              title: notifTitle,
              body: notifBody,
              url: '/?tab=feed',
              type: 'like',
              senderPhoto: user.photo_url || null,
              senderName,
            }).catch(() => {});
          }
        } catch (e) {
          console.error('[Async Like Notif Error]', e.message);
        }
      })();
    }

    // Instant return < 30ms
    return NextResponse.json({ ok: true, liked: true, likes: newCount });
  } catch (err) {
    console.error(`[POST /api/posts/${params.id}/like]`, err.message);
    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
  }
}
