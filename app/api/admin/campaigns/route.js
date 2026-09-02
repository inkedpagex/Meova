import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/getAdminUser';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { creditSparks } from '../../../../lib/wallet';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { data: claims, error } = await supabaseAdmin
      .from('story_campaign_claims')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(150);

    if (error) {
      console.error('[GET /api/admin/campaigns]', error.message);
      return NextResponse.json({ claims: [] });
    }

    return NextResponse.json({ claims: claims || [] });
  } catch (err) {
    console.error('[GET /api/admin/campaigns]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { claimId, action, adminNote } = await request.json();
    if (!claimId || !action) {
      return NextResponse.json({ error: 'Claim ID and action required' }, { status: 400 });
    }

    const { data: claim, error: fetchErr } = await supabaseAdmin
      .from('story_campaign_claims')
      .select('*')
      .eq('id', claimId)
      .maybeSingle();

    if (fetchErr || !claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    if (action === 'approve') {
      if (claim.status === 'approved') {
        return NextResponse.json({ error: 'Claim is already approved' }, { status: 400 });
      }

      const rewardAmount = Number(claim.reward_sparks) || 100;

      // Credit 100 Sparks bonus to user
      const creditRes = await creditSparks(
        claim.user_id,
        rewardAmount,
        'bonus',
        'campaign_reward',
        `Instagram Story Reward: @${claim.instagram_handle}`,
        claim.id
      );

      if (!creditRes.ok) {
        return NextResponse.json({ error: creditRes.error || 'Failed to credit Sparks' }, { status: 500 });
      }

      await supabaseAdmin
        .from('story_campaign_claims')
        .update({
          status: 'approved',
          reviewed_by: admin.uid,
          reviewed_at: now,
          admin_note: adminNote || 'Verified on Instagram story',
        })
        .eq('id', claimId);

      // In-app notification
      await supabaseAdmin.from('notifications').insert({
        user_id: claim.user_id,
        sender_id: admin.uid,
        title: 'Story Reward Credited!',
        message: `+${rewardAmount} Free Sparks added to your wallet for tagging @meova.in on Instagram!`,
        type: 'sparks',
        read: false,
        created_at: now,
      });

      return NextResponse.json({ success: true, message: `Approved and credited ${rewardAmount} Sparks to student wallet.` });
    }

    if (action === 'reject') {
      await supabaseAdmin
        .from('story_campaign_claims')
        .update({
          status: 'rejected',
          reviewed_by: admin.uid,
          reviewed_at: now,
          admin_note: adminNote || 'Story tag could not be verified on Instagram',
        })
        .eq('id', claimId);

      await supabaseAdmin.from('notifications').insert({
        user_id: claim.user_id,
        sender_id: admin.uid,
        title: 'Story Verification Update',
        message: `Your Instagram story claim was not verified (${adminNote || 'Story tag not found'}). You can resubmit if tagged.`,
        type: 'alert',
        read: false,
        created_at: now,
      });

      return NextResponse.json({ success: true, message: 'Claim marked as rejected.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('[POST /api/admin/campaigns]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
