/**
 * POST /api/circles/create - Submit a new Host Community Request for Admin Approval
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

    // Check wallet balance
    const { data: walletData } = await supabaseAdmin
      .from('wallets')
      .select('purchased, bonus, creator')
      .eq('user_id', user.uid)
      .maybeSingle();

    const currentSparks = walletData
      ? (walletData.purchased || 0) + (walletData.bonus || 0) + (walletData.creator || 0)
      : 0;

    if (currentSparks < creationFee) {
      return NextResponse.json({ error: 'Insufficient Sparks to create a community' }, { status: 400 });
    }

    const circleId = crypto.randomUUID();
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
      invite_link: link.trim(),
      creator_id: user.uid,
      host_name: user.full_name || user.email || 'Campus Host',
      host_photo: user.photo_url || '',
      status: 'pending_approval',
      member_count: 1,
      total_sparks_earned: 0,
      created_at: now,
      updated_at: now,
    };

    // Insert circle
    const { error: circleErr } = await supabaseAdmin.from('circles').insert(newCircleData);
    if (circleErr) throw new Error(circleErr.message);

    // Auto-add Host as the initial member
    const { error: memberErr } = await supabaseAdmin.from('circle_members').insert({
      circle_id: circleId,
      user_id: user.uid,
      role: 'host',
      sparks_paid: 0,
      joined_at: now,
    });
    if (memberErr) console.error('[circles/create] member insert error:', memberErr.message);

    // Deduct Sparks if applicable
    if (creationFee > 0 && walletData) {
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

      await supabaseAdmin
        .from('wallets')
        .update({ purchased: newPurchased, bonus: newBonus, creator: newCreator, updated_at: now })
        .eq('user_id', user.uid);

      await supabaseAdmin.from('transactions').insert({
        user_id: user.uid,
        amount: -creationFee,
        type: 'community_creation_fee',
        description: `Paid ${creationFee} Sparks to request community: ${name.trim()}`,
        created_at: now,
      });
    }

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
