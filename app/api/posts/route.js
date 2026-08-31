import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/getAdminUser';
import { rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      console.error('[GET /api/posts]', error.message);
      return NextResponse.json({ posts: [] });
    }
    return NextResponse.json({ posts: data || [] });
  } catch (err) {
    console.error('[GET /api/posts]', err.message);
    return NextResponse.json({ posts: [] });
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
    if (location && location.trim()) metaTags.push(`📍 ${location.trim()}`);
    if (category && category.trim()) metaTags.push(`🏷️ ${category.trim()}`);
    
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

