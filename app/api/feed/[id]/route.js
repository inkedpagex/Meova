import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/getAdminUser';

export async function DELETE(request, { params }) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const { data: post, error: fetchErr } = await supabaseAdmin
      .from('posts')
      .select('id, user_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.user_id !== user.uid) {
      return NextResponse.json({ error: 'Forbidden. You are not the author.' }, { status: 403 });
    }

    const { error } = await supabaseAdmin.from('posts').delete().eq('id', id);
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, message: 'Post deleted' });
  } catch (err) {
    console.error('[DELETE /api/feed/[id]]', err.message);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
