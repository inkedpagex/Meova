/**
 * POST /api/users/verify-phone/send
 * Send OTP to the given phone number.
 * OTP is stored in Supabase phone_otps table with 10-min TTL.
 *
 * In production: integrate Twilio/MSG91 here.
 * For now: OTP stored in DB (admin can see it for testing).
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`otp_send:${ip}`, { limit: 5, windowMs: 60 * 60_000 }); // 5 per hour
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many OTP requests. Try again in an hour.' }, { status: 429 });
  }

  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  const { phone } = await request.json();

  // Validate Indian phone number (10 digits starting with 6-9)
  const cleaned = phone?.replace(/\D/g, '');
  if (!cleaned || !/^[6-9]\d{9}$/.test(cleaned)) {
    return NextResponse.json({ error: 'Enter a valid 10-digit Indian mobile number.' }, { status: 400 });
  }

  const fullPhone = `+91${cleaned}`;

  // Check this phone isn't already used by another verified account
  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('phone', fullPhone)
    .eq('phone_verified', true)
    .neq('id', user.uid)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      error: 'This phone number is already linked to another account.'
    }, { status: 409 });
  }

  // Generate 6-digit OTP
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min TTL

  // Upsert OTP record in Supabase
  const { error: upsertErr } = await supabaseAdmin
    .from('phone_otps')
    .upsert({
      user_id: user.uid,
      phone: fullPhone,
      otp,
      expires_at: expiresAt,
      attempts: 0,
      created_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (upsertErr) {
    console.error('[OTP send]', upsertErr.message);
    return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 });
  }

  // TODO: In production, send SMS via Twilio/MSG91 here
  console.log(`[OTP] Phone: ${fullPhone} | OTP: ${otp} | User: ${user.uid}`);

  return NextResponse.json({
    ok: true,
    message: `OTP sent to ${fullPhone.slice(0, 6)}XXXX${fullPhone.slice(-2)}`,
    // In dev mode only, return OTP for testing:
    ...(process.env.NODE_ENV === 'development' ? { _dev_otp: otp } : {}),
  });
}
