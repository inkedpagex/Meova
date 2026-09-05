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
      const active = validActive[0];
      const expMs = active.expires_at ? new Date(active.expires_at).getTime() : (new Date(active.created_at).getTime() + RESERVATION_WINDOW_SECONDS * 1000);
      const secondsRemaining = Math.max(0, Math.floor((expMs - now.getTime()) / 1000));
      return {
        allowed: false,
        activeReservation: {
          ...active,
          base_amount: Number(active.base_amount || active.sparks || 0),
          final_amount: Number(active.final_amount || active.amount_inr || active.rupees || 0),
          amount_inr: Number(active.final_amount || active.amount_inr || active.rupees || 0),
          sparks: Number(active.sparks || 0),
          reference_code: active.reference_code || `SPK-${active.unique_decimal || '00'}`,
          upi_id: active.upi_id || ADMIN_UPI_ID,
          expires_at: active.expires_at || new Date(expMs).toISOString(),
          seconds_remaining: secondsRemaining,
        },
        error: 'You already have an active payment reservation. Please complete payment or cancel it.'
      };
    }
  }

  // Generous hourly safety limit (max 100/hr for extreme abuse prevention)
  const { count: hourlyCount, error: countErr } = await supabaseAdmin
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneHourAgo);

  if (!countErr && typeof hourlyCount === 'number' && hourlyCount >= 100) {
    return {
      allowed: false,
      error: 'Recharge attempt limit reached. Please try again in a few minutes.'
    };
  }

  return { allowed: true };
}

/**
 * Creates or resumes a unique decimal payment reservation for a user.
 * Guarantees:
 * - 1 User is assigned AT MOST 1 active decimal slot at any time (5-minute window).
 * - Repeated clicks or package changes within 5 minutes reuse the EXACT same assigned decimal slot.
 * - Prevents malicious slot exhaustion / spamming.
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

  await autoExpireStaleReservations();
  const useNewTable = await checkReservationTable();
  const table = useNewTable ? 'payment_reservations' : 'payment_requests';

  const now = new Date();
  const nowMs = now.getTime();
  const fiveMinsAgo = new Date(nowMs - RESERVATION_WINDOW_SECONDS * 1000).toISOString();

  // 1. STRICT STICKY RULE: Check if this user was assigned a decimal in the last 5 minutes.
  // This applies EVEN IF the user cancelled, changed packs, or closed the modal!
  const { data: recentUserReservations } = await supabaseAdmin
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', fiveMinsAgo)
    .neq('status', 'approved') // Only approved/credited transactions are done
    .order('created_at', { ascending: false });

  if (recentUserReservations && recentUserReservations.length > 0) {
    const existing = recentUserReservations[0];

    // If already paid_claimed, return it directly
    if (existing.status === 'paid_claimed') {
      const existingDecimal = String(existing.unique_decimal || '50').padStart(2, '0');
      return {
        ok: true,
        resumed: true,
        reservation: {
          id: existing.id,
          base_amount: Number(existing.base_amount || existing.sparks || baseAmount),
          final_amount: Number(existing.final_amount || existing.amount_inr || existing.rupees || baseAmount),
          amount_inr: Number(existing.final_amount || existing.amount_inr || existing.rupees || baseAmount),
          unique_decimal: existingDecimal,
          sparks: Number(existing.sparks || sparks),
          pack_key: existing.pack_key || packKey,
          pack_name: existing.pack_name || `${existing.sparks || sparks} Sparks`,
          reference_code: `SPK-${existingDecimal}`,
          upi_id: existing.upi_id || ADMIN_UPI_ID,
          expires_at: existing.expires_at || new Date(nowMs + 300000).toISOString(),
          seconds_remaining: 0,
          status: 'paid_claimed'
        }
      };
    }

    // STRICT STICKY DECIMAL: User is LOCKED to this exact decimal for the full 5 minutes!
    const existingDecimal = String(existing.unique_decimal || '50').padStart(2, '0');
    const decimalNum = Number(existingDecimal);
    const numBase = Number(baseAmount);
    // Match paise exactly to decimal (e.g. 250 base with decimal 88 = 249.88, matching SPK-88)
    const finalAmount = Number((numBase - 1 + (decimalNum / 100)).toFixed(2));
    
    // Countdown remaining from initial created_at timestamp
    const initialCreatedMs = new Date(existing.created_at).getTime();
    const expMs = initialCreatedMs + (RESERVATION_WINDOW_SECONDS * 1000);
    const secondsRemaining = Math.max(1, Math.floor((expMs - nowMs) / 1000));
    const expiresAt = new Date(expMs).toISOString();

    // Reactivate to 'pending' if it was cancelled, and update amount if pack changed
    const updatePayload = {
      base_amount: numBase,
      final_amount: finalAmount,
      sparks: Number(sparks),
      rupees: finalAmount,
      amount_inr: finalAmount,
      pack_key: packKey,
      pack_name: packName || `${sparks} Sparks`,
      reference_code: `SPK-${existingDecimal}`,
      unique_decimal: existingDecimal,
      status: 'pending',
      updated_at: now.toISOString(),
    };

    await supabaseAdmin
      .from(table)
      .update(updatePayload)
      .eq('id', existing.id);

    return {
      ok: true,
      resumed: true,
      reservation: {
        id: existing.id,
        base_amount: numBase,
        final_amount: finalAmount,
        amount_inr: finalAmount,
        rupees: finalAmount,
        unique_decimal: existingDecimal,
        sparks: Number(sparks),
        pack_key: packKey,
        pack_name: packName || `${sparks} Sparks`,
        reference_code: `SPK-${existingDecimal}`,
        upi_id: ADMIN_UPI_ID,
        expires_at: expiresAt,
        seconds_remaining: secondsRemaining,
        status: 'pending'
      }
    };
  }

  // 2. User has no reservation from the last 5 minutes.
  // Gather active decimals reserved across other users in the last 5 minutes
  const { data: activeReservations } = await supabaseAdmin
    .from(table)
    .select('final_amount, amount_inr, rupees, unique_decimal, status, created_at')
    .gte('created_at', fiveMinsAgo)
    .neq('status', 'approved');

  const usedDecimals = new Set();

  (activeReservations || []).forEach(r => {
    if (r.unique_decimal) {
      usedDecimals.add(Number(r.unique_decimal));
    }
  });

  // 3. Select an available unique decimal (1 to 99)
  let selectedDecimal = null;
  for (let i = 0; i < 50; i++) {
    const candidate = Math.floor(Math.random() * 99) + 1;
    if (!usedDecimals.has(candidate)) {
      selectedDecimal = candidate;
      break;
    }
  }
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
  const numBase = Number(baseAmount);
  // Match paise directly to the unique decimal: 250 base with 88 = 249.88, Ref = SPK-88
  const finalAmount = Number((numBase - 1 + (selectedDecimal / 100)).toFixed(2));
  const refCode = `SPK-${uniqueDecimalStr}`;
  const expiresAt = new Date(nowMs + RESERVATION_WINDOW_SECONDS * 1000).toISOString();

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
      amount_inr: finalAmount,
      rupees: finalAmount,
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
