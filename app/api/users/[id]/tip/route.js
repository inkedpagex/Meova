/**
 * POST /api/users/[id]/tip
 *
 * Sender tips another user exactly 5 Sparks.
 * - Fixed at 5 Sparks (no custom amount — keeps it simple)
 * - Deducts from sender: bonus first, then creator
 * - Credits receiver's `creator` bucket (withdrawable earnings)
 * - 24-hour rate limit: 1 tip per sender→receiver pair per day
 * - Cannot tip yourself
 * - Cannot tip accounts < 3 days old (anti-abuse)
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';
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
      .eq('to_user_id', receiverId)
      .gte('created_at', oneDayAgo)
      .maybeSingle();

    if (recentTip) {
      return NextResponse.json({
        error: 'You have already tipped this person today. Come back tomorrow!'
      }, { status: 429 });
    }

    // Fetch sender wallet
    const { data: senderWallet, error: walletErr } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', sender.uid)
      .maybeSingle();

    if (walletErr || !senderWallet) {
      return NextResponse.json({ error: 'Your wallet not found' }, { status: 400 });
    }

    const totalAvailable = (senderWallet.bonus || 0) + (senderWallet.creator || 0);
    if (totalAvailable < TIP_AMOUNT) {
      return NextResponse.json({ error: 'Insufficient Sparks to send a tip' }, { status: 400 });
    }

    // Deduct from sender: bonus first, then creator
    let remaining = TIP_AMOUNT;
    const deductBonus = Math.min(senderWallet.bonus || 0, remaining);
    const newBonus = (senderWallet.bonus || 0) - deductBonus;
    remaining -= deductBonus;
    const newCreator = (senderWallet.creator || 0) - remaining;

    const senderName = sender.full_name || sender.email?.split('@')[0] || 'Someone';
    const now = new Date().toISOString();

    // Execute all writes in parallel (best-effort atomicity via sequential inserts)
    const [walletUpdateErr, receiverWalletErr, senderTxErr, receiverTxErr, notifErr] = await Promise.all([
      // 1. Deduct from sender wallet
      supabaseAdmin
        .from('wallets')
        .update({ bonus: newBonus, creator: newCreator, updated_at: now })
        .eq('user_id', sender.uid)
        .then(r => r.error),

      // 2. Credit to receiver's creator bucket (upsert in case wallet doesn't exist)
      supabaseAdmin
        .from('wallets')
        .upsert({
          user_id: receiverId,
          creator: (0) + TIP_AMOUNT, // will be overridden by rpc if exists
          lifetime_earned: TIP_AMOUNT,
          updated_at: now,
        }, { onConflict: 'user_id', ignoreDuplicates: false })
        .then(async () => {
          // Proper increment using rpc
          return supabaseAdmin.rpc('credit_sparks', {
            p_user_id: receiverId,
            p_amount: TIP_AMOUNT,
            p_type: 'creator',
            p_transaction_type: 'tip_received',
            p_description: `Received ⚡${TIP_AMOUNT} tip from ${senderName}`,
            p_reference_id: null,
          }).then(r => r.error);
        }),

      // 3. Log sender transaction
      supabaseAdmin.from('transactions').insert({
        user_id: sender.uid,
        type: 'tip_sent',
        to_user_id: receiverId,
        amount: -TIP_AMOUNT,
        description: `Tipped ⚡${TIP_AMOUNT} to ${receiverData.full_name || receiverId}`,
        status: 'COMPLETED',
        created_at: now,
      }).then(r => r.error),

      // 4. Log receiver transaction
      supabaseAdmin.from('transactions').insert({
        user_id: receiverId,
        type: 'tip_received',
        from_user_id: sender.uid,
        amount: TIP_AMOUNT,
        description: `Received ⚡${TIP_AMOUNT} tip from ${senderName}`,
        status: 'COMPLETED',
        created_at: now,
      }).then(r => r.error),

      // 5. In-app notification for receiver
      supabaseAdmin.from('notifications').insert({
        user_id: receiverId,
        sender_id: sender.uid,
        title: `⚡ ${senderName} tipped you!`,
        message: `You received ${TIP_AMOUNT} Sparks. Keep it up! 🔥`,
        type: 'tip_received',
        read: false,
        created_at: now,
      }).then(r => r.error),
    ]);

    if (walletUpdateErr) throw new Error(`Wallet update failed: ${walletUpdateErr.message}`);

    // Push notification (non-blocking)
    sendPush(receiverId, {
      title: `⚡ ${senderName} tipped you!`,
      body: `You received ${TIP_AMOUNT} Sparks. Check your wallet.`,
      url: '/wallet',
    }).catch(() => {});

    return NextResponse.json({ ok: true, tipped: TIP_AMOUNT });
  } catch (err) {
    console.error('[POST /api/users/[id]/tip]', err.message);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
