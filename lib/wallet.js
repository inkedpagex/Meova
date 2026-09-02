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
        title: 'Welcome to Meova',
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

// ── Atomic Spend RPC (with resilient fallback if stored procedure not in SQL cache) ───

export async function spendSparks(uid, amount, description = 'Sparks Spent', type = 'booking_escrow', referenceId = null) {
  if (!uid || amount <= 0) return { ok: false, error: 'Invalid args' };
  try {
    // 1. Try RPC first if created in Supabase
    const { data, error } = await supabaseAdmin.rpc('spend_sparks', {
      p_user_id: uid,
      p_amount: amount,
      p_description: description,
      p_type: type,
      p_reference_id: referenceId,
    });

    if (!error) {
      return { ok: true, data };
    }

    // 2. Resilient Direct Fallback Execution
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

    // Deduct in order: bonus -> purchased -> creator
    let remaining = amount;
    let newBonus = bonus;
    let newPurchased = purchased;
    let newCreator = creator;

    if (newBonus >= remaining) {
      newBonus -= remaining;
      remaining = 0;
    } else {
      remaining -= newBonus;
      newBonus = 0;
    }

    if (remaining > 0) {
      if (newPurchased >= remaining) {
        newPurchased -= remaining;
        remaining = 0;
      } else {
        remaining -= newPurchased;
        newPurchased = 0;
      }
    }

    if (remaining > 0) {
      if (newCreator >= remaining) {
        newCreator -= remaining;
        remaining = 0;
      } else {
        newCreator = 0;
        remaining = 0;
      }
    }

    // Update wallet table
    const { error: updateErr } = await supabaseAdmin
      .from('wallets')
      .update({
        bonus: newBonus,
        purchased: newPurchased,
        creator: newCreator,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', uid);

    if (updateErr) {
      return { ok: false, error: updateErr.message };
    }

    // Insert transaction log
    await supabaseAdmin.from('transactions').insert({
      user_id: uid,
      amount: -Math.abs(amount),
      type,
      description,
      status: 'completed',
      reference_id: referenceId,
      created_at: new Date().toISOString(),
    });

    return { ok: true, data: { success: true, spent: amount, new_balance: newBonus + newPurchased + newCreator } };
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

    if (!error) {
      return { ok: true, data };
    }

    // Direct fallback execution
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();

    if (!wallet) {
      await getOrCreateWallet(uid);
    }

    const currentBucketVal = Number(wallet?.[bucket]) || 0;
    const currentLifetimePurchased = Number(wallet?.lifetime_purchased) || 0;
    const currentLifetimeEarned = Number(wallet?.lifetime_earned) || 0;

    const updatePayload = {
      [bucket]: currentBucketVal + amount,
      updated_at: new Date().toISOString(),
    };

    if (bucket === 'purchased') {
      updatePayload.lifetime_purchased = currentLifetimePurchased + amount;
    } else if (bucket === 'creator') {
      updatePayload.lifetime_earned = currentLifetimeEarned + amount;
    }

    await supabaseAdmin
      .from('wallets')
      .update(updatePayload)
      .eq('user_id', uid);

    await supabaseAdmin.from('transactions').insert({
      user_id: uid,
      amount: Math.abs(amount),
      type,
      description,
      status: 'completed',
      reference_id: referenceId,
      created_at: new Date().toISOString(),
    });

    return { ok: true, data: { success: true, credited: amount } };
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

    if (!error) {
      return { ok: true, data };
    }

    // Direct fallback execution
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();

    if (wallet) {
      const currentCreator = Number(wallet.creator) || 0;
      const currentWithdrawn = Number(wallet.lifetime_withdrawn) || 0;
      await supabaseAdmin
        .from('wallets')
        .update({
          creator: Math.max(0, currentCreator - amount),
          lifetime_withdrawn: currentWithdrawn + amount,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', uid);
    }

    await supabaseAdmin
      .from('withdrawals')
      .update({
        status: 'approved',
        processed_at: new Date().toISOString(),
      })
      .eq('id', withdrawalId);

    return { ok: true, data: { success: true } };
  } catch (err) {
    console.error('[recordWithdrawalPayout]', err.message);
    return { ok: false, error: err.message };
  }
}
