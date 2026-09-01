import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { spendSparks, creditSparks } from '@/lib/wallet';
import { sendPush } from '@/lib/sendPushNotification';

const TIP_AMOUNT = 5;

export async function POST(request, { params }) {
  try {
    const sender = await requireAuth();
    if (!sender) return NextResponse.json({ error: 'Login required' }, { status: 401 });

    const { id: receiverId } = await params;

    // Cannot tip yourself
    if (receiverId === sender.uid) {
      return NextResponse.json({ error: 'You cannot tip yourself.' }, { status: 400 });
    }

    // Receiver must exist
    const { data: receiverData, error: receiverErr } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, created_at')
      .eq('id', receiverId)
      .maybeSingle();

    if (receiverErr || !receiverData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Receiver account must be at least 3 days old
    if (receiverData.created_at) {
      const ageDays = (Date.now() - new Date(receiverData.created_at).getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays < 3) {
        return NextResponse.json({ error: 'Cannot tip brand-new accounts.' }, { status: 403 });
      }
    }

    // 24-hour rate limit: 1 tip per sender→receiver pair per day
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentTip } = await supabaseAdmin
      .from('transactions')
      .select('id')
      .eq('user_id', sender.uid)
      .eq('type', 'tip_sent')
      .eq('reference_id', receiverId)
      .gte('created_at', oneDayAgo)
      .maybeSingle();

    if (recentTip) {
      return NextResponse.json({
        error: 'You have already tipped this person today. Come back tomorrow!'
      }, { status: 429 });
    }

    const senderName = sender.full_name || sender.email?.split('@')[0] || 'Someone';

    // 1. Deduct from sender wallet (bonus -> purchased -> creator)
    const spendRes = await spendSparks(
      sender.uid,
      TIP_AMOUNT,
      `Tipped ${TIP_AMOUNT} Sparks to ${receiverData.full_name || 'Classmate'}`,
      'tip_sent',
      receiverId
    );

    if (!spendRes.ok) {
      return NextResponse.json({ error: spendRes.error || 'Insufficient Sparks to send a tip' }, { status: 400 });
    }

    // 2. Credit to receiver wallet (creator bucket)
    const creditRes = await creditSparks(
      receiverId,
      TIP_AMOUNT,
      'creator',
      'tip_received',
      `Received ${TIP_AMOUNT} Sparks tip from ${senderName}`,
      sender.uid
    );

    if (!creditRes.ok) {
      // Auto-Rollback: Refund sender
      await creditSparks(
        sender.uid,
        TIP_AMOUNT,
        'purchased',
        'dispute_refund',
        'Refund for failed tip transfer',
        receiverId
      ).catch(() => {});
      return NextResponse.json({ error: 'Failed to deliver tip to receiver. Sparks refunded.' }, { status: 500 });
    }

    const now = new Date().toISOString();

    // 3. In-app notification for receiver
    await supabaseAdmin.from('notifications').insert({
      user_id: receiverId,
      sender_id: sender.uid,
      title: `${senderName} tipped you!`,
      message: `You received ${TIP_AMOUNT} Sparks. Keep it up!`,
      type: 'tip_received',
      read: false,
      created_at: now,
    }).catch(() => {});

    // 4. Push notification (non-blocking)
    sendPush(receiverId, {
      title: `${senderName} tipped you!`,
      body: `You received ${TIP_AMOUNT} Sparks. Check your wallet.`,
      url: '/wallet',
    }).catch(() => {});

    return NextResponse.json({ ok: true, tipped: TIP_AMOUNT });
  } catch (err) {
    console.error('[POST /api/users/[id]/tip]', err.message);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
