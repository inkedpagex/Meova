/**
 * wallet.js
 * Server-side wallet helpers integrated with Double-Entry Two-Bucket Ledger Engine.
 * Manages balances, recharges, spends, and loophole-proof withdrawals.
 */
import { supabaseAdmin } from './supabase/admin.js';
import {
  recordLedgerEntry,
  recordSpend,
  recordEarning,
  recordRefund,
  getDerivedBalance,
  getUserLedgerHistory
} from './walletLedger.js';

export const PACKS = {
  starter: { key: 'starter', sparks: 100,  inr: 100,  amount_inr: 100, label: 'Starter',  bonus: 0,  popular: false },
  popular: { key: 'popular', sparks: 250,  inr: 250,  amount_inr: 250, label: 'Popular',  bonus: 0,  popular: true },
  growth:  { key: 'growth',  sparks: 500,  inr: 500,  amount_inr: 500, label: 'Growth',   bonus: 0,  popular: false },
  pro:     { key: 'pro',     sparks: 1000, inr: 1000, amount_inr: 1000, label: 'Pro (Max)', bonus: 0, popular: false },
};

function defaultWallet(uid, email = '') {
  return {
    id: uid,
    user_id: uid,
    email: email || '',
    purchased: 0,
    bonus: 50,
    creator: 0,
    earned: 0,
    withdrawable: 0,
    lifetime_purchased: 0,
    lifetime_earned: 0,
    lifetime_withdrawn: 0,
    total_balance: 50,
    updated_at: new Date().toISOString(),
  };
}

export const getWallet = async (uid) => {
  if (!uid) return defaultWallet(uid);
  try {
    const [{ data: w }, derived] = await Promise.all([
      supabaseAdmin.from('wallets').select('*').eq('user_id', uid).maybeSingle(),
      getDerivedBalance(uid)
    ]);

    return {
      ...(w || defaultWallet(uid)),
      purchased: derived.purchased,
      earned: derived.earned,
      withdrawable: derived.withdrawable,
      creator: derived.earned, // Compatibility alias
      bonus: derived.bonus,
      total_balance: derived.balance,
      balance: derived.balance
    };
  } catch (err) {
    console.error('[getWallet]', err.message);
    return defaultWallet(uid);
  }
};

export const getOrCreateWallet = async (uid, email = '') => {
  if (!uid) return defaultWallet(uid, email);
  try {
    const { data: existingWallet } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();

    if (!existingWallet) {
      // Initialize wallet record with 50 bonus Sparks
      const { data: inserted } = await supabaseAdmin
        .from('wallets')
        .insert({
          user_id: uid,
          purchased: 0,
          bonus: 50,
          creator: 0,
          lifetime_purchased: 0,
          lifetime_earned: 0,
          lifetime_withdrawn: 0,
        })
        .select('*')
        .maybeSingle();

      // Record welcome bonus in ledger
      await recordLedgerEntry({
        userId: uid,
        amount: 50,
        type: 'bonus',
        description: 'Welcome Bonus: 50 free Sparks',
        sparkBucket: 'bonus',
        createdBy: 'system'
      }).catch(() => {});

      // Record welcome notification
      try {
        await supabaseAdmin.from('notifications').insert({
          user_id: uid,
          title: 'Welcome to Meova',
          message: 'You have received 50 free Sparks to get started.',
          type: 'alert',
          read: false,
          created_at: new Date().toISOString(),
        });
      } catch {}

      const derived = await getDerivedBalance(uid);
      return {
        ...(inserted || defaultWallet(uid, email)),
        purchased: derived.purchased,
        earned: derived.earned,
        withdrawable: derived.withdrawable,
        creator: derived.earned,
        bonus: derived.bonus,
        total_balance: derived.balance,
        balance: derived.balance
      };
    }

    const derived = await getDerivedBalance(uid);
    return {
      ...existingWallet,
      purchased: derived.purchased,
      earned: derived.earned,
      withdrawable: derived.withdrawable,
      creator: derived.earned,
      bonus: derived.bonus,
      total_balance: derived.balance,
      balance: derived.balance
    };
  } catch (err) {
    console.error('[getOrCreateWallet]', err.message);
    return defaultWallet(uid, email);
  }
};

export async function getTransactions(uid, limit = 20) {
  if (!uid) return [];
  try {
    const [ledgerData, prData] = await Promise.all([
      getUserLedgerHistory(uid, limit),
      supabaseAdmin
        .from('payment_reservations')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(limit)
        .catch(() => ({ data: [] })),
    ]);

    const all = [];

    (ledgerData || []).forEach(tx => {
      all.push({
        id: tx.id,
        amount: Number(tx.amount || 0),
        type: tx.type,
        bucket: tx.bucket || (tx.spark_type === 'creator' ? 'earned' : 'purchased'),
        description: tx.description || tx.title || 'Transaction',
        created_at: tx.created_at,
        status: tx.status || 'completed',
        reference_id: tx.reference_id,
        metadata: tx.metadata || {},
      });
    });

    (prData?.data || []).forEach(pr => {
      if (pr.status === 'approved') return;
      all.push({
        id: pr.id,
        amount: pr.sparks,
        description: `Recharge: ${pr.pack_name || `${pr.sparks} Sparks`} (₹${pr.final_amount || pr.amount_inr})`,
        title: `Recharge (${pr.status})`,
        isRequest: true,
        requestStatus: pr.status,
        created_at: pr.created_at,
        final_amount: pr.final_amount || pr.amount_inr,
      });
    });

    all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return all.slice(0, limit);
  } catch (err) {
    console.error('[getTransactions]', err.message);
    return [];
  }
}

export async function getWithdrawals(uid) {
  if (!uid) return [];
  try {
    const { data, error } = await supabaseAdmin
      .from('withdrawals')
      .select('*')
      .eq('user_id', uid)
      .order('requested_at', { ascending: false });

    if (error) return [];
    return data || [];
  } catch (err) {
    console.error('[getWithdrawals]', err.message);
    return [];
  }
}

export async function getUserPendingPayments(uid) {
  if (!uid) return [];
  try {
    const { data, error } = await supabaseAdmin
      .from('payment_reservations')
      .select('*')
      .eq('user_id', uid)
      .in('status', ['pending', 'paid_claimed']);

    if (error || !data) {
      const { data: legacy } = await supabaseAdmin
        .from('payment_requests')
        .select('*')
        .eq('user_id', uid)
        .in('status', ['pending', 'paid_claimed']);
      return legacy || [];
    }
    return data || [];
  } catch (err) {
    console.error('[getUserPendingPayments]', err.message);
    return [];
  }
}

export async function getAllPendingWithdrawals() {
  try {
    const { data, error } = await supabaseAdmin
      .from('withdrawals')
      .select('*')
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });

    if (error) return [];
    return data || [];
  } catch (err) {
    console.error('[getAllPendingWithdrawals]', err.message);
    return [];
  }
}

export async function getAllPendingPayments() {
  try {
    const { data, error } = await supabaseAdmin
      .from('payment_reservations')
      .select('*')
      .in('status', ['pending', 'paid_claimed']);

    if (error || !data) {
      const { data: legacy } = await supabaseAdmin
        .from('payment_requests')
        .select('*')
        .in('status', ['pending', 'paid_claimed']);
      return legacy || [];
    }
    return data || [];
  } catch (err) {
    console.error('[getAllPendingPayments]', err.message);
    return [];
  }
}

export async function getAdminStats() {
  try {
    const [
      { count: totalUsers },
      { count: totalTransactions },
      { count: pendingWithdrawals },
      { count: pendingPayments },
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('transactions').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('payment_reservations').select('*', { count: 'exact', head: true }).in('status', ['pending', 'paid_claimed']).catch(() => ({ count: 0 })),
    ]);

    return {
      totalUsers: totalUsers || 0,
      totalTransactions: totalTransactions || 0,
      pendingWithdrawals: pendingWithdrawals || 0,
      pendingPayments: pendingPayments || 0,
      totalSparksInCirculation: 0,
      lifetimePurchasedSparks: 0,
    };
  } catch (err) {
    console.error('[getAdminStats]', err.message);
    return {
      totalUsers: 0,
      totalTransactions: 0,
      pendingWithdrawals: 0,
      pendingPayments: 0,
      totalSparksInCirculation: 0,
      lifetimePurchasedSparks: 0,
    };
  }
}

// ── Atomic Spend via Two-Bucket Ledger ───

export async function spendSparks(uid, amount, description = 'Sparks Spent', type = 'spend', referenceId = null) {
  if (!uid || amount <= 0) return { ok: false, error: 'Invalid arguments for spend' };
  try {
    const spendRes = await recordSpend({
      userId: uid,
      amount,
      spendType: type,
      description,
      referenceId,
      metadata: { spend_type: type }
    });

    return {
      ok: true,
      data: {
        success: true,
        spent: spendRes.spent,
        debitedPurchased: spendRes.debitedPurchased,
        debitedEarned: spendRes.debitedEarned,
        new_balance: spendRes.newBalance.balance,
        newBalance: spendRes.newBalance
      }
    };
  } catch (err) {
    console.error('[spendSparks]', err.message);
    return { ok: false, error: err.message };
  }
}

// ── Atomic Credit via Two-Bucket Ledger ──

export async function creditSparks(
  uid,
  amount,
  bucket = 'purchased',
  type = 'purchase',
  description = 'Sparks Credited',
  referenceId = null,
  createdBy = 'system'
) {
  if (!uid || amount <= 0) return { ok: false, error: 'Invalid arguments for credit' };
  try {
    const ledgerTx = await recordLedgerEntry({
      userId: uid,
      amount: Math.abs(amount),
      type: type === 'purchase' ? 'recharge_approved' : type,
      description,
      referenceId,
      createdBy,
      sparkBucket: bucket,
      metadata: { bucket, credited_at: new Date().toISOString() }
    });

    const derived = await getDerivedBalance(uid);
    return {
      ok: true,
      data: {
        success: true,
        credited: amount,
        new_balance: derived.balance,
        newBalance: derived,
        ledgerTxId: ledgerTx?.id
      }
    };
  } catch (err) {
    console.error('[creditSparks]', err.message);
    return { ok: false, error: err.message };
  }
}

// ── Atomic Withdrawal Request ──

export async function requestWithdrawal({
  userId,
  email = '',
  amount,
  method = 'upi',
  upiId = '',
  bankDetails = null
}) {
  const reqAmount = parseInt(amount, 10);
  if (!userId || isNaN(reqAmount) || reqAmount < 500 || reqAmount > 25000) {
    return { ok: false, error: 'Withdrawal amount must be between ₹500 and ₹25,000' };
  }

  if (method === 'upi') {
    const cleanUpi = (upiId || '').trim();
    if (!cleanUpi || !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(cleanUpi)) {
      return { ok: false, error: 'Please enter a valid UPI ID (e.g. username@okhdfcbank)' };
    }
  } else if (method === 'bank') {
    if (!bankDetails?.account_number || !bankDetails?.ifsc_code || !bankDetails?.account_name) {
      return { ok: false, error: 'All bank details (Account Name, Account Number, IFSC) are required' };
    }
  }

  // 1. Phone number verification check
  const { data: userProfile } = await supabaseAdmin
    .from('profiles')
    .select('phone_verified')
    .eq('id', userId)
    .maybeSingle();

  if (!userProfile?.phone_verified) {
    return {
      ok: false,
      error: 'Please verify your phone number first in Profile Settings before requesting a withdrawal.'
    };
  }

  // 2. Pending withdrawal limit (max 2 active requests)
  const { count: pendingCount } = await supabaseAdmin
    .from('withdrawals')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'pending');

  if ((pendingCount || 0) >= 2) {
    return {
      ok: false,
      error: 'You already have 2 pending withdrawal requests. Please wait for admin processing.'
    };
  }

  // 3. Strict Check: Derived Earned Balance (Purchased is NEVER withdrawable)
  const derived = await getDerivedBalance(userId);
  if (derived.withdrawable < reqAmount) {
    return {
      ok: false,
      error: `Insufficient Earned Balance. You have ${derived.withdrawable} withdrawable Sparks (Recharged/Purchased Sparks cannot be withdrawn).`
    };
  }

  const now = new Date().toISOString();

  // 4. Atomic Hold Entry in Ledger (debited from 'earned' bucket)
  const holdTx = await recordLedgerEntry({
    userId,
    amount: -reqAmount,
    type: 'withdrawal_pending',
    description: `Withdrawal Hold: ${reqAmount} Sparks (${method.toUpperCase()})`,
    createdBy: userId,
    sparkBucket: 'earned',
    metadata: {
      method,
      upi_id: method === 'upi' ? upiId.trim().toLowerCase() : null,
      bank_details: method === 'bank' ? bankDetails : null,
      hold_initiated_at: now
    }
  });

  // 5. Insert Withdrawal Record
  const { data: wdRecord, error: wdErr } = await supabaseAdmin
    .from('withdrawals')
    .insert({
      user_id: userId,
      email: email || '',
      sparks: reqAmount,
      rupees: reqAmount,
      upi_id: method === 'upi' ? upiId.trim().toLowerCase() : 'BANK_TRANSFER',
      bank_details: method === 'bank' ? bankDetails : null,
      status: 'pending',
      requested_at: now,
    })
    .select('*')
    .maybeSingle();

  if (wdErr) {
    console.error('[requestWithdrawal] insert error:', wdErr.message);
    // Reverse hold if withdrawal row creation failed
    await recordLedgerEntry({
      userId,
      amount: reqAmount,
      type: 'withdrawal_reversed',
      description: 'Withdrawal Hold Reversal (Insert Failure)',
      sparkBucket: 'earned',
      createdBy: 'system'
    }).catch(() => {});

    return { ok: false, error: 'Failed to create withdrawal request. Please try again.' };
  }

  return {
    ok: true,
    withdrawal: wdRecord,
    holdLedgerId: holdTx?.id,
    amount: reqAmount,
    remainingEarnedBalance: derived.withdrawable - reqAmount
  };
}

// ── Atomic Withdrawal Approval & Pay ──

export async function approveWithdrawal({
  withdrawalId,
  adminId = 'admin',
  payoutReference = '',
  remarks = ''
}) {
  if (!withdrawalId) return { ok: false, error: 'withdrawalId is required' };

  const { data: wd, error: wdErr } = await supabaseAdmin
    .from('withdrawals')
    .select('*')
    .eq('id', withdrawalId)
    .maybeSingle();

  if (wdErr || !wd) return { ok: false, error: 'Withdrawal not found' };
  if (wd.status !== 'pending') {
    return { ok: false, error: `Withdrawal is already ${wd.status}` };
  }

  const now = new Date().toISOString();
  const amount = Number(wd.amount || wd.sparks || wd.rupees || 0);
  const combinedRemarks = payoutReference
    ? (remarks ? `UTR: ${payoutReference} · ${remarks}` : `UTR: ${payoutReference}`)
    : (remarks || 'Approved & Paid');

  // Mark withdrawal as paid / approved
  const { error: updErr } = await supabaseAdmin
    .from('withdrawals')
    .update({
      status: 'paid',
      admin_id: adminId,
      remarks: combinedRemarks,
      processed_at: now,
      reviewed_at: now
    })
    .eq('id', withdrawalId);

  if (updErr) {
    return { ok: false, error: updErr.message };
  }

  // Update lifetime_withdrawn in wallet cache
  try {
    const { data: w } = await supabaseAdmin
      .from('wallets')
      .select('lifetime_withdrawn')
      .eq('user_id', wd.user_id)
      .maybeSingle();

    await supabaseAdmin
      .from('wallets')
      .update({
        lifetime_withdrawn: (w?.lifetime_withdrawn || 0) + amount,
        updated_at: now
      })
      .eq('user_id', wd.user_id);
  } catch {}

  // Send in-app notification to user
  try {
    await supabaseAdmin.from('notifications').insert({
      user_id: wd.user_id,
      title: 'Withdrawal Processed',
      message: `Your withdrawal of ₹${amount} has been paid! ${payoutReference ? `UTR: ${payoutReference}` : ''}`,
      type: 'alert',
      read: false,
      created_at: now
    });
  } catch {}

  return { ok: true, withdrawalId, amount, status: 'paid', payoutReference };
}

// ── Atomic Withdrawal Rejection (Compensating Reversal) ──

export async function rejectWithdrawal({
  withdrawalId,
  adminId = 'admin',
  reason = 'Rejected by Admin'
}) {
  if (!withdrawalId) return { ok: false, error: 'withdrawalId is required' };

  const { data: wd, error: wdErr } = await supabaseAdmin
    .from('withdrawals')
    .select('*')
    .eq('id', withdrawalId)
    .maybeSingle();

  if (wdErr || !wd) return { ok: false, error: 'Withdrawal not found' };
  if (wd.status !== 'pending') {
    return { ok: false, error: `Withdrawal is already ${wd.status}` };
  }

  const now = new Date().toISOString();
  const amount = Number(wd.amount || wd.sparks || wd.rupees || 0);

  // 1. Mark withdrawal rejected
  const { error: updErr } = await supabaseAdmin
    .from('withdrawals')
    .update({
      status: 'rejected',
      admin_id: adminId,
      remarks: reason,
      reviewed_at: now
    })
    .eq('id', withdrawalId);

  if (updErr) {
    return { ok: false, error: updErr.message };
  }

  // 2. Compensating credit reversal into 'earned' bucket
  await recordLedgerEntry({
    userId: wd.user_id,
    amount,
    type: 'withdrawal_reversed',
    description: `Withdrawal Reversal: ${reason}`,
    referenceId: withdrawalId,
    createdBy: adminId,
    sparkBucket: 'earned',
    metadata: {
      withdrawal_id: withdrawalId,
      rejection_reason: reason,
      rejected_at: now
    }
  });

  // 3. Send notification to user
  try {
    await supabaseAdmin.from('notifications').insert({
      user_id: wd.user_id,
      title: 'Withdrawal Rejected',
      message: `Your withdrawal of ₹${amount} was rejected (${reason}). Sparks have been restored to your earned balance.`,
      type: 'alert',
      read: false,
      created_at: now
    });
  } catch {}

  return { ok: true, withdrawalId, amountRestored: amount, status: 'rejected' };
}

