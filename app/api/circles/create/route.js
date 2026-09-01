import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { spendSparks, creditSparks } from '@/lib/wallet';

export async function POST(request) {
  let sparksDeducted = 0;
  let userUid = null;
  const circleId = crypto.randomUUID();

  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    userUid = user.uid;

    const body = await request.json();
    const { name, category, platform, price, description, link, image, initial_members_count } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Community name is required' }, { status: 400 });
    }
    const cleanLink = (link || '').trim();
    if (!cleanLink || (!cleanLink.startsWith('http://') && !cleanLink.startsWith('https://'))) {
      return NextResponse.json({ error: 'A valid group or channel link (WhatsApp/Telegram URL) is required.' }, { status: 400 });
    }

    const priceNum = Math.max(0, parseInt(price, 10) || 0);
    const initialCount = Math.max(1, parseInt(initial_members_count, 10) || 1);
    const isAdmin = user.role === 'admin';
    const creationFee = isAdmin ? 0 : 100;

    // SPAM PREVENTION: Limit max pending requests per user
    if (!isAdmin) {
      const { count } = await supabaseAdmin
        .from('circles')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', user.uid)
        .eq('status', 'pending_approval');

      if ((count || 0) >= 3) {
        return NextResponse.json({
          error: 'You already have 3 pending requests. Please wait for admin approval to prevent spam.'
        }, { status: 400 });
      }
    }

    // 1. Deduct creation fee via atomic spendSparks RPC if applicable
    if (creationFee > 0) {
      const spendRes = await spendSparks(
        user.uid,
        creationFee,
        `Community creation fee: ${name.trim()}`,
        'circle_create_fee',
        circleId
      );

      if (!spendRes.ok) {
        return NextResponse.json({
          error: spendRes.error || `You need ${creationFee} Sparks to request a community.`
        }, { status: 402 });
      }
      sparksDeducted = creationFee;
    }

    const now = new Date().toISOString();

    const newCircleData = {
      id: circleId,
      name: name.trim(),
      category: category || 'General',
      platform: platform || 'WhatsApp',
      price: priceNum,
      is_paid: priceNum > 0,
      description: (description || '').trim(),
      image: image || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&q=80',
      invite_link: cleanLink,
      creator_id: user.uid,
      host_name: user.full_name || user.email || 'Campus Host',
      host_photo: user.photo_url || '',
      status: isAdmin ? 'active' : 'pending_approval',
      member_count: initialCount,
      members_count: initialCount,
      total_sparks_earned: 0,
      created_at: now,
      updated_at: now,
    };

    // 2. Insert circle
    const { error: circleErr } = await supabaseAdmin.from('circles').insert(newCircleData);
    if (circleErr) {
      console.error('[circles/create] insert error, rolling back:', circleErr.message);
      // Auto-Rollback: Refund creation fee
      if (sparksDeducted > 0) {
        await creditSparks(
          user.uid,
          sparksDeducted,
          'purchased',
          'dispute_refund',
          `Refund: Community creation failed (${name.trim()})`,
          circleId
        );
      }
      return NextResponse.json({ error: 'Failed to create community. Sparks refunded.' }, { status: 500 });
    }

    // 3. Auto-add Host as the initial member
    await supabaseAdmin.from('circle_members').insert({
      circle_id: circleId,
      user_id: user.uid,
      role: 'host',
      sparks_paid: 0,
      joined_at: now,
    });

    return NextResponse.json({
      success: true,
      message: 'Community request submitted successfully! Pending admin approval.',
      circle: newCircleData,
    });
  } catch (err) {
    console.error('[POST /api/circles/create]', err.message);
    if (sparksDeducted > 0 && userUid) {
      await creditSparks(userUid, sparksDeducted, 'purchased', 'dispute_refund', 'Refund: Community creation failed', circleId).catch(() => {});
    }
    return NextResponse.json({ error: 'Failed to submit community request' }, { status: 500 });
  }
}
