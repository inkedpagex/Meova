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
  purchased: 120,
  bonus: 40,
  creator: 500,
  lifetime_purchased: 150,
  lifetime_earned: 500,
  lifetime_withdrawn: 0,
  updated_at: new Date().toISOString(),
});

const MOCK_TRANSACTIONS = (uid) => [
  {
    id: 'tx_1',
    userId: uid,
    type: 'purchase',
    amount: 100,
    sparks: 100,
    description: 'Purchased Sparks Pack',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'tx_2',
    userId: uid,
    type: 'spend',
    amount: 10,
    sparks: 10,
    description: 'RSVP to Intro to Web3',
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

const MOCK_WITHDRAWALS = (uid) => [
  {
    id: 'wd_1',
    userId: uid,
    amount: 1000,
    payment_method: 'UPI',
    upi_id: 'user@okicici',
    status: 'pending',
    requested_at: new Date(Date.now() - 43200000).toISOString(),
  }
];

const MOCK_PAYMENTS = [
  {
    id: 'pay_1',
    userId: 'user_1',
    email: 'user@example.com',
    amount: 49.00,
    sparks: 50,
    refCode: '123456',
    status: 'pending',
    created_at: new Date(Date.now() - 43200000).toISOString(),
  }
];

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
    totalUsers:          3,
    totalTransactions:   2,
    pendingWithdrawals:  1,
    pendingPayments:     1,
    totalSparksInCirculation: 660,
    lifetimePurchasedSparks: 150,
  };
}

// ── Spend logic (used by API routes) ─────────────────────────────────────────

export async function spendSparks(uid, amount, { useCreator = false } = {}) {
  // Simulate successful spend offline
  return { ok: true };
}
