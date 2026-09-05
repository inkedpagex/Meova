import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { calculateMeetupRate } from '@/lib/pricing';

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: requests, error } = await supabaseAdmin
      .from('verification_requests')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('[GET /api/admin/verifications]', error.message);
      return NextResponse.json({ requests: [] });
    }

    // Batch fetch profiles
    const userIds = Array.from(new Set(requests.map(r => r.user_id)));
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, photo_url, username, tier')
      .in('id', userIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    const enriched = requests.map(r => {
      const prof = profileMap.get(r.user_id);
      return {
        ...r,
        full_name: prof?.full_name || 'Campus Student',
        email: prof?.email || '',
        current_photo_url: prof?.photo_url || '',
        username: prof?.username || '',
        current_tier: prof?.tier || 'not_verified',
      };
    });

    return NextResponse.json({ requests: enriched });
  } catch (err) {
    console.error('[GET /api/admin/verifications]', err.message);
    return NextResponse.json({ requests: [] });
  }
}

export async function POST(request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { requestId, action, reason } = body;

    if (!requestId || !action) {
      return NextResponse.json({ error: 'requestId and action are required' }, { status: 400 });
    }

    const { data: reqData, error: fetchErr } = await supabaseAdmin
      .from('verification_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();

    if (fetchErr || !reqData) {
      return NextResponse.json({ error: 'Verification request not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const targetUid = reqData.user_id;

    if (action === 'approve') {
      // 1. Mark request approved
      await supabaseAdmin
        .from('verification_requests')
        .update({
          status: 'approved',
          reviewed_at: now,
          reviewed_by: admin.email || 'admin',
          updated_at: now,
        })
        .eq('id', requestId);

      // 2. Fetch completed meeting count to compute rate
      const { data: prof } = await supabaseAdmin
        .from('profiles')
        .select('completed_meeting_count, completed_meets_count')
        .eq('id', targetUid)
        .maybeSingle();

      const count = prof?.completed_meeting_count ?? prof?.completed_meets_count ?? 0;
      const rate = calculateMeetupRate(count);

      // 3. Set user to verified
      await supabaseAdmin
        .from('profiles')
        .update({
          tier: 'verified',
          verified_at: now,
          current_meeting_rate: rate,
          next_eligible_resubmit_at: null,
          updated_at: now,
        })
        .eq('id', targetUid);

      // 4. Notify user
      await supabaseAdmin.from('notifications').insert({
        user_id: targetUid,
        title: 'Verification Approved',
        message: 'Your campus identity has been verified! You have unlocked paid meetups, peer calling, and verified matching.',
        type: 'accepted',
        read: false,
        created_at: now,
      });

      return NextResponse.json({ success: true, message: 'Verification approved.' });
    }

    if (action === 'reject') {
      const rejectionReason = (reason || 'ID document or selfie did not meet campus safety standards.').trim();
      const currentRejections = (reqData.rejection_count || 0) + 1;

      // Escalating cooldown:
      // 1st rejection: 24h
      // 2nd rejection: 72h
      // 3rd+ rejection: 7 days (168h) + flag for manual audit
      let cooldownHours = 24;
      if (currentRejections === 2) {
        cooldownHours = 72;
      } else if (currentRejections >= 3) {
        cooldownHours = 168; // 7 days
      }

      const nextEligibleAt = new Date(Date.now() + cooldownHours * 60 * 60 * 1000).toISOString();

      // 1. Update request
      await supabaseAdmin
        .from('verification_requests')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          rejection_count: currentRejections,
          reviewed_at: now,
          reviewed_by: admin.email || 'admin',
          updated_at: now,
        })
        .eq('id', requestId);

      // 2. Update user profile with cooldown
      await supabaseAdmin
        .from('profiles')
        .update({
          tier: 'not_verified',
          next_eligible_resubmit_at: nextEligibleAt,
          updated_at: now,
        })
        .eq('id', targetUid);

      // 3. If 3+ rejections, flag account for suspicious activity / bad-faith review
      if (currentRejections >= 3) {
        await supabaseAdmin.from('user_reports').insert({
          reported_user_id: targetUid,
          reporter_id: 'SYSTEM_VERIFICATION_AUDITOR',
          reason: `Repeated verification rejections (${currentRejections} failed attempts). Possible bad-faith actor or fraudulent document.`,
          created_at: now,
        }).catch(() => {});
      }

      // 4. Notify user with cooldown details
      await supabaseAdmin.from('notifications').insert({
        user_id: targetUid,
        title: 'Verification Declined',
        message: `Your verification was not approved: ${rejectionReason} You can resubmit in ${cooldownHours} hours.`,
        type: 'alert',
        read: false,
        created_at: now,
      });

      return NextResponse.json({
        success: true,
        message: `Verification rejected with ${cooldownHours}h cooldown.`,
        next_eligible_resubmit_at: nextEligibleAt,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('[POST /api/admin/verifications]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
