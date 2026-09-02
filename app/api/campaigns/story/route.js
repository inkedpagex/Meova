import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/getAdminUser';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

export const dynamic = 'force-dynamic';

const TOTAL_SLOTS = 100;

export async function GET() {
  try {
    const user = await requireAuth();
    
    // Count approved claims
    const { count: approvedCount } = await supabaseAdmin
      .from('story_campaign_claims')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    const { count: pendingCount } = await supabaseAdmin
      .from('story_campaign_claims')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const totalClaimed = (approvedCount || 0) + (pendingCount || 0);
    const remainingSlots = Math.max(0, TOTAL_SLOTS - (approvedCount || 0));

    let userClaim = null;
    if (user) {
      const { data: claim } = await supabaseAdmin
        .from('story_campaign_claims')
        .select('*')
        .eq('user_id', user.uid)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      userClaim = claim || null;
    }

    return NextResponse.json({
      totalSlots: TOTAL_SLOTS,
      claimedCount: approvedCount || 0,
      pendingCount: pendingCount || 0,
      remainingSlots,
      userClaim,
    });
  } catch (err) {
    console.error('[GET /api/campaigns/story]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

    const { instagram_handle } = await request.json();
    if (!instagram_handle || typeof instagram_handle !== 'string') {
      return NextResponse.json({ error: 'Please enter your Instagram username / handle' }, { status: 400 });
    }

    const cleanHandle = instagram_handle.trim().replace(/^@+/, '');
    if (cleanHandle.length < 2) {
      return NextResponse.json({ error: 'Invalid Instagram handle' }, { status: 400 });
    }

    // 1. Check if this user account already submitted or claimed
    const { data: existingUserClaim } = await supabaseAdmin
      .from('story_campaign_claims')
      .select('*')
      .eq('user_id', user.uid)
      .in('status', ['pending', 'approved'])
      .maybeSingle();

    if (existingUserClaim) {
      if (existingUserClaim.status === 'approved') {
        return NextResponse.json({ error: 'You have already claimed your 100 Sparks reward!' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Your story verification claim is already under review.' }, { status: 400 });
    }

    // 2. Check if this exact Instagram handle was already submitted or approved by ANY account
    const { data: duplicateHandleClaim } = await supabaseAdmin
      .from('story_campaign_claims')
      .select('id, status, instagram_handle')
      .ilike('instagram_handle', `@${cleanHandle}`)
      .in('status', ['pending', 'approved'])
      .maybeSingle();

    if (duplicateHandleClaim) {
      if (duplicateHandleClaim.status === 'approved') {
        return NextResponse.json({ error: `Instagram handle @${cleanHandle} has already been rewarded with 100 Sparks!` }, { status: 400 });
      }
      return NextResponse.json({ error: `Instagram handle @${cleanHandle} is already submitted and currently under review.` }, { status: 400 });
    }

    // Check slot limit
    const { count: approvedCount } = await supabaseAdmin
      .from('story_campaign_claims')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    if ((approvedCount || 0) >= TOTAL_SLOTS) {
      return NextResponse.json({ error: 'All 100 campaign slots have been claimed!' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { data: newClaim, error: insertErr } = await supabaseAdmin
      .from('story_campaign_claims')
      .insert({
        user_id: user.uid,
        user_name: user.full_name || '',
        user_email: user.email || '',
        instagram_handle: `@${cleanHandle}`,
        reward_sparks: 100,
        status: 'pending',
        created_at: now,
      })
      .select()
      .single();

    if (insertErr) {
      console.error('[POST /api/campaigns/story insert error]', insertErr.message);
      if (insertErr.message?.includes('does not exist')) {
        return NextResponse.json({ error: 'Please run the new Supabase SQL schema in SQL editor to create the story_campaign_claims table.' }, { status: 500 });
      }
      return NextResponse.json({ error: insertErr.message || 'Failed to submit claim' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Claim submitted! Once verified by our team, 100 Sparks will be credited to your wallet within 1 hour.',
      claim: newClaim,
    });
  } catch (err) {
    console.error('[POST /api/campaigns/story]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
