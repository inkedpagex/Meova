import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`verify_submit:${ip}`, { limit: 5, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
    }

    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { selfie_url, id_document_url } = body;

    if (!selfie_url || !id_document_url) {
      return NextResponse.json({ error: 'Both selfie and ID document are required' }, { status: 400 });
    }

    // 1. Check user's current status and cooldown
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('tier, next_eligible_resubmit_at')
      .eq('id', user.uid)
      .maybeSingle();

    if (profile?.tier === 'verified') {
      return NextResponse.json({ error: 'Your account is already verified.' }, { status: 400 });
    }

    if (profile?.next_eligible_resubmit_at) {
      const cooldownEnd = new Date(profile.next_eligible_resubmit_at);
      if (cooldownEnd.getTime() > Date.now()) {
        const remainingHours = Math.ceil((cooldownEnd.getTime() - Date.now()) / (1000 * 60 * 60));
        return NextResponse.json({
          error: `Resubmission cooldown active. You can resubmit in ${remainingHours} hours.`,
          next_eligible_resubmit_at: profile.next_eligible_resubmit_at,
        }, { status: 429 });
      }
    }

    // 2. Prevent duplicate pending submissions
    const { data: pendingReq } = await supabaseAdmin
      .from('verification_requests')
      .select('id')
      .eq('user_id', user.uid)
      .eq('status', 'pending')
      .maybeSingle();

    if (pendingReq) {
      return NextResponse.json({ error: 'You already have a pending verification request under review.' }, { status: 409 });
    }

    // 3. Count past rejections to carry over rejection_count
    const { count: pastRejections } = await supabaseAdmin
      .from('verification_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.uid)
      .eq('status', 'rejected');

    const now = new Date().toISOString();

    // 4. Insert new verification request
    const { data: newReq, error: insertErr } = await supabaseAdmin
      .from('verification_requests')
      .insert({
        user_id: user.uid,
        selfie_url,
        id_document_url,
        status: 'pending',
        rejection_count: pastRejections || 0,
        submitted_at: now,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (insertErr) {
      console.error('[POST /api/verification/submit]', insertErr.message);
      return NextResponse.json({ error: 'Failed to submit verification request' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Verification request submitted for admin review.',
      requestId: newReq.id,
    });
  } catch (err) {
    console.error('[POST /api/verification/submit]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
