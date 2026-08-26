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
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendPush } from '@/lib/sendPushNotification';

const TIP_AMOUNT = 5;

export async function POST(request, { params }) {
  try {
    const sender = await requireAuth();
    if (!sender) return NextResponse.json({ error: 'Login required' }, { status: 401 });
    if (!adminDb) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

    const { id: receiverId } = await params;

    // Cannot tip yourself
    if (receiverId === sender.uid) {
      return NextResponse.json({ error: 'You cannot tip yourself.' }, { status: 400 });
    }

    // Receiver must exist
    const receiverDoc = await adminDb.collection('users').doc(receiverId).get();
    if (!receiverDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const receiverData = receiverDoc.data();

    // Receiver account must be at least 3 days old
    if (receiverData.created_at) {
      const ageDays = (Date.now() - new Date(receiverData.created_at).getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays < 3) {
        return NextResponse.json({ error: 'Cannot tip brand-new accounts.' }, { status: 403 });
      }
    }

    // 24-hour rate limit: 1 tip per sender→receiver pair per day
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentTipSnap = await adminDb
      .collection('transactions')
      .where('userId', '==', sender.uid)
      .where('type', '==', 'tip_sent')
      .where('toUserId', '==', receiverId)
      .where('created_at', '>=', oneDayAgo)
      .limit(1)
      .get();

    if (!recentTipSnap.empty) {
      return NextResponse.json({
        error: 'You have already tipped this person today. Come back tomorrow!'
      }, { status: 429 });
    }

    // Execute in transaction
    let senderName = '';
    await adminDb.runTransaction(async (tx) => {
      const senderWalletRef = adminDb.collection('wallets').doc(sender.uid);
      const receiverWalletRef = adminDb.collection('wallets').doc(receiverId);

      const [senderWalletSnap, receiverWalletSnap] = await Promise.all([
        tx.get(senderWalletRef),
        tx.get(receiverWalletRef),
      ]);

      if (!senderWalletSnap.exists) throw new Error('Your wallet not found');
      const sw = senderWalletSnap.data();

      // Check sender has enough: bonus first, then creator
      const totalAvailable = (sw.bonus || 0) + (sw.creator || 0);
      if (totalAvailable < TIP_AMOUNT) {
        throw new Error('Insufficient Sparks to send a tip');
      }

      // Deduct from sender: bonus first, then creator
      let remaining = TIP_AMOUNT;
      const senderUpdates = {};
      const deductBonus = Math.min(sw.bonus || 0, remaining);
      senderUpdates.bonus = (sw.bonus || 0) - deductBonus;
      remaining -= deductBonus;
      if (remaining > 0) {
        senderUpdates.creator = (sw.creator || 0) - remaining;
      }
      senderUpdates.updated_at = new Date().toISOString();
      tx.update(senderWalletRef, senderUpdates);

      // Credit to receiver's creator bucket (they can withdraw it)
      if (receiverWalletSnap.exists) {
        tx.update(receiverWalletRef, {
          creator: FieldValue.increment(TIP_AMOUNT),
          lifetime_earned: FieldValue.increment(TIP_AMOUNT),
          updated_at: new Date().toISOString(),
        });
      } else {
        tx.set(receiverWalletRef, {
          userId: receiverId,
          purchased: 0,
          bonus: 0,
          creator: TIP_AMOUNT,
          lifetime_earned: TIP_AMOUNT,
          updated_at: new Date().toISOString(),
        });
      }

      const now = new Date().toISOString();
      senderName = sender.name || sender.email?.split('@')[0] || 'Someone';

      // Log: sender (tip_sent)
      tx.set(adminDb.collection('transactions').doc(), {
        userId: sender.uid,
        type: 'tip_sent',
        toUserId: receiverId,
        amount: -TIP_AMOUNT,
        description: `Tipped ⚡${TIP_AMOUNT} to ${receiverData.full_name || receiverId}`,
        status: 'COMPLETED',
        created_at: now,
      });

      // Log: receiver (tip_received)
      tx.set(adminDb.collection('transactions').doc(), {
        userId: receiverId,
        type: 'tip_received',
        fromUserId: sender.uid,
        amount: TIP_AMOUNT,
        description: `Received ⚡${TIP_AMOUNT} tip from ${senderName}`,
        status: 'COMPLETED',
        created_at: now,
      });

      // In-app notification for receiver
      tx.set(adminDb.collection('users').doc(receiverId).collection('notifications').doc(), {
        title: `⚡ ${senderName} tipped you!`,
        body: `You received ${TIP_AMOUNT} Sparks. Keep it up! 🔥`,
        type: 'tip_received',
        fromUserId: sender.uid,
        read: false,
        created_at: FieldValue.serverTimestamp(),
      });
    });

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

