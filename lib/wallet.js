/**
 * wallet.js
 * Server-side wallet helpers integrated with Double-Entry Wallet Ledger Engine.
 * All reads/writes interact with 'wallet_transactions', 'wallets', 'payment_reservations', and 'withdrawals'.
 */
import { supabaseAdmin } from './supabase/admin';
import { recordLedgerEntry, getDerivedBalance, getUserLedgerHistory } from './walletLedger';

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
    lifetime_purchased: 0,
    lifetime_earned: 0,
    lifetime_withdrawn: 0,
    updated_at: new Date().toISOString(),
  };
}

export const getWallet = async (uid) => {
  if (!uid) return defaultWallet(uid);
  try {
    const [{ data: w, error }, derived] = await Promise.all([
      supabaseAdmin.from('wallets').select('*').eq('user_id', uid).maybeSingle(),
      getDerivedBalance(uid)
    ]);

    if (error || !w) return defaultWallet(uid);
    return {
      ...w,
      purchased: derived.purchased || w.purchased || 0,
      bonus: derived.bonus || w.bonus || 0,
      creator: derived.creator || w.creator || 0,
      total_balance: derived.balance,
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
      // Try initializing wallet record with 50 bonus Sparks
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
      await supabaseAdmin.from('notifications').insert({
        user_id: uid,
        title: 'Welcome to Meova',
        message: 'You have received 50 free Sparks to get started.',
        type: 'alert',
        read: false,
        created_at: new Date().toISOString(),
      }).catch(() => {});

      return inserted || defaultWallet(uid, email);
    }

    const derived = await getDerivedBalance(uid);
    return {
      ...existingWallet,
      purchased: derived.purchased || existingWallet.purchased || 0,
      bonus: derived.bonus || existingWallet.bonus || 0,
      creator: derived.creator || existingWallet.creator || 0,
      total_balance: derived.balance,
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
      .eq('status', 'pending');

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

// ── Atomic Spend via Double-Entry Ledger ───

export async function spendSparks(uid, amount, description = 'Sparks Spent', type = 'booking_escrow', referenceId = null) {
  if (!uid || amount <= 0) return { ok: false, error: 'Invalid args' };
  try {
    const { data: wallet, error: wErr } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();

    if (wErr || !wallet) {
      return { ok: false, error: 'Wallet not found. Please refresh.' };
    }

    const bonus = Number(wallet.bonus) || 0;
    const purchased = Number(wallet.purchased) || 0;
    const creator = Number(wallet.creator) || 0;
    const total = bonus + purchased + creator;

    if (total < amount) {
      return { ok: false, error: `Insufficient Sparks. You have ${total} Sparks, but need ${amount}.` };
    }

    // Insert immutable debit into ledger
    const ledgerTx = await recordLedgerEntry({
      userId: uid,
      amount: -Math.abs(amount),
      type,
      description,
      referenceId,
      createdBy: uid,
      metadata: { spend_type: type }
    });

    const derived = await getDerivedBalance(uid);
    return { ok: true, data: { success: true, spent: amount, new_balance: derived.balance, ledgerTxId: ledgerTx?.id } };
  } catch (err) {
    console.error('[spendSparks]', err.message);
    return { ok: false, error: err.message };
  }
}

// ── Atomic Credit via Double-Entry Ledger ──

export async function creditSparks(
  uid,
  amount,
  bucket = 'purchased',
  type = 'purchase',
  description = 'Sparks Credited',
  referenceId = null,
  createdBy = 'system'
) {
  if (!uid || amount <= 0) return { ok: false, error: 'Invalid args' };
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
    return { ok: true, data: { success: true, credited: amount, new_balance: derived.balance, ledgerTxId: ledgerTx?.id } };
  } catch (err) {
    console.error('[creditSparks]', err.message);
    return { ok: false, error: err.message };
  }
}

// ── Atomic Withdrawal Payout ──

export async function recordWithdrawalPayout(uid, amount, withdrawalId, adminId = 'admin') {
  if (!uid || amount <= 0 || !withdrawalId) return { ok: false, error: 'Invalid args' };
  try {
    await recordLedgerEntry({
      userId: uid,
      amount: -Math.abs(amount),
      type: 'withdrawal',
      description: `Withdrawal Payout: ${amount} Sparks`,
      referenceId: withdrawalId,
      createdBy: adminId,
      sparkBucket: 'creator',
      metadata: { withdrawal_id: withdrawalId }
    });

    await supabaseAdmin
      .from('withdrawals')
      .update({
        status: 'approved',
        processed_at: new Date().toISOString(),
        admin_id: adminId,
      })
      .eq('id', withdrawalId);

    return { ok: true, data: { success: true } };
  } catch (err) {
    console.error('[recordWithdrawalPayout]', err.message);
    return { ok: false, error: err.message };
  }
}
