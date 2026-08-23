/**
 * POST /api/circles/create - Submit a new Host Community Request for Admin Approval
 */
import { NextResponse } from 'next/server';
import { getUserWithRole } from '@/lib/getAdminUser';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request) {
  try {
    const user = await getUserWithRole();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!adminDb) return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });

    const body = await request.json();
    const { name, category, platform, price, description, link, image } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Community name is required' }, { status: 400 });
    }
    if (!link || !link.trim()) {
      return NextResponse.json({ error: 'Valid channel link is required' }, { status: 400 });
    }

    const priceNum = Math.max(0, parseInt(price, 10) || 0);

    const isAdmin = user.role === 'admin';
    const creationFee = isAdmin ? 0 : 100;
    
    // SPAM PREVENTION: Limit max pending requests per user
    if (!isAdmin) {
      const pendingSnap = await adminDb.collection('circles')
        .where('host_id', '==', user.uid)
        .where('status', '==', 'pending_approval')
        .get();
      
      if (pendingSnap.size >= 3) {
        return NextResponse.json({ error: 'You already have 3 pending requests. Please wait for admin approval to prevent spam.' }, { status: 400 });
      }
    }
    
    // Check wallet balance
    const walletRef = adminDb.collection('wallets').doc(user.uid);
    const walletDoc = await walletRef.get();
    let currentSparks = 0;
    let walletData = {};
    if (walletDoc.exists) {
      walletData = walletDoc.data();
      currentSparks = (walletData.purchased || 0) + (walletData.bonus || 0) + (walletData.creator || 0);
    }

    if (currentSparks < creationFee) {
      return NextResponse.json({ error: 'Insufficient Sparks to create a community' }, { status: 400 });
    }

    const batch = adminDb.batch();

    // Create a new document in `circles` collection
    const circleRef = adminDb.collection('circles').doc();
    const circleId = circleRef.id;

    const newCircleData = {
      id: circleId,
      name: name.trim(),
      category: category || 'General',
      platform: platform || 'WhatsApp',
      price: priceNum,
      isPaid: priceNum > 0,
      description: (description || '').trim(),
      image: image || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&q=80',
      host_id: user.uid,
      host_name: user.name || user.email || 'Campus Host',
      host_photo: user.picture || '',
      status: 'pending_approval',
      member_count: 1,
      total_sparks_earned: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Store public metadata in `circles`
    batch.set(circleRef, newCircleData);

    // Store private invite link in secure collection `circle_links` (never exposed in public listings)
    const linkRef = adminDb.collection('circle_links').doc(circleId);
    batch.set(linkRef, {
      circle_id: circleId,
      invite_link: link.trim(),
      host_id: user.uid,
      updated_at: new Date().toISOString(),
    });

    // Auto-add Host as the initial member
    const memberRef = adminDb.collection('circle_members').doc(`${circleId}_${user.uid}`);
    batch.set(memberRef, {
      circle_id: circleId,
      user_id: user.uid,
      role: 'host',
      sparks_paid: 0,
      joined_at: new Date().toISOString(),
    });

    // Deduct Sparks if applicable
    if (creationFee > 0) {
      // Deduct primarily from purchased, then bonus, then creator
      let remainingToDeduct = creationFee;
      let newPurchased = walletData.purchased || 0;
      let newBonus = walletData.bonus || 0;
      let newCreator = walletData.creator || 0;

      if (newPurchased >= remainingToDeduct) {
        newPurchased -= remainingToDeduct;
        remainingToDeduct = 0;
      } else {
        remainingToDeduct -= newPurchased;
        newPurchased = 0;
        if (newBonus >= remainingToDeduct) {
          newBonus -= remainingToDeduct;
          remainingToDeduct = 0;
        } else {
          remainingToDeduct -= newBonus;
          newBonus = 0;
          newCreator -= remainingToDeduct;
        }
      }

      batch.update(walletRef, {
        purchased: newPurchased,
        bonus: newBonus,
        creator: newCreator,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Log transaction
      const txRef = adminDb.collection('transactions').doc();
      batch.set(txRef, {
        id: txRef.id,
        user_id: user.uid,
        amount: -creationFee,
        type: 'community_creation_fee',
        description: `Paid 100 Sparks to request community: ${name.trim()}`,
        created_at: new Date().toISOString(),
      });
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: 'Community request submitted successfully! Pending admin approval.',
      circle: newCircleData,
    });
  } catch (err) {
    console.error('[POST /api/circles/create]', err.message);
    return NextResponse.json({ error: 'Failed to submit community request' }, { status: 500 });
  }
}
