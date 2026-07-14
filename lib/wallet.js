/**
 * wallet.js
 * Server-side wallet helpers. Refactored to exclusively use mock data 
 * after the removal of firebase-admin.
 */

// ── Mock Fallback Data ──────────────────────────────────────────────────────

const MOCK_WALLET = (uid, email = '') => ({
  id: uid,
  userId: uid,
  email: email || 'user@example.com',
  purchased: 0,
  bonus: 0,
  creator: 0,
  lifetime_purchased: 0,
  lifetime_earned: 0,
  lifetime_withdrawn: 0,
  updated_at: new Date().toISOString(),
});

const MOCK_TRANSACTIONS = (uid) => [];

const MOCK_WITHDRAWALS = (uid) => [];

const MOCK_PAYMENTS = [];

// ── Read ──────────────────────────────────────────────────────────────────────

export const getWallet = async (uid) => {
  return MOCK_WALLET(uid);
};

export const getOrCreateWallet = async (uid, email = '') => {
  return MOCK_WALLET(uid, email);
};

export async function getTransactions(uid, limit = 20) {
  return MOCK_TRANSACTIONS(uid).slice(0, limit);
}

export async function getWithdrawals(uid) {
  return MOCK_WITHDRAWALS(uid);
}

// ── Admin reads ────────────────────────────────────────────────────────────────

export async function getAllPendingWithdrawals() {
  return [];
}

export async function getAllPendingPayments() {
  return [];
}

export async function getAdminStats() {
  return {
    totalUsers:          0,
    totalTransactions:   0,
    pendingWithdrawals:  0,
    pendingPayments:     0,
    totalSparksInCirculation: 0,
    lifetimePurchasedSparks: 0,
  };
}

// ── Spend logic (used by API routes) ─────────────────────────────────────────

export async function spendSparks(uid, amount, { useCreator = false } = {}) {
  // Simulate successful spend offline
  return { ok: true };
}
