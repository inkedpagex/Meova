/**
 * wallet.js
 * Server-side wallet helpers using Supabase JS client and stored procedures (RPC).
 * All reads/writes interact with the 'wallets', 'transactions', 'payment_requests', and 'withdrawals' tables.
 */
import { supabaseAdmin } from './supabase/admin';

function defaultWallet(uid, email = '') {
  return {
    id: uid,
    user_id: uid,
    email: email || '',
    purchased: 0,
    bonus: 0,
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
    const { data, error } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();

    if (error || !data) return defaultWallet(uid);
    return data;
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
      // Try initializing wallet record directly if RPC not yet ready
      const { data: inserted } = await supabaseAdmin
        .from('wallets')
        .insert({
          user_id: uid,
          purchased: 0,
          bonus: 100,
          creator: 0,
          lifetime_purchased: 0,
          lifetime_earned: 0,
          lifetime_withdrawn: 0,
        })
        .select('*')
        .maybeSingle();

      // Record welcome notification
      await supabaseAdmin.from('notifications').insert({
        user_id: uid,
        title: 'Welcome to Meova! 🎉',
        message: 'You have received 100 free Sparks to get started.',
        type: 'alert',
        read: false,
        created_at: new Date().toISOString(),
      });

      return inserted || defaultWallet(uid, email);
    }

    return existingWallet;
  } catch (err) {
    console.error('[getOrCreateWallet]', err.message);
    return defaultWallet(uid, email);
  }
};

export async function getTransactions(uid, limit = 20) {
  if (!uid) return [];
  try {
    const [{ data: txData }, { data: prData }] = await Promise.all([
      supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(limit),
      supabaseAdmin
        .from('payment_requests')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(limit),
    ]);

    const all = [];

    (txData || []).forEach(tx => {
      all.push({ ...tx });
    });

    (prData || []).forEach(pr => {
      if (pr.status === 'approved' || pr.status === 'payment_intent') return;
      all.push({
        id: pr.id,
        ...pr,
        amount: pr.sparks,
        title: `Purchase Request (${pr.status})`,
        isRequest: true,
        requestStatus: pr.status,
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
      .from('payment_requests')
      .select('*')
      .eq('user_id', uid)
      .eq('status', 'pending');

    if (error) return [];
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
      .from('payment_requests')
      .select('*')
      .eq('status', 'pending');

    if (error) return [];
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
      supabaseAdmin.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
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

// ── Atomic Spend RPC (handles row-level FOR UPDATE lock & transaction log) ───

export async function spendSparks(uid, amount, description = 'Sparks Spent', type = 'booking_escrow', referenceId = null) {
  if (!uid || amount <= 0) return { ok: false, error: 'Invalid args' };
  try {
    const { data, error } = await supabaseAdmin.rpc('spend_sparks', {
      p_user_id: uid,
      p_amount: amount,
      p_description: description,
      p_type: type,
      p_reference_id: referenceId,
    });

    if (error) {
      console.error('[spendSparks RPC Warning]', error.message);
      return { ok: false, error: error.message };
    }

    return { ok: true, data };
  } catch (err) {
    console.error('[spendSparks]', err.message);
    return { ok: false, error: err.message };
  }
}

// ── Atomic Credit RPC (updates bucket + lifetime counter + transaction log) ──

export async function creditSparks(
  uid,
  amount,
  bucket = 'purchased',
  type = 'purchase',
  description = 'Sparks Credited',
  referenceId = null
) {
  if (!uid || amount <= 0) return { ok: false, error: 'Invalid args' };
  try {
    const { data, error } = await supabaseAdmin.rpc('credit_sparks', {
      p_user_id: uid,
      p_amount: amount,
      p_bucket: bucket,
      p_type: type,
      p_description: description,
      p_reference_id: referenceId,
    });

    if (error) {
      console.error('[creditSparks RPC Warning]', error.message);
      return { ok: false, error: error.message };
    }

    return { ok: true, data };
  } catch (err) {
    console.error('[creditSparks]', err.message);
    return { ok: false, error: err.message };
  }
}

// ── Atomic Withdrawal Payout RPC (deducts creator + updates lifetime_withdrawn) ──

export async function recordWithdrawalPayout(uid, amount, withdrawalId) {
  if (!uid || amount <= 0 || !withdrawalId) return { ok: false, error: 'Invalid args' };
  try {
    const { data, error } = await supabaseAdmin.rpc('record_withdrawal_payout', {
      p_user_id: uid,
      p_amount: amount,
      p_withdrawal_id: withdrawalId,
    });

    if (error) {
      console.error('[recordWithdrawalPayout RPC Warning]', error.message);
      return { ok: false, error: error.message };
    }

    return { ok: true, data };
  } catch (err) {
    console.error('[recordWithdrawalPayout]', err.message);
    return { ok: false, error: err.message };
  }
}
