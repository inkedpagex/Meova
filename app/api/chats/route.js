/**
 * GET  /api/chats  — Get current user's chat list (sorted by last_message_at desc)
 * POST /api/chats  — Create or get a DM chat with another user (deducts 5 Sparks for new chats via spendSparks RPC)
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/getAdminUser';
import { supabaseAdmin } from '../../../lib/supabase/admin';
import { spendSparks, creditSparks } from '../../../lib/wallet';

export async function GET() {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: chats, error } = await supabaseAdmin
      .from('chats')
      .select('*')
      .contains('participants', [user.uid])
      .order('last_message_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[GET /api/chats]', error.message);
      return NextResponse.json({ chats: [] });
    }

    return NextResponse.json({ chats: chats || [] });
  } catch (err) {
    console.error('[GET /api/chats]', err.message);
    return NextResponse.json({ chats: [] });
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { otherUserId } = await request.json();
    if (!otherUserId) return NextResponse.json({ error: 'otherUserId required' }, { status: 400 });
    if (otherUserId === user.uid) return NextResponse.json({ error: 'Cannot chat with yourself' }, { status: 400 });

    // Deterministic chat ID
    const sorted = [user.uid, otherUserId].sort();
    const chatId = `${sorted[0]}_${sorted[1]}`;

    // Check if chat already exists
    const { data: existingChat } = await supabaseAdmin
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .maybeSingle();

    if (!existingChat) {
      // Deduct 5 Sparks (Burn) via spendSparks RPC with row-level locking
      const spendRes = await spendSparks(
        user.uid,
        5,
        'Started a new chat (Burn) ⚡',
        'chat_start',
        chatId
      );

      if (!spendRes.ok) {
        return NextResponse.json({ error: spendRes.error || 'Insufficient Sparks. 5 Sparks required to start a new chat.' }, { status: 402 });
      }

      // Fetch other user's profile info
      const { data: otherProfile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', otherUserId)
        .maybeSingle();

      const otherName = otherProfile?.full_name || otherProfile?.email?.split('@')[0] || 'User';
      const otherPhoto = otherProfile?.photo_url || '';

      const chatPayload = {
        id: chatId,
        participants: [user.uid, otherUserId],
        participant_names: {
          [user.uid]: user.full_name || 'User',
          [otherUserId]: otherName,
        },
        participant_photos: {
          [user.uid]: user.photo_url || '',
          [otherUserId]: otherPhoto,
        },
        last_message: '',
        last_message_at: new Date().toISOString(),
        last_sender_id: '',
        unread_count: { [user.uid]: 0, [otherUserId]: 0 },
        created_at: new Date().toISOString(),
      };

      const { error: insertErr } = await supabaseAdmin
        .from('chats')
        .insert(chatPayload);

      if (insertErr) {
        console.error('[POST /api/chats insert error]', insertErr.message);
        // Auto-Rollback: Refund 5 Sparks
        await creditSparks(
          user.uid,
          5,
          'purchased',
          'dispute_refund',
          'Refund for failed chat initiation',
          chatId
        ).catch(err => console.error('[POST /api/chats rollback failed]', err.message));
        return NextResponse.json({ error: 'Failed to initialize chat thread. 5 Sparks refunded.' }, { status: 500 });
      }
    }

    return NextResponse.json({ chatId });
  } catch (err) {
    console.error('[POST /api/chats]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
