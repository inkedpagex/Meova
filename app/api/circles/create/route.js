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
    await circleRef.set(newCircleData);

    // Store private invite link in secure collection `circle_links` (never exposed in public listings)
    await adminDb.collection('circle_links').doc(circleId).set({
      circle_id: circleId,
      invite_link: link.trim(),
      host_id: user.uid,
      updated_at: new Date().toISOString(),
    });

    // Auto-add Host as the initial member
    await adminDb.collection('circle_members').doc(`${circleId}_${user.uid}`).set({
      circle_id: circleId,
      user_id: user.uid,
      role: 'host',
      sparks_paid: 0,
      joined_at: new Date().toISOString(),
    });

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
