import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('tier, verified_at, completed_meeting_count, current_meeting_rate, next_eligible_resubmit_at')
      .eq('id', user.uid)
      .maybeSingle();

    const { data: latestReq } = await supabaseAdmin
      .from('verification_requests')
      .select('id, status, rejection_reason, rejection_count, submitted_at, reviewed_at')
      .eq('user_id', user.uid)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextResubmit = profile?.next_eligible_resubmit_at ? new Date(profile.next_eligible_resubmit_at) : null;
    const isCooldownActive = nextResubmit && nextResubmit.getTime() > Date.now();

    return NextResponse.json({
      tier: profile?.tier || 'not_verified',
      verified_at: profile?.verified_at || null,
      completed_meeting_count: profile?.completed_meeting_count || 0,
      current_meeting_rate: profile?.current_meeting_rate || 50,
      verification_status: latestReq?.status || (profile?.tier === 'verified' ? 'approved' : 'none'),
      rejection_reason: latestReq?.status === 'rejected' ? latestReq.rejection_reason : null,
      rejection_count: latestReq?.rejection_count || 0,
      next_eligible_resubmit_at: profile?.next_eligible_resubmit_at || null,
      is_cooldown_active: Boolean(isCooldownActive),
      cooldown_remaining_seconds: isCooldownActive ? Math.ceil((nextResubmit.getTime() - Date.now()) / 1000) : 0,
    });
  } catch (err) {
    console.error('[GET /api/verification/status]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
