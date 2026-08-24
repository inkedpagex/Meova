/**
 * POST /api/users/verify-phone/confirm
 * Verify the OTP entered by user.
 * On success: marks user.phone_verified = true in Firestore.
 */
import { NextResponse } from 'next/server';
import { getUserWithRole } from '@/lib/getAdminUser';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

const MAX_ATTEMPTS = 5;

export async function POST(request) {
  const user = await getUserWithRole();
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  const { otp } = await request.json();
  if (!otp || otp.length !== 6) {
    return NextResponse.json({ error: 'Enter the 6-digit OTP.' }, { status: 400 });
  }

  const otpRef = adminDb.collection('phone_otps').doc(user.uid);
  const otpSnap = await otpRef.get();

  if (!otpSnap.exists) {
    return NextResponse.json({ error: 'No OTP found. Please request a new one.' }, { status: 404 });
  }

  const otpData = otpSnap.data();

  // Check expiry
  if (new Date() > new Date(otpData.expiresAt)) {
    await otpRef.delete();
    return NextResponse.json({ error: 'OTP expired. Please request a new one.' }, { status: 410 });
  }

  // Check max attempts (brute-force protection)
  if ((otpData.attempts || 0) >= MAX_ATTEMPTS) {
    await otpRef.delete();
    return NextResponse.json({ error: 'Too many wrong attempts. Request a new OTP.' }, { status: 429 });
  }

  // Wrong OTP
  if (otp.trim() !== otpData.otp) {
    await otpRef.update({ attempts: FieldValue.increment(1) });
    const remaining = MAX_ATTEMPTS - (otpData.attempts || 0) - 1;
    return NextResponse.json({
      error: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
    }, { status: 400 });
  }

  // ✅ OTP correct — mark phone as verified
  const batch = adminDb.batch();

  // Update user document
  batch.update(adminDb.collection('users').doc(user.uid), {
    phone: otpData.phone,
    phone_verified: true,
    phone_verified_at: new Date().toISOString(),
  });

  // Delete used OTP
  batch.delete(otpRef);

  await batch.commit();

  return NextResponse.json({ ok: true, message: 'Phone number verified successfully! ✅' });
}
