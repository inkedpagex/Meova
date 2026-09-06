import { NextResponse } from 'next/server';
import { requireAmbassador } from '../dashboard/route';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/ambassador/confirm-user
 * Tier 1+ ambassador confirms a user's college affiliation.
 * Sets college_confirmed = true, college_confirmed_via = 'ambassador'.
 * HARD RULE: Can only confirm users from the ambassador's own college.
 */
export async function POST(request) {
  try {
    const { user: ambassador, error: authError } = await requireAmbassador('probation');
    if (authError) return authError;

    const { target_user_id, note } = await request.json();

    if (!target_user_id) {
      return NextResponse.json({ error: 'target_user_id is required' }, { status: 400 });
    }

    // Cannot confirm yourself
    if (target_user_id === ambassador.id) {
      return NextResponse.json({ error: 'You cannot confirm your own college affiliation.' }, { status: 400 });
    }

    // CRITICAL: Verify target user belongs to ambassador's college — server-side
    const { data: targetProfile, error: fetchErr } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, college_id, college_confirmed, tier')
      .eq('id', target_user_id)
      .maybeSingle();

    if (fetchErr || !targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // CROSS-COLLEGE GUARD: strict server-side check (bypassed for Super Admin)
    if (!ambassador.isAdmin && targetProfile.college_id !== ambassador.college_id) {
      return NextResponse.json(
        { error: 'You can only confirm users from your own college.' },
        { status: 403 }
      );
    }

    if (targetProfile.college_confirmed) {
      return NextResponse.json({ error: 'This user is already college-confirmed.', alreadyConfirmed: true });
    }

    const now = new Date().toISOString();

    // Set college_confirmed = true via ambassador
    const { error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update({
        college_confirmed: true,
        college_confirmed_via: 'ambassador',
        updated_at: now,
      })
      .eq('id', target_user_id);

    if (updateErr) {
      console.error('[POST /api/ambassador/confirm-user]', updateErr.message);
      return NextResponse.json({ error: 'Failed to confirm user' }, { status: 500 });
    }

    // Update referral is_verified if this user was referred by this ambassador
    await supabaseAdmin
      .from('referrals')
      .update({ is_verified: true })
      .eq('referred_user_id', target_user_id)
      .eq('ambassador_id', ambassador.id);

    // Log the action
    await supabaseAdmin.from('ambassador_audit_logs').insert({
      ambassador_id: ambassador.id,
      action: 'confirm_college',
      target_id: target_user_id,
      target_type: 'user',
      college_id: ambassador.college_id,
      note: note?.trim() || null,
      created_at: now,
    });

    return NextResponse.json({
      ok: true,
      message: `${targetProfile.full_name || 'User'} has been college-confirmed.`,
    });
  } catch (err) {
    console.error('[POST /api/ambassador/confirm-user]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
