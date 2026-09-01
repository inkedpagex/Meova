/**
 * POST /api/users/verify-phone/confirm
 * Verify the OTP entered by user.
 * On success: marks profiles.phone_verified = true in Supabase.
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

const MAX_ATTEMPTS = 5;

export async function POST(request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  const { otp } = await request.json();
  if (!otp || otp.length !== 6) {
    return NextResponse.json({ error: 'Enter the 6-digit OTP.' }, { status: 400 });
  }

  // Fetch OTP record
  const { data: otpData, error: fetchErr } = await supabaseAdmin
    .from('phone_otps')
    .select('*')
    .eq('user_id', user.uid)
    .maybeSingle();

  if (fetchErr || !otpData) {
    return NextResponse.json({ error: 'No OTP found. Please request a new one.' }, { status: 404 });
  }

  // Check expiry
  if (new Date() > new Date(otpData.expires_at)) {
    await supabaseAdmin.from('phone_otps').delete().eq('user_id', user.uid);
    return NextResponse.json({ error: 'OTP expired. Please request a new one.' }, { status: 410 });
  }

  // Check max attempts (brute-force protection)
  if ((otpData.attempts || 0) >= MAX_ATTEMPTS) {
    await supabaseAdmin.from('phone_otps').delete().eq('user_id', user.uid);
    return NextResponse.json({ error: 'Too many wrong attempts. Request a new OTP.' }, { status: 429 });
  }

  // Wrong OTP — increment attempts
  if (otp.trim() !== otpData.otp) {
    await supabaseAdmin
      .from('phone_otps')
      .update({ attempts: (otpData.attempts || 0) + 1 })
      .eq('user_id', user.uid);

    const remaining = MAX_ATTEMPTS - (otpData.attempts || 0) - 1;
    return NextResponse.json({
      error: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
    }, { status: 400 });
  }

  // ✅ OTP correct — mark phone as verified and delete OTP
  await Promise.all([
    supabaseAdmin
      .from('profiles')
      .update({
        phone: otpData.phone,
        phone_verified: true,
        phone_verified_at: new Date().toISOString(),
      })
      .eq('id', user.uid),
    supabaseAdmin.from('phone_otps').delete().eq('user_id', user.uid),
  ]);

  return NextResponse.json({ ok: true, message: 'Phone number verified successfully!' });
}
