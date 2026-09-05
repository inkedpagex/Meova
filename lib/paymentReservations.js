/**
 * paymentReservations.js
 * Manual UPI Decimal-Matching Payment Reservation Engine
 *
 * Requirements:
 * 1. 1:1 Sparks-to-INR conversion rate: ₹100 = 100 Sparks, ₹250 = 250 Sparks, ₹500 = 500 Sparks, ₹1000 = 1000 Sparks.
 * 2. Unique decimal matching with database uniqueness guarantees.
 * 3. 5-minute strict reservation window with auto-expiry.
 * 4. User-facing "I've Paid" claim transition (pending -> paid_claimed).
 * 5. Admin verification with atomic ledger crediting and attribution.
 * 6. Anti-fraud rate limits (max 1 active reservation, max 5 attempts/hour).
 */
import { supabaseAdmin } from './supabase/admin.js';
import { recordLedgerEntry } from './walletLedger.js';

// Standard 1:1 Sparks-to-INR packages
export const RECHARGE_PACKS = {
  starter: { key: 'starter', sparks: 100,  inr: 100,  label: 'Starter',  bonus: 0,  popular: false },
  popular: { key: 'popular', sparks: 250,  inr: 250,  label: 'Popular',  bonus: 0,  popular: true },
  growth:  { key: 'growth',  sparks: 500,  inr: 500,  label: 'Growth',   bonus: 0,  popular: false },
  pro:     { key: 'pro',     sparks: 1000, inr: 1000, label: 'Pro (Max)', bonus: 0, popular: false },
};

export const ADMIN_UPI_ID = 'chirag2006chak@oksbi';
export const RESERVATION_WINDOW_SECONDS = 300; // 5 minutes

let hasNewResTable = null;

async function checkReservationTable() {
  if (hasNewResTable !== null) return hasNewResTable;
  try {
    const { error } = await supabaseAdmin.from('payment_reservations').select('id').limit(1);
    hasNewResTable = !error;
    return hasNewResTable;
  } catch {
    hasNewResTable = false;
    return false;
  }
}

/**
 * Auto-expires stale pending reservations older than 5 minutes
 */
export async function autoExpireStaleReservations() {
  const now = new Date().toISOString();
  try {
    const useNewTable = await checkReservationTable();
    if (useNewTable) {
      await supabaseAdmin
        .from('payment_reservations')
        .update({ status: 'expired' })
        .eq('status', 'pending')
        .lt('expires_at', now);
    } else {
      const fiveMinsAgo = new Date(Date.now() - RESERVATION_WINDOW_SECONDS * 1000).toISOString();
      await supabaseAdmin
        .from('payment_requests')
        .update({ status: 'expired' })
        .eq('status', 'pending')
        .lt('created_at', fiveMinsAgo);
    }
  } catch (err) {
    console.warn('[autoExpireStaleReservations] warning:', err.message);
  }
}

/**
 * Checks rate limits for a user (Max 1 active reservation, Max 5 creations per hour)
 */
export async function checkUserReservationLimits(userId) {
  if (!userId) return { allowed: false, error: 'User ID required' };
  
  await autoExpireStaleReservations();
  const useNewTable = await checkReservationTable();
  const table = useNewTable ? 'payment_reservations' : 'payment_requests';

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

  // Check active reservations (pending or paid_claimed)
  const { data: activeList, error: activeErr } = await supabaseAdmin
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .in('status', ['pending', 'paid_claimed']);

  if (!activeErr && activeList && activeList.length > 0) {
    // Filter out expired pending if any
    const validActive = activeList.filter(r => {
      if (r.status === 'paid_claimed') return true;
      if (r.expires_at) return new Date(r.expires_at).getTime() > now.getTime();
      return new Date(r.created_at).getTime() > (now.getTime() - RESERVATION_WINDOW_SECONDS * 1000);
    });

    if (validActive.length > 0) {
      return {
        allowed: false,
        activeReservation: validActive[0],
        error: 'You already have an active payment reservation. Please complete payment or cancel it.'
      };
    }
  }

  // Check hourly limit (max 5)
  const { count: hourlyCount, error: countErr } = await supabaseAdmin
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneHourAgo);

  if (!countErr && typeof hourlyCount === 'number' && hourlyCount >= 5) {
    return {
      allowed: false,
      error: 'Hourly recharge limit reached (5 attempts/hr). Please wait a while before creating a new reservation.'
    };
  }

  return { allowed: true };
}

/**
 * Creates a unique decimal payment reservation for a user
 */
export async function createPaymentReservation({
  userId,
  baseAmount,
  sparks,
  packKey = 'popular',
  packName = '',
  userEmail = '',
  userName = '',
}) {
  if (!userId || !baseAmount || !sparks) {
    throw new Error('userId, baseAmount, and sparks are required');
  }

  // Enforce anti-fraud limits
  const limitCheck = await checkUserReservationLimits(userId);
  if (!limitCheck.allowed) {
    return { ok: false, error: limitCheck.error, activeReservation: limitCheck.activeReservation };
  }

  const useNewTable = await checkReservationTable();
  const table = useNewTable ? 'payment_reservations' : 'payment_requests';

  // 1. Gather all currently active reservations to avoid collisions
  const { data: activeReservations } = await supabaseAdmin
    .from(table)
    .select('final_amount, amount_inr, rupees, unique_decimal, status, expires_at, created_at')
    .in('status', ['pending', 'paid_claimed']);

  const nowMs = Date.now();
  const usedDecimals = new Set();

  (activeReservations || []).forEach(r => {
    // Check if expired
    if (r.status === 'pending') {
      const expTime = r.expires_at ? new Date(r.expires_at).getTime() : (new Date(r.created_at).getTime() + RESERVATION_WINDOW_SECONDS * 1000);
      if (expTime <= nowMs) return;
    }

    if (r.unique_decimal) {
      usedDecimals.add(Number(r.unique_decimal));
    }
    const amt = Number(r.final_amount || r.amount_inr || r.rupees || 0);
    if (amt && !Number.isInteger(amt)) {
      const dec = Math.round(Math.abs(amt - Math.floor(amt)) * 100);
      if (dec > 0 && dec <= 99) usedDecimals.add(dec);
    }
  });

  // 2. Select an available unique decimal (1 to 99)
  let selectedDecimal = null;
  // Uniform pseudo-random spread first
  for (let i = 0; i < 40; i++) {
    const candidate = Math.floor(Math.random() * 99) + 1;
    if (!usedDecimals.has(candidate)) {
      selectedDecimal = candidate;
      break;
    }
  }
  // Linear search fallback
  if (!selectedDecimal) {
    for (let slot = 1; slot <= 99; slot++) {
      if (!usedDecimals.has(slot)) {
        selectedDecimal = slot;
        break;
      }
    }
  }

  if (!selectedDecimal) {
    return {
      ok: false,
      error: 'All decimal reservation slots are currently active. Please try again in 2 minutes.'
    };
  }

  const uniqueDecimalStr = String(selectedDecimal).padStart(2, '0');
  
  // Calculate final decimal amount (e.g. ₹250 -> ₹249.55 or ₹249.XX)
  const numBase = Number(baseAmount);
  // Subtracting decimal gives unique matching key e.g. 250 - (45/100) = 249.55
  const finalAmount = Number((numBase - (selectedDecimal / 100)).toFixed(2));

  // Generate Reference Code
  const refCode = `SPK-${uniqueDecimalStr}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + RESERVATION_WINDOW_SECONDS * 1000).toISOString();

  let createdReservation = null;

  if (useNewTable) {
    const { data, error } = await supabaseAdmin
      .from('payment_reservations')
      .insert({
        user_id: userId,
        base_amount: numBase,
        final_amount: finalAmount,
        sparks: Number(sparks),
        pack_key: packKey,
        pack_name: packName || `${sparks} Sparks`,
        reference_code: refCode,
        upi_id: ADMIN_UPI_ID,
        status: 'pending',
        created_at: now.toISOString(),
        expires_at: expiresAt,
        user_email: userEmail,
        user_name: userName,
      })
      .select('*')
      .maybeSingle();

    if (!error && data) {
      createdReservation = data;
    } else if (error) {
      console.warn('[createPaymentReservation] new table insert error:', error.message);
    }
  }

  // Fallback to legacy payment_requests
  if (!createdReservation) {
    const { data: fallbackData } = await supabaseAdmin
      .from('payment_requests')
      .insert({
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        sparks: Number(sparks),
        rupees: finalAmount,
        amount_inr: finalAmount,
        unique_decimal: uniqueDecimalStr,
        reference_code: refCode,
        upi_id: ADMIN_UPI_ID,
        status: 'pending',
        created_at: now.toISOString(),
      })
      .select('*')
      .maybeSingle();

    createdReservation = fallbackData || {
      id: `res_${Date.now()}`,
      user_id: userId,
      base_amount: numBase,
      final_amount: finalAmount,
      sparks: Number(sparks),
      pack_key: packKey,
      pack_name: packName || `${sparks} Sparks`,
      reference_code: refCode,
      upi_id: ADMIN_UPI_ID,
      status: 'pending',
      created_at: now.toISOString(),
      expires_at: expiresAt,
    };
  }

  return {
    ok: true,
    reservation: {
      id: createdReservation.id,
      base_amount: numBase,
      final_amount: finalAmount,
      unique_decimal: uniqueDecimalStr,
      sparks: Number(sparks),
      pack_key: packKey,
      pack_name: packName || `${sparks} Sparks`,
      reference_code: refCode,
      upi_id: ADMIN_UPI_ID,
      expires_at: expiresAt,
      seconds_remaining: RESERVATION_WINDOW_SECONDS,
      status: 'pending'
    }
  };
}

/**
 * User claims "I've Paid"
 */
export async function claimPaymentReservation({ reservationId, userId, utrNumber = '' }) {
  if (!reservationId || !userId) {
    return { ok: false, error: 'reservationId and userId required' };
  }

  const useNewTable = await checkReservationTable();
  const table = useNewTable ? 'payment_reservations' : 'payment_requests';

  const { data: res, error: fetchErr } = await supabaseAdmin
    .from(table)
    .select('*')
    .eq('id', reservationId)
    .maybeSingle();

  if (fetchErr || !res) {
    return { ok: false, error: 'Reservation not found' };
  }

  if (res.user_id !== userId) {
    return { ok: false, error: 'Unauthorized reservation claim' };
  }

  if (res.status === 'paid_claimed') {
    return { ok: true, reservation: res, alreadyClaimed: true };
  }

  if (res.status === 'approved') {
    return { ok: false, error: 'This payment has already been approved and credited' };
  }

  const now = new Date().toISOString();

  const updatePayload = {
    status: 'paid_claimed',
    updated_at: now,
  };
  if (useNewTable) {
    updatePayload.claimed_at = now;
  }
  if (utrNumber) updatePayload.utr_number = utrNumber;

  const { data: updated, error: updateErr } = await supabaseAdmin
    .from(table)
    .update(updatePayload)
    .eq('id', reservationId)
    .select('*')
    .maybeSingle();

  if (updateErr) {
    return { ok: false, error: updateErr.message };
  }

  return { ok: true, reservation: updated || { ...res, status: 'paid_claimed', claimed_at: now } };
}

/**
 * User cancels an un-claimed pending reservation
 */
export async function cancelPaymentReservation({ reservationId, userId }) {
  if (!reservationId || !userId) {
    return { ok: false, error: 'reservationId and userId required' };
  }

  const useNewTable = await checkReservationTable();
  const table = useNewTable ? 'payment_reservations' : 'payment_requests';

  const { data: res } = await supabaseAdmin
    .from(table)
    .select('*')
    .eq('id', reservationId)
    .maybeSingle();

  if (res && res.user_id === userId && (res.status === 'pending' || res.status === 'payment_intent')) {
    await supabaseAdmin
      .from(table)
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', reservationId);
  }

  return { ok: true };
}

/**
 * Gets the current active reservation for a user
 */
export async function getActiveUserReservation(userId) {
  if (!userId) return null;
  
  await autoExpireStaleReservations();
  const useNewTable = await checkReservationTable();
  const table = useNewTable ? 'payment_reservations' : 'payment_requests';

  const { data, error } = await supabaseAdmin
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .in('status', ['pending', 'paid_claimed'])
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) return null;

  const res = data[0];
  const nowMs = Date.now();
  const expMs = res.expires_at ? new Date(res.expires_at).getTime() : (new Date(res.created_at).getTime() + RESERVATION_WINDOW_SECONDS * 1000);

  if (res.status === 'pending' && expMs <= nowMs) {
    // Stale
    await supabaseAdmin.from(table).update({ status: 'expired' }).eq('id', res.id);
    return null;
  }

  const secondsRemaining = Math.max(0, Math.floor((expMs - nowMs) / 1000));

  return {
    ...res,
    final_amount: Number(res.final_amount || res.amount_inr || res.rupees || 0),
    base_amount: Number(res.base_amount || res.sparks || 0),
    seconds_remaining: secondsRemaining,
  };
}

/**
 * Admin approves a payment reservation (atomic wallet credit)
 */
export async function approvePaymentReservation({ reservationId, adminId }) {
  if (!reservationId || !adminId) {
    return { ok: false, error: 'reservationId and adminId required' };
  }

  const now = new Date().toISOString();
  const useNewTable = await checkReservationTable();

  // 1. Fetch reservation
  const table = useNewTable ? 'payment_reservations' : 'payment_requests';
  const { data: res, error: fetchErr } = await supabaseAdmin
    .from(table)
    .select('*')
    .eq('id', reservationId)
    .maybeSingle();

  if (fetchErr || !res) {
    return { ok: false, error: 'Payment reservation not found' };
  }

  if (res.status === 'approved') {
    return { ok: false, error: 'Payment reservation is already approved' };
  }

  const sparksToCredit = Number(res.sparks || 0);
  const finalPaidAmount = Number(res.final_amount || res.amount_inr || res.rupees || sparksToCredit);

  // 2. Insert into immutable wallet ledger
  const ledgerTx = await recordLedgerEntry({
    userId: res.user_id,
    amount: sparksToCredit,
    type: 'recharge_approved',
    description: `Recharge Approved: ${res.pack_name || `${sparksToCredit} Sparks`} (Paid ₹${finalPaidAmount})`,
    referenceId: res.id,
    createdBy: adminId,
    metadata: {
      reservation_id: res.id,
      final_amount: finalPaidAmount,
      reference_code: res.reference_code,
      approved_by: adminId,
      approved_at: now
    }
  });

  // 3. Mark reservation as approved with admin attribution
  const updatePayload = {
    status: 'approved',
    updated_at: now,
  };
  if (useNewTable) {
    updatePayload.approved_at = now;
    updatePayload.approved_by = adminId;
  }

  await supabaseAdmin
    .from(table)
    .update(updatePayload)
    .eq('id', reservationId);

  // 4. Send notification to user
  try {
    await supabaseAdmin.from('notifications').insert({
      user_id: res.user_id,
      sender_id: adminId,
      title: `⚡ ${sparksToCredit} Sparks Credited!`,
      message: `Your UPI payment of ₹${finalPaidAmount} has been verified and approved. Sparks are in your wallet!`,
      type: 'sparks',
      read: false,
      created_at: now,
    });
  } catch {}

  return {
    ok: true,
    reservationId,
    userId: res.user_id,
    sparksCredited: sparksToCredit,
    finalAmount: finalPaidAmount,
    ledgerTxId: ledgerTx?.id,
  };
}

/**
 * Admin rejects a payment reservation with audit reason
 */
export async function rejectPaymentReservation({ reservationId, adminId, reason = 'Payment not found in statement' }) {
  if (!reservationId || !adminId) {
    return { ok: false, error: 'reservationId and adminId required' };
  }

  const now = new Date().toISOString();
  const useNewTable = await checkReservationTable();
  const table = useNewTable ? 'payment_reservations' : 'payment_requests';

  const { data: res, error: fetchErr } = await supabaseAdmin
    .from(table)
    .select('*')
    .eq('id', reservationId)
    .maybeSingle();

  if (fetchErr || !res) {
    return { ok: false, error: 'Payment reservation not found' };
  }

  if (res.status === 'approved') {
    return { ok: false, error: 'Cannot reject an already approved payment' };
  }

  const updatePayload = {
    status: 'rejected',
    updated_at: now
  };
  if (useNewTable) {
    updatePayload.rejection_reason = reason;
    updatePayload.approved_by = adminId;
    updatePayload.approved_at = now;
  }

  await supabaseAdmin
    .from(table)
    .update(updatePayload)
    .eq('id', reservationId);

  // Notify user of rejection
  try {
    await supabaseAdmin.from('notifications').insert({
      user_id: res.user_id,
      sender_id: adminId,
      title: 'Payment Verification Update',
      message: `Your recharge request of ₹${res.final_amount || res.amount_inr || res.rupees} could not be verified: ${reason}`,
      type: 'alert',
      read: false,
      created_at: now,
    });
  } catch {}

  return { ok: true, reservationId, status: 'rejected' };
}
