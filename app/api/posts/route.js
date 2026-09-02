import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/getAdminUser';
import { rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    let user = null;
    try {
      user = await requireAuth();
    } catch {}
    const userId = user?.uid || user?.id;

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = Math.min(30, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));
    const category = searchParams.get('category');

    let query = supabaseAdmin
      .from('posts')
      .select('id, user_id, author_name, author_photo, media_urls, content, likes_count, created_at')
      .order('created_at', { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }
    if (category && category !== 'All') {
      query = query.ilike('content', `%${category}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[GET /api/posts]', error.message);
      return NextResponse.json({ posts: [], hasMore: false, nextCursor: null });
    }

    const rawPosts = data || [];
    const hasMore = rawPosts.length > limit;
    const postsSlice = hasMore ? rawPosts.slice(0, limit) : rawPosts;
    const nextCursor = hasMore && postsSlice.length > 0 ? postsSlice[postsSlice.length - 1].created_at : null;

    // Check which posts the current user has already liked
    let likedSet = new Set();
    if (userId && postsSlice.length > 0) {
      const postIds = postsSlice.map(p => p.id);
      const { data: likedRows } = await supabaseAdmin
        .from('post_likes')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds);

      if (likedRows) {
        likedSet = new Set(likedRows.map(r => r.post_id));
      }
    }

    const posts = postsSlice.map(p => ({
      ...p,
      isLiked: likedSet.has(p.id),
    }));

    return NextResponse.json(
      { posts, hasMore, nextCursor },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err) {
    console.error('[GET /api/posts]', err.message);
    return NextResponse.json({ posts: [], hasMore: false, nextCursor: null });
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Anti-Spam Rate Limit: 5 posts per 5 minutes per user
    const rl = rateLimit(`create_post:${user.uid}`, { limit: 5, windowMs: 5 * 60 * 1000 });
    if (!rl.ok) {
      return NextResponse.json({
        error: `Posting too quickly. Please wait ${rl.retryAfter}s before posting again.`
      }, { status: 429, headers: { 'Retry-After': rl.retryAfter } });
    }

    const { photoUrl, caption, location, category } = await request.json();
    if (!photoUrl || typeof photoUrl !== 'string' || !photoUrl.startsWith('http') || photoUrl.length > 1000) {
      return NextResponse.json({ error: 'Valid photo URL is required (under 1000 chars)' }, { status: 400 });
    }

    let finalContent = (caption || '').trim();
    const metaTags = [];
    if (location && location.trim()) metaTags.push(location.trim());
    if (category && category.trim()) metaTags.push(category.trim());
    
    if (metaTags.length > 0) {
      finalContent = finalContent ? `${finalContent}\n\n${metaTags.join(' · ')}` : metaTags.join(' · ');
    }

    const newPost = {
      user_id: user.uid,
      author_name: user.full_name || 'Campus Peer',
      author_photo: user.photo_url || null,
      media_urls: [photoUrl],
      content: finalContent.slice(0, 1000),
      likes_count: 0,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('posts')
      .insert(newPost)
      .select()
      .single();

    if (error) {
      console.error('[POST /api/posts insert error]:', error.message);
      return NextResponse.json({ error: error.message || 'Failed to create post' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, post: data });
  } catch (err) {
    console.error('[POST /api/posts]', err.message);
    return NextResponse.json({ error: err.message || 'Failed to create post' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');
    if (!postId) return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });

    const { data: post, error: fetchErr } = await supabaseAdmin
      .from('posts')
      .select('id, user_id')
      .eq('id', postId)
      .maybeSingle();

    if (fetchErr || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.user_id !== user.uid) {
      return NextResponse.json({ error: 'Forbidden. You are not the author of this post.' }, { status: 403 });
    }

    const { error: delErr } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', postId);

    if (delErr) {
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'Post deleted successfully' });
  } catch (err) {
    console.error('[DELETE /api/posts]', err.message);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}

