import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/getAdminUser';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(request, { params }) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });

    // Anti-Spam: Max 30 likes per minute per user
    const rl = rateLimit(`like_post:${user.uid}`, { limit: 30, windowMs: 60 * 1000 });
    if (!rl.ok) {
      return NextResponse.json({ error: 'Too many like requests. Please slow down.' }, { status: 429 });
    }

    // Check post exists
    const { data: post, error: fetchErr } = await supabaseAdmin
      .from('posts')
      .select('id, likes_count')
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
      return NextResponse.json({ ok: true, message: 'Already liked', likes: post.likes_count });
    }

    // Insert like record
    await supabaseAdmin.from('post_likes').insert({ post_id: id, user_id: user.uid });

    // Increment likes_count
    const newCount = (post.likes_count || 0) + 1;
    await supabaseAdmin.from('posts').update({ likes_count: newCount }).eq('id', id);

    return NextResponse.json({ ok: true, message: 'Post liked successfully', likes: newCount });
  } catch (err) {
    console.error(`[POST /api/posts/${params.id}/like]`, err.message);
    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
  }
}
