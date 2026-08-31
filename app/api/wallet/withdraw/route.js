import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/getAdminUser';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { getWithdrawals } from '../../../../lib/wallet';
import { rateLimit, getClientIp } from '../../../../lib/rateLimit';

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  try {
    const list = await getWithdrawals(user.uid);
    return NextResponse.json({ withdrawals: list });
  } catch (err) {
    console.error('[GET /api/wallet/withdraw]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`withdraw:${ip}`, { limit: 5, windowMs: 10 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many withdrawal requests. Please try again later.' }, {
      status: 429,
      headers: { 'Retry-After': rl.retryAfter }
    });
  }

  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  const { amount, method, upi_id, bank_details } = await request.json();

  if (!amount || amount < 500 || amount > 25000) {
    return NextResponse.json({ error: 'Withdrawal amount must be between 500 and 25,000 Creator Sparks' }, { status: 400 });
  }
  if (!method || !['upi', 'bank'].includes(method)) {
    return NextResponse.json({ error: 'Method must be upi or bank' }, { status: 400 });
  }

  if (method === 'upi') {
    const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!upi_id || !UPI_REGEX.test(upi_id.trim())) {
      return NextResponse.json({ error: 'Please enter a valid UPI ID (e.g. username@okhdfcbank)' }, { status: 400 });
    }
  }

  if (method === 'bank') {
    if (!bank_details || !bank_details.account_number || !bank_details.ifsc) {
      return NextResponse.json({ error: 'Bank account number and IFSC code are required' }, { status: 400 });
    }
    const cleanAccount = String(bank_details.account_number).trim();
    if (!/^\d{9,18}$/.test(cleanAccount)) {
      return NextResponse.json({ error: 'Bank account number must be 9 to 18 digits' }, { status: 400 });
    }
    const cleanIfsc = String(bank_details.ifsc).trim().toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
      return NextResponse.json({ error: 'Invalid IFSC code format (e.g. SBIN0001234)' }, { status: 400 });
    }
  }

  try {
    // 1. Phone number check
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('phone_verified')
      .eq('id', user.uid)
      .maybeSingle();

    if (!userProfile?.phone_verified) {
      return NextResponse.json({
        error: 'Please verify your phone number first. Go to Profile → Settings → Verify Phone.'
      }, { status: 403 });
    }

    // 2. Activity check
    const [{ count: gigCount }, { count: bookingCount }] = await Promise.all([
      supabaseAdmin.from('gigs').select('*', { count: 'exact', head: true }).eq('assigned_applicant_id', user.uid).eq('status', 'completed'),
      supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }).eq('host_id', user.uid).eq('status', 'Meeting Completed'),
    ]);

    if ((gigCount || 0) === 0 && (bookingCount || 0) === 0) {
      return NextResponse.json({
        error: 'You must complete at least 1 Gig or host 1 Meeting before requesting a withdrawal.'
      }, { status: 403 });
    }

    // 3. UPI ID uniqueness check
    if (upi_id) {
      const cleanUpi = upi_id.trim().toLowerCase();
      const { data: existingUpi } = await supabaseAdmin
        .from('withdrawals')
        .select('*')
        .eq('upi_id', cleanUpi)
        .neq('user_id', user.uid)
        .limit(1);

      if (existingUpi && existingUpi.length > 0) {
        await supabaseAdmin.from('audit_logs').insert({
          admin_uid: 'system',
          action: 'duplicate_upi_alert',
          target_id: user.uid,
          details: { upi_id: cleanUpi, message: 'Duplicate UPI ID detected' },
          created_at: new Date().toISOString(),
        });

        return NextResponse.json({
          error: 'This UPI ID is already linked to another account. Our team will review and contact you within 24 hours.'
        }, { status: 403 });
      }
    }

    // 4. Pending withdrawal limit
    const { count: pendingWdCount } = await supabaseAdmin
      .from('withdrawals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.uid)
      .eq('status', 'pending');

    if ((pendingWdCount || 0) >= 1) {
      return NextResponse.json({ error: 'You already have a pending withdrawal request. Please wait for it to be processed.' }, { status: 400 });
    }

    // Check balance
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', user.uid)
      .maybeSingle();

    if (!wallet || (wallet.creator || 0) < amount) {
      return NextResponse.json({ error: 'Insufficient Creator Sparks' }, { status: 400 });
    }

    // Deduct creator balance (hold until admin review)
    await supabaseAdmin
      .from('wallets')
      .update({
        creator: (wallet.creator || 0) - amount,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.uid);

    // Create withdrawal record
    const { error: insertErr } = await supabaseAdmin
      .from('withdrawals')
      .insert({
        user_id: user.uid,
        email: user.email,
        amount,
        method,
        upi_id: upi_id ? upi_id.trim().toLowerCase() : null,
        bank_details: bank_details || null,
        status: 'pending',
        requested_at: new Date().toISOString(),
      });

    if (insertErr) {
      console.error('[POST /api/wallet/withdraw insert error]', insertErr.message);
      return NextResponse.json({ error: 'Failed to create withdrawal request' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'Withdrawal request submitted' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
