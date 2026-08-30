import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/getAdminUser';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('posts')
      .select('*')
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(20);

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

    const { photoUrl, caption, location, category } = await request.json();
    if (!photoUrl) return NextResponse.json({ error: 'Photo is required' }, { status: 400 });

    const newPost = {
      user_id: user.uid,
      author_name: user.full_name || 'Campus Peer',
      author_photo: user.photo_url || null,
      author_branch: user.branch || 'GLA Student',
      media_urls: [photoUrl],
      content: caption || '',
      location: location || 'Campus',
      category: category || 'Food & Meets',
      likes_count: 0,
      is_hidden: false,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('posts')
      .insert(newPost)
      .select()
      .single();

    if (error) {
      console.error('[POST /api/posts]', error.message);
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, post: data });
  } catch (err) {
    console.error('[POST /api/posts]', err.message);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}

