/**
 * POST /api/users/verify-phone/send
 * Send OTP to the given phone number using Firebase Auth phone verification.
 * We use Firebase Admin to create a custom verification code stored in Firestore.
 * (Simple 6-digit OTP approach — no external SMS provider needed initially)
 *
 * In production: integrate Twilio/MSG91 here.
 * For now: OTP stored in Firestore with 10-min TTL (admin can see it for testing).
 */
import { NextResponse } from 'next/server';
import { getUserWithRole } from '@/lib/getAdminUser';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`otp_send:${ip}`, { limit: 5, windowMs: 60 * 60_000 }); // 5 per hour
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many OTP requests. Try again in an hour.' }, { status: 429 });
  }

  const user = await getUserWithRole();
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  const { phone } = await request.json();

  // Validate Indian phone number (10 digits starting with 6-9)
  const cleaned = phone?.replace(/\D/g, '');
  if (!cleaned || !/^[6-9]\d{9}$/.test(cleaned)) {
    return NextResponse.json({ error: 'Enter a valid 10-digit Indian mobile number.' }, { status: 400 });
  }

  const fullPhone = `+91${cleaned}`;

  // Check this phone isn't already used by another verified account
  const existingSnap = await adminDb
    .collection('users')
    .where('phone', '==', fullPhone)
    .where('phone_verified', '==', true)
    .limit(1)
    .get();

  if (!existingSnap.empty && existingSnap.docs[0].id !== user.uid) {
    return NextResponse.json({
      error: 'This phone number is already linked to another account.'
    }, { status: 409 });
  }

  // Generate 6-digit OTP
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min TTL

  // Store OTP in Firestore
  await adminDb.collection('phone_otps').doc(user.uid).set({
    phone: fullPhone,
    otp,
    expiresAt,
    attempts: 0,
    createdAt: FieldValue.serverTimestamp(),
  });

  // TODO: In production, send SMS via Twilio/MSG91 here
  // For now, log to console (admin can see during testing)
  console.log(`[OTP] Phone: ${fullPhone} | OTP: ${otp} | User: ${user.uid}`);

  // NOTE: Return success but NOT the OTP to client (security)
  return NextResponse.json({
    ok: true,
    message: `OTP sent to ${fullPhone.slice(0, 6)}XXXX${fullPhone.slice(-2)}`,
    // In dev mode only, return OTP for testing:
    ...(process.env.NODE_ENV === 'development' ? { _dev_otp: otp } : {}),
  });
}
