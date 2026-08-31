import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/getAdminUser';
import { creditSparks } from '@/lib/wallet';
import { sendPush } from '@/lib/sendPushNotification';
import { rateLimit } from '@/lib/rateLimit';

async function isCircularPair(hostId, freelancerId) {
  try {
    const { data } = await supabaseAdmin
      .from('gigs')
      .select('id')
      .eq('author_id', hostId)
      .eq('assigned_applicant_id', freelancerId)
      .eq('status', 'completed')
      .limit(3);
    return (data || []).length >= 3;
  } catch {
    return false;
  }
}

export async function POST(request, { params }) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { code } = await request.json();

    if (!code) return NextResponse.json({ error: 'Completion code is required' }, { status: 400 });

    const { data: gig, error: gigErr } = await supabaseAdmin
      .from('gigs')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (gigErr || !gig) return NextResponse.json({ error: 'Gig not found' }, { status: 404 });

    if (gig.author_id !== user.uid) {
      return NextResponse.json({ error: 'Only the gig host can mark this as complete' }, { status: 403 });
    }

    if (gig.status !== 'in_progress') {
      return NextResponse.json({ error: 'Gig is not currently in progress' }, { status: 400 });
    }

    const freelancerId = gig.assigned_applicant_id || gig.acceptedApplicantId;
    if (!freelancerId) {
      return NextResponse.json({ error: 'No accepted applicant found' }, { status: 400 });
    }

    const { data: app, error: appErr } = await supabaseAdmin
      .from('gig_applications')
      .select('*')
      .eq('gig_id', id)
      .eq('applicant_id', freelancerId)
      .maybeSingle();

    if (appErr || !app) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

    if (app.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Gig already marked as completed' }, { status: 400 });
    }

    // Brute-force protection: Max 5 attempts per 15 minutes per gig
    const rl = rateLimit(`gig_complete_code:${user.uid}:${id}`, { limit: 5, windowMs: 15 * 60 * 1000 });
    if (!rl.ok) {
      return NextResponse.json({
        error: `Too many wrong code attempts. Please wait ${rl.retryAfter}s before trying again.`
      }, { status: 429, headers: { 'Retry-After': rl.retryAfter } });
    }

    const meetingCode = app.meeting_code || app.meetingCode;
    if (!meetingCode || code.trim() !== String(meetingCode).trim()) {
      return NextResponse.json({ error: 'Incorrect completion code. Ask the freelancer for their code.' }, { status: 400 });
    }

    const suspicious = await isCircularPair(user.uid, freelancerId);
    const escrowAmount = app.escrow_amount || parseInt(gig.budget) || 0;
    const freelancerPayout = Math.floor(escrowAmount * 0.9);
    const now = new Date().toISOString();

    if (suspicious) {
      // Flag for review
      await supabaseAdmin
        .from('gig_applications')
        .update({ status: 'FLAGGED_REVIEW', completed_at: now })
        .eq('gig_id', id)
        .eq('applicant_id', freelancerId);

      await supabaseAdmin
        .from('gigs')
        .update({ status: 'flagged_review', completed_at: now })
        .eq('id', id);

      await supabaseAdmin.from('audit_logs').insert({
        admin_uid: 'system',
        action: 'circular_pair_fraud_alert',
        target_id: id,
        details: {
          host_id: user.uid,
          freelancer_id: freelancerId,
          gig_title: gig.title,
          amount: freelancerPayout,
          message: 'Suspicious circular pair detected: same 2 users completed 3+ gigs together.',
        },
        created_at: now,
      });

      return NextResponse.json({
        ok: false,
        flagged: true,
        message: 'This payout has been flagged for review due to unusual activity. Admin will process within 24 hours.',
      });
    }

    // Normal flow
    await supabaseAdmin
      .from('gig_applications')
      .update({ status: 'COMPLETED', completed_at: now })
      .eq('gig_id', id)
      .eq('applicant_id', freelancerId);

    await supabaseAdmin
      .from('gigs')
      .update({ status: 'completed', completed_at: now })
      .eq('id', id);

    // Credit Sparks to freelancer via creditSparks RPC
    if (freelancerPayout > 0) {
      await creditSparks(
        freelancerId,
        freelancerPayout,
        'creator',
        'gig_payout',
        `Completed gig: "${gig.title}"`,
        id
      );
    }

    // Notify freelancer
    await supabaseAdmin.from('notifications').insert({
      user_id: freelancerId,
      sender_id: user.uid,
      title: '⚡ Sparks Received!',
      message: `You earned ${freelancerPayout}⚡ for completing "${gig.title}". Check your wallet.`,
      type: 'gig_completed',
      gig_id: id,
      read: false,
      created_at: now,
    });

    sendPush(freelancerId, {
      title: '⚡ Sparks Received!',
      body: `You earned ${freelancerPayout} Sparks for "${gig.title}"`,
      url: '/wallet',
    }).catch(() => {});

    return NextResponse.json({ ok: true, payout: freelancerPayout });
  } catch (err) {
    console.error('[POST /api/gigs/[id]/complete]', err.message);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
