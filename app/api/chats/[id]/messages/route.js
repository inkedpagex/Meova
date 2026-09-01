import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../../lib/getAdminUser';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { sendPush } from '../../../../../lib/sendPushNotification';
import { rateLimit } from '../../../../../lib/rateLimit';

export async function GET(request, { params }) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: chatId } = await params;
    
    // Authorization check: Verify user is a participant
    const { data: chatData, error: chatErr } = await supabaseAdmin
      .from('chats')
      .select('participants')
      .eq('id', chatId)
      .maybeSingle();

    if (chatErr) {
      console.error('[GET /api/chats/[id]/messages chat check]', chatErr.message);
      return NextResponse.json({ messages: [] });
    }

    if (chatData && Array.isArray(chatData.participants) && !chatData.participants.includes(user.uid)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: messages, error } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('[GET /api/chats/[id]/messages]', error.message);
      return NextResponse.json({ messages: [] });
    }

    const formattedMessages = (messages || []).map(msg => ({
      id: msg.id,
      senderId: msg.sender_id,
      text: msg.text,
      status: msg.status || 'sent',
      timestamp: msg.created_at ? new Date(msg.created_at).getTime() : Date.now(),
      created_at: msg.created_at,
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (err) {
    console.error('[GET /api/chats/[id]/messages]', err.message);
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(request, { params }) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: chatId } = await params;
    const { text } = await request.json();
    
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    if (text.length > 2000) {
      return NextResponse.json({ error: 'Message text cannot exceed 2000 characters' }, { status: 400 });
    }

    // Anti-Spam Rate Limit: 20 messages per 10 seconds per user
    const rl = rateLimit(`send_msg:${user.uid}`, { limit: 20, windowMs: 10 * 1000 });
    if (!rl.ok) {
      return NextResponse.json({ error: 'Sending messages too quickly. Please slow down.' }, { status: 429 });
    }

    // Check if chat exists
    let { data: chatData } = await supabaseAdmin
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .maybeSingle();

    if (chatData && Array.isArray(chatData.participants) && !chatData.participants.includes(user.uid)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!chatData) {
      const rawParts = chatId.split('_').filter(Boolean);
      if (!rawParts.includes(user.uid)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const participants = Array.from(new Set([user.uid, ...rawParts]));

      const { data: newChat, error: createErr } = await supabaseAdmin
        .from('chats')
        .insert({
          id: chatId,
          participants,
          participant_names: { [user.uid]: user.full_name || 'User' },
          last_message: text.trim(),
          last_message_at: new Date().toISOString(),
          last_sender_id: user.uid,
          unread_count: { [user.uid]: 0 },
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createErr) {
        console.error('[POST /api/chats/[id]/messages create error]', createErr.message);
        return NextResponse.json({ error: 'Failed to create chat thread' }, { status: 500 });
      }
      chatData = newChat;
    }

    const participants = chatData.participants || [];
    const otherId = participants.find(p => p !== user.uid);
    const nowIso = new Date().toISOString();

    // Insert message into chat_messages table
    const { data: msgData, error: msgErr } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        chat_id: chatId,
        sender_id: user.uid,
        text: text.trim(),
        status: 'sent',
        created_at: nowIso,
      })
      .select()
      .single();

    if (msgErr) {
      console.error('[POST /api/chats/[id]/messages insert error]', msgErr.message);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    // Update chat metadata
    const currentUnread = chatData.unread_count || {};
    const updatedUnread = {
      ...currentUnread,
      [user.uid]: 0,
    };
    if (otherId) {
      updatedUnread[otherId] = (currentUnread[otherId] || 0) + 1;
    }

    await supabaseAdmin
      .from('chats')
      .update({
        last_message: text.trim(),
        last_message_at: nowIso,
        last_sender_id: user.uid,
        unread_count: updatedUnread,
      })
      .eq('id', chatId);

    // Push notification to recipient
    if (otherId) {
      const senderName = user.full_name || user.email?.split('@')[0] || 'Someone';
      const preview = text.trim().length > 60 ? text.trim().slice(0, 60) + '...' : text.trim();
      
      // Insert in-app notification record first (triggers real-time banner in app)
      await supabaseAdmin.from('notifications').insert({
        user_id: otherId,
        sender_id: user.uid,
        title: `New message from ${senderName}`,
        message: preview,
        type: 'message',
        read: false,
        created_at: new Date().toISOString(),
      }).catch(() => {});

      // Also fire background Web Push for locked/background devices
      sendPush(otherId, {
        title: `${senderName} sent a message`,
        body: preview,
        url: `/messages`,
        type: 'message',
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, messageId: msgData.id });
  } catch (err) {
    console.error('[POST /api/chats/[id]/messages]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
