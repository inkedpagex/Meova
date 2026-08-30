/**
 * PATCH /api/chats/[id]  — Mark chat as read for current user
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/getAdminUser';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

export async function PATCH(request, { params }) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: chatId } = await params;

    const { data: chat, error: fetchErr } = await supabaseAdmin
      .from('chats')
      .select('id, participants, unread_count')
      .eq('id', chatId)
      .maybeSingle();

    if (fetchErr || !chat) return NextResponse.json({ error: 'Chat not found' }, { status: 404 });

    if (!chat.participants?.includes(user.uid)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Reset unread count for this user in the jsonb object
    const updatedUnreadCount = { ...(chat.unread_count || {}), [user.uid]: 0 };

    const { error: updateErr } = await supabaseAdmin
      .from('chats')
      .update({ unread_count: updatedUnreadCount })
      .eq('id', chatId);

    if (updateErr) throw new Error(updateErr.message);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /api/chats/[id]]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
