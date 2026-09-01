import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { spendSparks, creditSparks } from '@/lib/wallet';

export async function POST(request, { params }) {
  let sparksDeducted = 0;
  let userUid = null;
  const { id: circleId } = await params;

  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    userUid = user.uid;

    if (!circleId) return NextResponse.json({ error: 'Invalid community ID' }, { status: 400 });

    // Fetch circle
    const { data: circle, error: circleErr } = await supabaseAdmin
      .from('circles')
      .select('*')
      .eq('id', circleId)
      .maybeSingle();

    if (circleErr || !circle) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    const isHost = circle.creator_id === user.uid;

    if (circle.status !== 'active' && !isHost) {
      return NextResponse.json({ error: 'This community is currently pending admin approval.' }, { status: 403 });
    }

    // Check if already a member
    const { data: existingMember } = await supabaseAdmin
      .from('circle_members')
      .select('id')
      .eq('circle_id', circleId)
      .eq('user_id', user.uid)
      .maybeSingle();

    const isAlreadyMember = !!existingMember;
    const secretLink = circle.invite_link || 'https://chat.whatsapp.com/';

    // Already joined or is host — return invite link directly
    if (isAlreadyMember || isHost) {
      return NextResponse.json({
        success: true,
        alreadyJoined: true,
        invite_link: secretLink,
        message: 'You are already a member of this community.'
      });
    }

    const price = circle.price || 0;

    if (price > 0) {
      // 1. Atomic Spark Deduction via spend_sparks RPC (row-locked)
      const spendResult = await spendSparks(
        user.uid,
        price,
        `Joined circle ${circle.name}`,
        'circle_join',
        circleId
      );

      if (!spendResult.ok) {
        return NextResponse.json({
          error: spendResult.error || `Insufficient Sparks to join ${circle.name}.`,
          requiredSparks: price,
        }, { status: 402 });
      }

      sparksDeducted = price;
      const now = new Date().toISOString();

      // 2. Insert member record
      const { error: memberErr } = await supabaseAdmin
        .from('circle_members')
        .insert({
          circle_id: circleId,
          user_id: user.uid,
          role: 'member',
          sparks_paid: price,
          joined_at: now,
        });

      if (memberErr) {
        console.error('[POST /api/circles/[id]/join] member insert error, rolling back:', memberErr.message);
        // Auto-Rollback: Refund user immediately
        await creditSparks(
          user.uid,
          price,
          'purchased',
          'dispute_refund',
          `Refund: Failed to join ${circle.name}`,
          circleId
        );
        return NextResponse.json({ error: 'Failed to record circle membership. Sparks have been refunded.' }, { status: 500 });
      }

      // 3. Atomically Credit host wallet (creator bucket)
      await creditSparks(
        circle.creator_id,
        price,
        'creator',
        'community_earning',
        `Earned ⚡${price} from ${user.full_name || 'a member'} joining ${circle.name}`,
        circleId
      );

      // 4. Increment circle stats
      await supabaseAdmin
        .from('circles')
        .update({
          member_count: (circle.member_count || 1) + 1,
          total_sparks_earned: (circle.total_sparks_earned || 0) + price,
          updated_at: now,
        })
        .eq('id', circleId);
    } else {
      // Free Community Join
      const now = new Date().toISOString();
      const { error: memberErr } = await supabaseAdmin
        .from('circle_members')
        .insert({
          circle_id: circleId,
          user_id: user.uid,
          role: 'member',
          sparks_paid: 0,
          joined_at: now,
        });

      if (memberErr) {
        return NextResponse.json({ error: 'Failed to join community' }, { status: 500 });
      }

      await supabaseAdmin
        .from('circles')
        .update({ member_count: (circle.member_count || 1) + 1, updated_at: now })
        .eq('id', circleId);
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
