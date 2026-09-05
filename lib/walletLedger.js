/**
 * walletLedger.js
 * Double-Entry Style Immutable Wallet Ledger Engine
 *
 * Core Principles:
 * 1. Balance is ALWAYS derived: SUM(amount) FROM wallet_transactions WHERE user_id = X.
 * 2. Immutable append-only history: No editing or deleting past transactions.
 * 3. Atomic approval-to-credit: Recharges, spends, refunds, and adjustments insert ledger entries.
 * 4. Wallets table is maintained strictly as a reconciled read-cache.
 */
import { supabaseAdmin } from './supabase/admin.js';

let hasNewLedgerTable = null; // Cache table existence check

async function checkLedgerTable() {
  if (hasNewLedgerTable !== null) return hasNewLedgerTable;
  try {
    const { error } = await supabaseAdmin.from('wallet_transactions').select('id').limit(1);
    hasNewLedgerTable = !error;
    return hasNewLedgerTable;
  } catch {
    hasNewLedgerTable = false;
    return false;
  }
}

/**
 * Calculates derived wallet balance directly from the ledger
 */
export async function getDerivedBalance(userId) {
  if (!userId) return { balance: 0, purchased: 0, bonus: 0, creator: 0 };
  
  try {
    const useNewTable = await checkLedgerTable();
    const table = useNewTable ? 'wallet_transactions' : 'transactions';
    
    const { data: entries, error } = await supabaseAdmin
      .from(table)
      .select('amount, type, spark_type')
      .eq('user_id', userId);

    if (error || !entries) {
      // Fallback to wallets table if ledger query fails
      const { data: w } = await supabaseAdmin
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      const total = (w?.purchased || 0) + (w?.bonus || 0) + (w?.creator || 0);
      return {
        balance: total,
        purchased: w?.purchased || 0,
        bonus: w?.bonus || 0,
        creator: w?.creator || 0,
        source: 'cached_wallet'
      };
    }

    let total = 0;
    let purchased = 0;
    let bonus = 0;
    let creator = 0;

    entries.forEach(e => {
      const amt = Number(e.amount) || 0;
      total += amt;
      const t = (e.type || '').toLowerCase();
      const st = (e.spark_type || '').toLowerCase();

      if (t === 'bonus' || t === 'welcome') {
        bonus += amt;
      } else if (t === 'recharge_approved' || t === 'purchase' || st === 'purchased') {
        purchased += amt;
      } else if (t === 'earning' || t === 'meet_payout' || st === 'creator') {
        creator += amt;
      } else {
        purchased += amt;
      }
    });

    return {
      balance: Math.max(0, total),
      purchased: Math.max(0, purchased),
      bonus: Math.max(0, bonus),
      creator: Math.max(0, creator),
      ledgerEntryCount: entries.length,
      source: 'ledger_derived'
    };
  } catch (err) {
    console.error('[getDerivedBalance] error:', err.message);
    return { balance: 0, purchased: 0, bonus: 0, creator: 0, source: 'error_fallback' };
  }
}

/**
 * Inserts an immutable append-only ledger record and synchronizes the wallets table cache
 */
export async function recordLedgerEntry({
  userId,
  amount,
  type,
  description,
  referenceId = null,
  createdBy = 'system',
  metadata = {},
  sparkBucket = 'purchased',
}) {
  if (!userId || amount === undefined || !type) {
    throw new Error('Invalid arguments for recordLedgerEntry');
  }

  const now = new Date().toISOString();
  const numAmount = Number(amount);
  const useNewTable = await checkLedgerTable();

  let ledgerRow = null;

  if (useNewTable) {
    const { data, error } = await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        amount: numAmount,
        type,
        description,
        reference_id: referenceId ? String(referenceId) : null,
        created_at: now,
        created_by: createdBy ? String(createdBy) : 'system',
        metadata: metadata || {}
      })
      .select('*')
      .maybeSingle();

    if (!error && data) {
      ledgerRow = data;
    }
  }

  // Fallback to legacy transactions table if new table is not available or insert failed
  if (!ledgerRow) {
    const { data: fallbackData } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        amount: numAmount,
        type,
        description,
        status: 'completed',
        reference_id: referenceId ? String(referenceId) : null,
        spark_type: sparkBucket,
        metadata: { ...metadata, created_by: createdBy },
        created_at: now
      })
      .select('*')
      .maybeSingle();

    ledgerRow = fallbackData;
  }

  // Atomically update wallets read-cache
  try {
    const { data: existingWallet } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingWallet) {
      const updatePayload = { updated_at: now };
      if (numAmount > 0) {
        // Credit
        if (type === 'recharge_approved' || type === 'purchase' || sparkBucket === 'purchased') {
          updatePayload.purchased = (existingWallet.purchased || 0) + numAmount;
          updatePayload.lifetime_purchased = (existingWallet.lifetime_purchased || 0) + numAmount;
        } else if (type === 'bonus' || type === 'welcome') {
          updatePayload.bonus = (existingWallet.bonus || 0) + numAmount;
        } else if (type === 'earning' || sparkBucket === 'creator') {
          updatePayload.creator = (existingWallet.creator || 0) + numAmount;
          updatePayload.lifetime_earned = (existingWallet.lifetime_earned || 0) + numAmount;
        } else {
          updatePayload.purchased = (existingWallet.purchased || 0) + numAmount;
        }
      } else {
        // Debit
        const absAmt = Math.abs(numAmount);
        let rem = absAmt;
        let b = existingWallet.bonus || 0;
        let p = existingWallet.purchased || 0;
        let c = existingWallet.creator || 0;

        if (b >= rem) { b -= rem; rem = 0; } else { rem -= b; b = 0; }
        if (rem > 0) { if (p >= rem) { p -= rem; rem = 0; } else { rem -= p; p = 0; } }
        if (rem > 0) { if (c >= rem) { c -= rem; rem = 0; } else { c = 0; rem = 0; } }

        updatePayload.bonus = b;
        updatePayload.purchased = p;
        updatePayload.creator = c;
      }

      await supabaseAdmin
        .from('wallets')
        .update(updatePayload)
        .eq('user_id', userId);
    } else {
      // Initialize wallet
      await supabaseAdmin.from('wallets').insert({
        user_id: userId,
        purchased: numAmount > 0 ? numAmount : 0,
        bonus: 0,
        creator: 0,
        lifetime_purchased: numAmount > 0 ? numAmount : 0,
        lifetime_earned: 0,
        lifetime_withdrawn: 0,
        updated_at: now
      });
    }
  } catch (syncErr) {
    console.warn('[recordLedgerEntry] wallet cache sync warning:', syncErr.message);
  }

  return ledgerRow;
}

/**
 * Records a dispute refund entry in the ledger (immutable append-only)
 */
export async function recordRefund({ userId, originalTransactionId, amount, reason, adminId }) {
  if (!userId || !amount || !originalTransactionId) {
    throw new Error('userId, amount, and originalTransactionId are required for refund');
  }

  return await recordLedgerEntry({
    userId,
    amount: Math.abs(Number(amount)),
    type: 'refund',
    description: `Refund: ${reason || 'Dispute resolution'}`,
    referenceId: originalTransactionId,
    createdBy: adminId || 'admin',
    metadata: { original_tx_id: originalTransactionId, reason, refunded_at: new Date().toISOString() }
  });
}

/**
 * Records an admin correction/adjustment in the ledger
 */
export async function recordAdminAdjustment({ userId, amount, reason, referenceId = null, adminId }) {
  if (!userId || amount === undefined || !reason || !adminId) {
    throw new Error('userId, amount, reason, and adminId are required for adjustment');
  }

  const numAmount = Number(amount);
  return await recordLedgerEntry({
    userId,
    amount: numAmount,
    type: 'admin_adjustment',
    description: `Admin Adjustment: ${reason}`,
    referenceId,
    createdBy: adminId,
    metadata: { reason, adjusted_by: adminId, adjusted_at: new Date().toISOString() }
  });
}

/**
 * Fetches user transaction ledger history
 */
export async function getUserLedgerHistory(userId, limit = 50) {
  if (!userId) return [];
  try {
    const useNewTable = await checkLedgerTable();
    const table = useNewTable ? 'wallet_transactions' : 'transactions';

    const { data, error } = await supabaseAdmin
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data;
  } catch (err) {
    console.error('[getUserLedgerHistory] error:', err.message);
    return [];
  }
}
