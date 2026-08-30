/**
 * POST /api/circles/[id]/join - Securely join a community, deduct Sparks, credit 100% to Host, and unlock invite link
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request, { params }) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: circleId } = await params;
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
      // Fetch buyer wallet
      const { data: buyerWallet } = await supabaseAdmin
        .from('wallets')
        .select('purchased, bonus, creator')
        .eq('user_id', user.uid)
        .maybeSingle();

      const bw = buyerWallet || { purchased: 0, bonus: 0, creator: 0 };
      const currentBalance = (bw.purchased || 0) + (bw.bonus || 0) + (bw.creator || 0);

      if (currentBalance < price) {
        return NextResponse.json({
          error: `Insufficient Sparks. You need ${price} Sparks to join. Your balance: ${currentBalance} Sparks.`,
          requiredSparks: price,
          currentSparks: currentBalance,
        }, { status: 402 });
      }

      // Deduct from buyer: bonus → purchased → creator
      let remainingToDeduct = price;
      let newBonus = bw.bonus || 0;
      let newPurchased = bw.purchased || 0;
      let newCreator = bw.creator || 0;

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

      const now = new Date().toISOString();

      // All writes in parallel
      await Promise.all([
        // 1. Update buyer wallet
        supabaseAdmin
          .from('wallets')
          .update({ purchased: newPurchased, bonus: newBonus, creator: newCreator, updated_at: now })
          .eq('user_id', user.uid),

        // 2. Credit host wallet (increment creator bucket)
        supabaseAdmin.rpc('credit_sparks', {
          p_user_id: circle.creator_id,
          p_amount: price,
          p_type: 'creator',
          p_transaction_type: 'community_earning',
          p_description: `Earned ⚡${price} from ${user.full_name || 'a member'} joining ${circle.name}`,
          p_reference_id: circleId,
        }),

        // 3. Add member record
        supabaseAdmin.from('circle_members').insert({
          circle_id: circleId,
          user_id: user.uid,
          role: 'member',
          sparks_paid: price,
          joined_at: now,
        }),

        // 4. Increment circle stats
        supabaseAdmin
          .from('circles')
          .update({
            member_count: (circle.member_count || 1) + 1,
            total_sparks_earned: (circle.total_sparks_earned || 0) + price,
            updated_at: now,
          })
          .eq('id', circleId),

        // 5. Log buyer debit transaction
        supabaseAdmin.from('transactions').insert({
          user_id: user.uid,
          amount: -price,
          type: 'community_join',
          description: `Paid ⚡${price} to join ${circle.name}`,
          reference_id: circleId,
          created_at: now,
        }),
      ]);
    } else {
      // Free Community Join
      const now = new Date().toISOString();
      await Promise.all([
        supabaseAdmin.from('circle_members').insert({
          circle_id: circleId,
          user_id: user.uid,
          role: 'member',
          sparks_paid: 0,
          joined_at: now,
        }),
        supabaseAdmin
          .from('circles')
          .update({ member_count: (circle.member_count || 1) + 1, updated_at: now })
          .eq('id', circleId),
      ]);
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
