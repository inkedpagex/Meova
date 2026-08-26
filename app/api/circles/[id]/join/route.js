/**
 * POST /api/circles/[id]/join - Securely join a community, deduct Sparks, credit 100% to Host, and unlock invite link
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request, { params }) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!adminDb) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

    const { id: circleId } = await params;
    if (!circleId) return NextResponse.json({ error: 'Invalid community ID' }, { status: 400 });

    const circleRef = adminDb.collection('circles').doc(circleId);
    const circleDoc = await circleRef.get();
    if (!circleDoc.exists) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    const circle = circleDoc.data();
    const isHost = circle.host_id === user.uid;

    if (circle.status !== 'active' && !isHost) {
      return NextResponse.json({ error: 'This community is currently pending admin approval.' }, { status: 403 });
    }

    const memberDocRef = adminDb.collection('circle_members').doc(`${circleId}_${user.uid}`);
    const memberDoc = await memberDocRef.get();
    const isAlreadyMember = memberDoc.exists;

    // Fetch secret invite link from private `circle_links` collection
    const linkDoc = await adminDb.collection('circle_links').doc(circleId).get();
    const secretLink = linkDoc.exists ? linkDoc.data().invite_link : (circle.whatsapp_link || 'https://chat.whatsapp.com/');

    // If already joined or is host, return invite link directly
    if (isAlreadyMember || isHost) {
      return NextResponse.json({
        success: true,
        alreadyJoined: true,
        invite_link: secretLink,
        message: 'You are already a member of this community.'
      });
    }

    const price = circle.price || 0;

    // Handle Paid Community Entry
    if (price > 0) {
      const buyerWalletRef = adminDb.collection('wallets').doc(user.uid);
      const hostWalletRef = adminDb.collection('wallets').doc(circle.host_id);

      const buyerWalletDoc = await buyerWalletRef.get();
      const buyerWallet = buyerWalletDoc.exists ? buyerWalletDoc.data() : { purchased: 0, bonus: 0, creator: 0 };
      const currentBalance = (buyerWallet.purchased || 0) + (buyerWallet.bonus || 0) + (buyerWallet.creator || 0);

      if (currentBalance < price) {
        return NextResponse.json({
          error: `Insufficient Sparks. You need ${price} Sparks to join. Your balance: ${currentBalance} Sparks.`,
          requiredSparks: price,
          currentSparks: currentBalance,
        }, { status: 402 });
      }

      // Deduct from buyer: prioritize bonus -> purchased -> creator
      let remainingToDeduct = price;
      let newBonus = buyerWallet.bonus || 0;
      let newPurchased = buyerWallet.purchased || 0;
      let newCreator = buyerWallet.creator || 0;

      if (newBonus >= remainingToDeduct) {
        newBonus -= remainingToDeduct;
        remainingToDeduct = 0;
      } else {
        remainingToDeduct -= newBonus;
        newBonus = 0;
      }

      if (remainingToDeduct > 0) {
        if (newPurchased >= remainingToDeduct) {
          newPurchased -= remainingToDeduct;
          remainingToDeduct = 0;
        } else {
          remainingToDeduct -= newPurchased;
          newPurchased = 0;
        }
      }

      if (remainingToDeduct > 0) {
        newCreator = Math.max(0, newCreator - remainingToDeduct);
      }

      // Atomic Transaction / Batch
      const batch = adminDb.batch();

      // 1. Update Buyer Wallet
      batch.set(buyerWalletRef, {
        userId: user.uid,
        email: user.email || '',
        purchased: newPurchased,
        bonus: newBonus,
        creator: newCreator,
        updated_at: new Date().toISOString(),
      }, { merge: true });

      // 2. Credit 100% Sparks to Host's Wallet (creator balance)
      batch.set(hostWalletRef, {
        userId: circle.host_id,
        creator: FieldValue.increment(price),
        updated_at: new Date().toISOString(),
      }, { merge: true });

      // 3. Log Buyer Debit Transaction
      const buyerTxRef = adminDb.collection('wallet_transactions').doc();
      batch.set(buyerTxRef, {
        userId: user.uid,
        amount: -price,
        type: 'community_join',
        circleId,
        circleName: circle.name,
        created_at: new Date().toISOString(),
      });

      // 4. Log Host Credit Transaction
      const hostTxRef = adminDb.collection('wallet_transactions').doc();
      batch.set(hostTxRef, {
        userId: circle.host_id,
        amount: price,
        type: 'community_earning',
        circleId,
        circleName: circle.name,
        buyerId: user.uid,
        buyerName: user.name || user.email || 'Campus Member',
        created_at: new Date().toISOString(),
      });

      // 5. Add Member Record
      batch.set(memberDocRef, {
        circle_id: circleId,
        user_id: user.uid,
        role: 'member',
        sparks_paid: price,
        joined_at: new Date().toISOString(),
      });

      // 6. Increment Circle Stats
      batch.update(circleRef, {
        member_count: FieldValue.increment(1),
        total_sparks_earned: FieldValue.increment(price),
        updated_at: new Date().toISOString(),
      });

      await batch.commit();
    } else {
      // Free Community Join
      await memberDocRef.set({
        circle_id: circleId,
        user_id: user.uid,
        role: 'member',
        sparks_paid: 0,
        joined_at: new Date().toISOString(),
      });

      await circleRef.update({
        member_count: FieldValue.increment(1),
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      alreadyJoined: false,
      invite_link: secretLink,
      sparksDeducted: price,
      message: `Successfully joined ${circle.name}!`
    });
  } catch (err) {
    console.error('[POST /api/circles/[id]/join]', err.message);
    return NextResponse.json({ error: 'Failed to join community' }, { status: 500 });
  }
}

