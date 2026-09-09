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
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '20', 10);
    const limit = Math.min(Math.max(limitParam, 5), 50);
    
    // Fast Authorization check
    const directParts = chatId.split('_');
    const isDirectChat = directParts.length === 2 && directParts.includes(user.uid);

    if (!isDirectChat) {
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
    }

    // Fetch the latest N messages quickly
    const { data: messages, error } = await supabaseAdmin
      .from('chat_messages')
      .select('id, sender_id, text, status, created_at')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[GET /api/chats/[id]/messages]', error.message);
      return NextResponse.json({ messages: [] });
    }

    const rawList = messages || [];
    const formattedMessages = rawList
      .reverse()
      .map(msg => ({
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
    let { data: chatData, error: findErr } = await supabaseAdmin
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .maybeSingle();

    if (findErr) {
      console.error('[POST /api/chats/[id]/messages find chat error]', findErr.message);
    }

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

    const participants = chatData?.participants || [];
    const otherId = participants.find(p => String(p) !== String(user.uid) && String(p) !== String(user.id));
    const nowIso = new Date().toISOString();

    // ── Unverified Tier Messaging Cap: Max 5 distinct recipients per calendar day ──
    const { data: senderProfile } = await supabaseAdmin
      .from('profiles')
      .select('tier, college_id')
      .eq('id', user.uid)
      .maybeSingle();

    const isUnverified = (senderProfile?.tier || 'not_verified') === 'not_verified';

    // Cross-college messaging block: users from different colleges cannot message each other
    if (otherId && senderProfile?.college_id) {
      const { data: receiverProfile } = await supabaseAdmin
        .from('profiles')
        .select('college_id')
        .eq('id', otherId)
        .maybeSingle();

      if (receiverProfile?.college_id && senderProfile.college_id !== receiverProfile.college_id) {
        return NextResponse.json(
          { error: 'Messaging is only available between students from the same college.' },
          { status: 403 }
        );
      }
    }

    if (isUnverified && otherId) {
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      const todayStartIso = todayStart.toISOString();

      const { data: todayMessages } = await supabaseAdmin
        .from('chat_messages')
        .select('chat_id')
        .eq('sender_id', user.uid)
        .gte('created_at', todayStartIso);

      const distinctRecipients = new Set();
      const chatIds = Array.from(new Set(todayMessages?.map(m => m.chat_id) || []));

      // Resolve recipient IDs from today's chats
      for (const cId of chatIds) {
        if (cId === chatId) {
          distinctRecipients.add(otherId);
          continue;
        }
        const parts = cId.split('_');
        if (parts.length === 2 && parts.includes(user.uid)) {
          const rec = parts.find(p => p !== user.uid);
          if (rec) distinctRecipients.add(rec);
        }
      }

      // If other chats weren't simple direct IDs, query their participants
      const unresolvedChatIds = chatIds.filter(cId => !cId.includes('_') && cId !== chatId);
      if (unresolvedChatIds.length > 0) {
        const { data: moreChats } = await supabaseAdmin
          .from('chats')
          .select('participants')
          .in('id', unresolvedChatIds);
        
        moreChats?.forEach(c => {
          c.participants?.forEach(p => {
            if (p !== user.uid) distinctRecipients.add(p);
          });
        });
      }

      if (!distinctRecipients.has(otherId) && distinctRecipients.size >= 5) {
        return NextResponse.json(
          { error: 'Daily new recipient limit reached (5 distinct peers/day). Verify your account to start unlimited conversations.' },
          { status: 429 }
        );
      }
    }

    const currentUnread = chatData?.unread_count || {};
    const updatedUnread = {
      ...currentUnread,
      [user.uid]: 0,
    };
    if (otherId) {
      updatedUnread[otherId] = (currentUnread[otherId] || 0) + 1;
    }

    // Parallelize message insert and chat update for instant response
    const [msgRes] = await Promise.all([
      supabaseAdmin
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          sender_id: user.uid,
          text: text.trim(),
          status: 'sent',
          created_at: nowIso,
        })
        .select()
        .single(),
      supabaseAdmin
        .from('chats')
        .update({
          last_message: text.trim(),
          last_message_at: nowIso,
          last_sender_id: user.uid,
          unread_count: updatedUnread,
        })
        .eq('id', chatId)
    ]);

    if (msgRes.error) {
      console.error('[POST /api/chats/[id]/messages insert error]', msgRes.error.message);
      return NextResponse.json({ error: 'Failed to send message: ' + msgRes.error.message }, { status: 500 });
    }

    // Background push notification to recipient (non-blocking)
    if (otherId) {
      const senderName = user.full_name || user.email?.split('@')[0] || 'Someone';
      const senderPhoto = user.photo_url || '';
      const preview = text.trim().length > 60 ? text.trim().slice(0, 60) + '...' : text.trim();

      // 1. Broadcast to active chat room for instant real-time message delivery
      try {
        const chatRoomChan = supabaseAdmin.channel(`chat-messages-${chatId}`);
        await chatRoomChan.send({
          type: 'broadcast',
          event: 'new-message',
          payload: {
            id: msgRes.data?.id || `msg_${Date.now()}`,
            senderId: user.uid,
            text: text.trim(),
            status: 'sent',
            timestamp: Date.now(),
            created_at: nowIso,
          },
        });
        supabaseAdmin.removeChannel(chatRoomChan);
      } catch (chatBcErr) {
        console.warn('[POST /api/chats/[id]/messages room broadcast error]', chatBcErr.message);
      }

      // 2. Dispatch in-app notification banner & push to recipient
      sendPush(otherId, {
        title: `${senderName}`,
        body: preview,
        url: `/messages`,
        type: 'message',
        photo: senderPhoto,
        senderPhoto,
        senderName,
        tag: `chat_${chatId}`,
      }).catch(pushErr => console.warn('[POST /api/chats/[id]/messages push error]', pushErr.message));
    }

    return NextResponse.json({ ok: true, messageId: msgRes.data?.id });
  } catch (err) {
    console.error('[POST /api/chats/[id]/messages]', err.message);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
