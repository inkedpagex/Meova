/**
 * walletLedger.js
 * Double-Entry Style Immutable Wallet Ledger Engine with Strict Two-Bucket Separation
 * 
 * Core Principles:
 * 1. TWO FUND BUCKETS:
 *    - 'purchased': Recharges (UPI/decimals), bonus, promo credits (NEVER withdrawable).
 *    - 'earned': Creator earnings from workshops, meetings, coffee sessions, gigs, referral rewards (Withdrawable, min ₹500).
 * 2. BALANCE IS ALWAYS DERIVED:
 *    - Purchased Balance = SUM(amount) WHERE user_id = X AND (bucket = 'purchased' OR spark_type = 'purchased')
 *    - Earned Balance    = SUM(amount) WHERE user_id = X AND (bucket = 'earned'    OR spark_type IN ('creator', 'earned'))
 *    - Withdrawable      = MAX(0, Earned Balance) [Immediate availability upon earning]
 * 3. SPEND PRIORITY:
 *    - In-app spends deduct from 'purchased' bucket first, then 'earned' if purchased is exhausted.
 * 4. REFUND INTEGRITY:
 *    - Refunds inspect the original transaction and return funds ONLY to the origin bucket (never convert purchased to earned).
 * 5. P2P TIP/TRANSFER PRESERVATION (Option A):
 *    - Purchased sparks remain purchased in the recipient's wallet.
 * 6. WALLETS TABLE AS RECONCILED READ-CACHE:
 *    - Wallets table is updated alongside append-only ledger entries for fast read caching.
 */

import { supabaseAdmin } from './supabase/admin.js';

let hasNewLedgerTable = null;

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
 * Normalizes bucket name ('purchased' | 'earned')
 */
export function normalizeBucket(rawBucket, txType = '') {
  const b = (rawBucket || '').toLowerCase();
  const t = (txType || '').toLowerCase();

  if (b === 'earned' || b === 'creator' || t === 'earning' || t === 'meet_payout' || t === 'host_payout' || t === 'gig_payout' || t === 'referral_reward') {
    return 'earned';
  }
  return 'purchased';
}

/**
 * Calculates derived wallet balance directly from the immutable ledger
 */
export async function getDerivedBalance(userId) {
  if (!userId) {
    return {
      balance: 0,
      total_balance: 0,
      purchased: 0,
      earned: 0,
      withdrawable: 0,
      bonus: 0,
      creator: 0,
      source: 'empty_user'
    };
  }

  try {
    const useNewTable = await checkLedgerTable();
    const table = useNewTable ? 'wallet_transactions' : 'transactions';

    const { data: entries, error } = await supabaseAdmin
      .from(table)
      .select('amount, type, spark_type, metadata')
      .eq('user_id', userId);

    if (error || !entries) {
      // Fallback to wallets table cache if ledger query fails
      const { data: w } = await supabaseAdmin
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const p = Number(w?.purchased || 0);
      const b = Number(w?.bonus || 0);
      const e = Number(w?.creator || 0);
      const tot = Math.max(0, p + b + e);

      return {
        balance: tot,
        total_balance: tot,
        purchased: Math.max(0, p),
        earned: Math.max(0, e),
        withdrawable: Math.max(0, e),
        bonus: Math.max(0, b),
        creator: Math.max(0, e),
        source: 'cached_wallet'
      };
    }

    let purchased = 0;
    let earned = 0;
    let bonus = 0;

    entries.forEach(entry => {
      const amt = Number(entry.amount) || 0;
      const t = (entry.type || '').toLowerCase();
      const st = (entry.spark_type || '').toLowerCase();
      const metaBucket = (entry.metadata?.bucket || '').toLowerCase();

      if (t === 'bonus' || t === 'welcome') {
        bonus += amt;
      } else if (
        metaBucket === 'earned' ||
        st === 'creator' ||
        st === 'earned' ||
        t === 'earning' ||
        t === 'meet_payout' ||
        t === 'host_payout' ||
        t === 'gig_payout' ||
        t === 'referral_reward' ||
        t === 'withdrawal_pending' ||
        t === 'withdrawal_reversed'
      ) {
        earned += amt;
      } else {
        purchased += amt;
      }
    });

    const safePurchased = Math.max(0, purchased);
    const safeEarned = Math.max(0, earned);
    const safeBonus = Math.max(0, bonus);
    const total = safePurchased + safeEarned + safeBonus;

    return {
      balance: total,
      total_balance: total,
      purchased: safePurchased,
      earned: safeEarned,
      withdrawable: safeEarned, // Earned funds are immediately withdrawable
      bonus: safeBonus,
      creator: safeEarned,      // Compatibility alias
      ledgerEntryCount: entries.length,
      source: 'ledger_derived'
    };
  } catch (err) {
    console.error('[getDerivedBalance] error:', err.message);
    return {
      balance: 0,
      total_balance: 0,
      purchased: 0,
      earned: 0,
      withdrawable: 0,
      bonus: 0,
      creator: 0,
      source: 'error_fallback'
    };
  }
}

/**
 * Returns net purchased balance for a user
 */
export async function getPurchasedBalance(userId) {
  const derived = await getDerivedBalance(userId);
  return derived.purchased;
}

/**
 * Returns net earned balance (withdrawable) for a user
 */
export async function getEarnedBalance(userId) {
  const derived = await getDerivedBalance(userId);
  return derived.earned;
}

/**
 * Inserts an immutable append-only ledger record and reconciles the wallets cache
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
  const normalizedBucket = normalizeBucket(sparkBucket, type);
  const sparkTypeForLegacy = normalizedBucket === 'earned' ? 'creator' : (type === 'bonus' ? 'bonus' : 'purchased');

  const useNewTable = await checkLedgerTable();
  let ledgerRow = null;

  if (useNewTable) {
    const { data, error } = await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        amount: numAmount,
        type,
        bucket: normalizedBucket,
        description,
        reference_id: referenceId ? String(referenceId) : null,
        created_at: now,
        created_by: createdBy ? String(createdBy) : 'system',
        metadata: {
          ...metadata,
          bucket: normalizedBucket,
          spark_type: sparkTypeForLegacy
        }
      })
      .select('*')
      .maybeSingle();

    if (!error && data) {
      ledgerRow = data;
    }
  }

  // Fallback to transactions table
  if (!ledgerRow) {
    const { data: fallbackData, error: fallbackErr } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        amount: numAmount,
        type,
        description,
        status: 'completed',
        reference_id: referenceId ? String(referenceId) : null,
        spark_type: sparkTypeForLegacy,
        metadata: {
          ...metadata,
          bucket: normalizedBucket,
          created_by: createdBy,
          recorded_at: now
        },
        created_at: now
      })
      .select('*')
      .maybeSingle();

    if (fallbackErr) {
      console.error('[recordLedgerEntry] transactions insert error:', fallbackErr.message);
    }
    ledgerRow = fallbackData;
  }

  // Synchronize wallets read-cache
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
        if (normalizedBucket === 'earned') {
          updatePayload.creator = (existingWallet.creator || 0) + numAmount;
          updatePayload.lifetime_earned = (existingWallet.lifetime_earned || 0) + numAmount;
        } else if (type === 'bonus' || type === 'welcome') {
          updatePayload.bonus = (existingWallet.bonus || 0) + numAmount;
        } else {
          updatePayload.purchased = (existingWallet.purchased || 0) + numAmount;
          updatePayload.lifetime_purchased = (existingWallet.lifetime_purchased || 0) + numAmount;
        }
      } else {
        // Debit
        const absAmt = Math.abs(numAmount);
        if (normalizedBucket === 'earned') {
          updatePayload.creator = Math.max(0, (existingWallet.creator || 0) - absAmt);
        } else {
          let rem = absAmt;
          let b = existingWallet.bonus || 0;
          let p = existingWallet.purchased || 0;

          if (b >= rem) { b -= rem; rem = 0; } else { rem -= b; b = 0; }
          if (rem > 0) { if (p >= rem) { p -= rem; rem = 0; } else { rem -= p; p = 0; } }

          updatePayload.bonus = b;
          updatePayload.purchased = p;
        }
      }

      await supabaseAdmin
        .from('wallets')
        .update(updatePayload)
        .eq('user_id', userId);
    } else {
      // Initialize wallet cache
      await supabaseAdmin.from('wallets').insert({
        user_id: userId,
        purchased: normalizedBucket === 'purchased' && numAmount > 0 ? numAmount : 0,
        bonus: type === 'bonus' && numAmount > 0 ? numAmount : 0,
        creator: normalizedBucket === 'earned' && numAmount > 0 ? numAmount : 0,
        lifetime_purchased: normalizedBucket === 'purchased' && numAmount > 0 ? numAmount : 0,
        lifetime_earned: normalizedBucket === 'earned' && numAmount > 0 ? numAmount : 0,
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
 * Spends sparks with strict bucket priority:
 * 1. Debits from 'purchased' bucket first.
 * 2. If 'purchased' is insufficient, debits remainder from 'earned' bucket.
 * Records separate immutable ledger entries for each portion with complete origin tracking.
 */
export async function recordSpend({
  userId,
  amount,
  spendType = 'spend',
  description = 'Sparks Spent',
  referenceId = null,
  metadata = {}
}) {
  const reqAmount = Math.abs(Number(amount));
  if (!userId || reqAmount <= 0) {
    throw new Error('Invalid userId or spend amount');
  }

  const derived = await getDerivedBalance(userId);
  if (derived.balance < reqAmount) {
    throw new Error(`Insufficient Sparks. You have ${derived.balance} Sparks, but need ${reqAmount}.`);
  }

  const availablePurchased = (derived.purchased || 0) + (derived.bonus || 0);
  const fromPurchased = Math.min(availablePurchased, reqAmount);
  const fromEarned = reqAmount - fromPurchased;

  const results = [];

  // 1. Debit from Purchased/Bonus portion
  if (fromPurchased > 0) {
    const tx1 = await recordLedgerEntry({
      userId,
      amount: -fromPurchased,
      type: spendType,
      description: description + (fromEarned > 0 ? ' (Purchased portion)' : ''),
      referenceId,
      createdBy: userId,
      sparkBucket: 'purchased',
      metadata: {
        ...metadata,
        bucket_debited: 'purchased',
        total_spend: reqAmount,
        split_purchased: fromPurchased,
        split_earned: fromEarned
      }
    });
    results.push(tx1);
  }

  // 2. Debit remainder from Earned portion
  if (fromEarned > 0) {
    const tx2 = await recordLedgerEntry({
      userId,
      amount: -fromEarned,
      type: spendType,
      description: `${description} (Earned portion)`,
      referenceId,
      createdBy: userId,
      sparkBucket: 'earned',
      metadata: {
        ...metadata,
        bucket_debited: 'earned',
        total_spend: reqAmount,
        split_purchased: fromPurchased,
        split_earned: fromEarned
      }
    });
    results.push(tx2);
  }

  const newBalance = await getDerivedBalance(userId);
  return {
    ok: true,
    spent: reqAmount,
    debitedPurchased: fromPurchased,
    debitedEarned: fromEarned,
    newBalance,
    transactions: results
  };
}

/**
 * Records a dispute/spend refund in the ledger.
 * STRICT RULE: Refund returns money ONLY to the exact origin bucket from which it was debited.
 * Purchased spend NEVER converts to earned on refund!
 */
export async function recordRefund({
  userId,
  originalTransactionId,
  amount,
  reason,
  adminId = 'system'
}) {
  if (!userId || !amount || !originalTransactionId) {
    throw new Error('userId, amount, and originalTransactionId are required for refund');
  }

  const refundAmt = Math.abs(Number(amount));
  let originBucket = 'purchased';

  // Inspect original transaction to find origin bucket
  try {
    const useNewTable = await checkLedgerTable();
    const table = useNewTable ? 'wallet_transactions' : 'transactions';

    const { data: origTx } = await supabaseAdmin
      .from(table)
      .select('*')
      .eq('id', originalTransactionId)
      .maybeSingle();

    if (origTx) {
      if (origTx.bucket === 'earned' || origTx.spark_type === 'creator' || origTx.spark_type === 'earned' || origTx.metadata?.bucket_debited === 'earned') {
        originBucket = 'earned';
      }
    }
  } catch (lookupErr) {
    console.warn('[recordRefund] could not look up original tx:', lookupErr.message);
  }

  return await recordLedgerEntry({
    userId,
    amount: refundAmt,
    type: 'refund',
    description: `Refund: ${reason || 'Dispute resolution'} (${originBucket} bucket)`,
    referenceId: originalTransactionId,
    createdBy: adminId || 'system',
    sparkBucket: originBucket,
    metadata: {
      original_tx_id: originalTransactionId,
      refunded_to_bucket: originBucket,
      reason,
      refunded_at: new Date().toISOString()
    }
  });
}

/**
 * Records creator earnings (workshops, coffee sessions, meetings, gigs, referral rewards).
 * ALWAYS credits 'earned' bucket.
 */
export async function recordEarning({
  userId,
  amount,
  type = 'earning',
  description = 'Creator Earning',
  referenceId = null,
  createdBy = 'system',
  metadata = {}
}) {
  const earnAmt = Math.abs(Number(amount));
  if (!userId || earnAmt <= 0) {
    throw new Error('Invalid userId or earning amount');
  }

  return await recordLedgerEntry({
    userId,
    amount: earnAmt,
    type,
    description,
    referenceId,
    createdBy,
    sparkBucket: 'earned',
    metadata: {
      ...metadata,
      bucket: 'earned',
      earned_at: new Date().toISOString()
    }
  });
}

/**
 * Records a P2P Transfer / Tipping entry (Option A: Bucket Preservation).
 * RULE: Purchased sparks stay 'purchased' in recipient's wallet, ensuring no purchased funds become withdrawable.
 */
export async function recordTipTransfer({
  senderId,
  recipientId,
  amount,
  tipType = 'tip',
  description = 'Sparks Tip',
  referenceId = null
}) {
  const tipAmt = Math.abs(Number(amount));
  if (!senderId || !recipientId || tipAmt <= 0) {
    throw new Error('Invalid arguments for tip transfer');
  }

  // 1. Spend from sender
  const spendRes = await recordSpend({
    userId: senderId,
    amount: tipAmt,
    spendType: `${tipType}_sent`,
    description: `Tip sent to user ${recipientId}`,
    referenceId,
    metadata: { recipient_id: recipientId, tip_type: tipType }
  });

  // 2. Credit to recipient (Option A: Purchased remains Purchased)
  // Even if sender spent from earned, recipient receives as purchased to prevent withdrawal looping
  const creditTx = await recordLedgerEntry({
    userId: recipientId,
    amount: tipAmt,
    type: `${tipType}_received`,
    description: `Tip received from user ${senderId}`,
    referenceId,
    createdBy: senderId,
    sparkBucket: 'purchased',
    metadata: {
      sender_id: senderId,
      tip_type: tipType,
      received_at: new Date().toISOString()
    }
  });

  return {
    ok: true,
    spendResult: spendRes,
    creditResult: creditTx
  };
}

/**
 * Records an explicit admin correction/adjustment in the ledger
 */
export async function recordAdminAdjustment({
  userId,
  amount,
  bucket = 'purchased',
  reason,
  referenceId = null,
  adminId
}) {
  if (!userId || amount === undefined || !reason || !adminId) {
    throw new Error('userId, amount, reason, and adminId are required for adjustment');
  }

  const numAmount = Number(amount);
  const normalizedBucket = normalizeBucket(bucket);

  return await recordLedgerEntry({
    userId,
    amount: numAmount,
    type: 'admin_adjustment',
    description: `Admin Adjustment (${normalizedBucket}): ${reason}`,
    referenceId,
    createdBy: adminId,
    sparkBucket: normalizedBucket,
    metadata: {
      reason,
      bucket: normalizedBucket,
      adjusted_by: adminId,
      adjusted_at: new Date().toISOString()
    }
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
