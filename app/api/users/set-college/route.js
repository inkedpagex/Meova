import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/users/set-college
 * Authenticated user self-selects their college during onboarding.
 * Only allowed if college_confirmed = false (once confirmed, college is locked).
 */
export async function POST(request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { college_id, referral_code } = await request.json();

    if (!college_id) {
      return NextResponse.json({ error: 'college_id is required' }, { status: 400 });
    }

    // Verify college exists and is active
    const { data: college, error: collegeErr } = await supabaseAdmin
      .from('colleges')
      .select('id, name')
      .eq('id', college_id)
      .eq('is_active', true)
      .maybeSingle();

    if (collegeErr || !college) {
      return NextResponse.json({ error: 'Invalid college selected' }, { status: 400 });
    }

    // Check if user is already confirmed — cannot change college once confirmed
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('college_confirmed, college_id')
      .eq('id', user.uid)
      .maybeSingle();

    if (profile?.college_confirmed && profile?.college_id) {
      return NextResponse.json({ error: 'College is already confirmed and cannot be changed.' }, { status: 403 });
    }

    // Update profile with selected college
    const { error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update({ college_id, updated_at: new Date().toISOString() })
      .eq('id', user.uid);

    if (updateErr) {
      console.error('[POST /api/users/set-college]', updateErr.message);
      return NextResponse.json({ error: 'Failed to set college' }, { status: 500 });
    }

    // Handle referral code at signup
    if (referral_code) {
      // Find the ambassador with this referral code
      const { data: ambassador } = await supabaseAdmin
        .from('profiles')
        .select('id, is_ambassador, college_id')
        .eq('referral_code', referral_code)
        .maybeSingle();

      if (ambassador && ambassador.is_ambassador && ambassador.id !== user.uid) {
        // Record referral (upsert in case of retry)
        const { error: refErr } = await supabaseAdmin
          .from('referrals')
          .upsert({
            ambassador_id: ambassador.id,
            referred_user_id: user.uid,
            referral_code,
            signup_at: new Date().toISOString(),
            college_id: ambassador.college_id,
            is_verified: false,
          }, { onConflict: 'referred_user_id', ignoreDuplicates: true });

        if (!refErr) {
          // Also record referred_by on profile
          await supabaseAdmin
            .from('profiles')
            .update({ referred_by: ambassador.id })
            .eq('id', user.uid);
        }
      }
    }

    return NextResponse.json({ ok: true, college });
  } catch (err) {
    console.error('[POST /api/users/set-college]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
