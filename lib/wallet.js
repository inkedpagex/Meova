/**
 * wallet.js
 * Server-side wallet helpers using Firebase Admin Firestore.
 * All reads/writes go to the 'wallets' and 'transactions' collections.
 */
import { adminDb } from './firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

// ── Default wallet shape ─────────────────────────────────────────────────────

function defaultWallet(uid, email = '') {
  return {
    id: uid,
    userId: uid,
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

function serializeWallet(doc) {
  if (!doc.exists) return null;
  const data = doc.data();
  const clean = {};
  for (const [k, v] of Object.entries(data)) {
    clean[k] = v && typeof v.toDate === 'function' ? v.toDate().toISOString() : v;
  }
  return { id: doc.id, ...clean };
}

// ── Read ──────────────────────────────────────────────────────────────────────

export const getWallet = async (uid) => {
  if (!adminDb || !uid) return defaultWallet(uid);
  try {
    const doc = await adminDb.collection('wallets').doc(uid).get();
    if (!doc.exists) return defaultWallet(uid);
    return serializeWallet(doc);
  } catch (err) {
    console.error('[getWallet]', err.message);
    return defaultWallet(uid);
  }
};

export const getOrCreateWallet = async (uid, email = '') => {
  if (!adminDb || !uid) return defaultWallet(uid, email);
  try {
    const ref = adminDb.collection('wallets').doc(uid);
    const doc = await ref.get();
    if (!doc.exists) {
      const wallet = defaultWallet(uid, email);
      wallet.bonus = 100;
      await ref.set(wallet);
      
      // Transaction
      await adminDb.collection('transactions').doc().set({
        userId: uid, type: 'bonus', amount: 100, description: 'Welcome Bonus',
        status: 'COMPLETED', created_at: new Date().toISOString()
      });
      
      // Notification
      await adminDb.collection('users').doc(uid).collection('notifications').doc().set({
        title: 'Welcome to Meetify! 🎉',
        message: 'You have received 100 free Sparks to get started.',
        type: 'alert', read: false, created_at: new Date().toISOString()
      });

      return wallet;
    }
    return serializeWallet(doc);
  } catch (err) {
    console.error('[getOrCreateWallet]', err.message);
    return defaultWallet(uid, email);
  }
};

export async function getTransactions(uid, limit = 20) {
  if (!adminDb || !uid) return [];
  try {
    const [txSnap, prSnap] = await Promise.all([
      adminDb.collection('transactions').where('userId', '==', uid).orderBy('created_at', 'desc').limit(limit).get(),
      adminDb.collection('payment_requests').where('userId', '==', uid).orderBy('created_at', 'desc').limit(limit).get()
    ]);

    const all = [];

    txSnap.docs.forEach(doc => {
      const data = doc.data();
      const clean = {};
      for (const [k, v] of Object.entries(data)) {
        clean[k] = v && typeof v.toDate === 'function' ? v.toDate().toISOString() : v;
      }
      all.push({ id: doc.id, ...clean });
    });

    prSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.status === 'approved' || data.status === 'payment_intent') return;
      
      const clean = {};
      for (const [k, v] of Object.entries(data)) {
        clean[k] = v && typeof v.toDate === 'function' ? v.toDate().toISOString() : v;
      }
      all.push({
        id: doc.id,
        ...clean,
        amount: clean.sparks,
        title: `Purchase Request (${clean.status})`,
        isRequest: true,
        requestStatus: clean.status
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
  if (!adminDb || !uid) return [];
  try {
    const snap = await adminDb
      .collection('withdrawals')
      .where('userId', '==', uid)
      .orderBy('requested_at', 'desc')
      .get();
    if (snap.empty) return [];
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error('[getWithdrawals]', err.message);
    return [];
  }
}

export async function getUserPendingPayments(uid) {
  if (!adminDb || !uid) return [];
  try {
    const snap = await adminDb
      .collection('payment_requests')
      .where('userId', '==', uid)
      .where('status', '==', 'pending')
      .get();
    if (snap.empty) return [];
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error('[getUserPendingPayments]', err.message);
    return [];
  }
}

// ── Admin reads ────────────────────────────────────────────────────────────────

export async function getAllPendingWithdrawals() {
  if (!adminDb) return [];
  try {
    const snap = await adminDb
      .collection('withdrawals')
      .where('status', '==', 'pending')
      .get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error('[getAllPendingWithdrawals]', err.message);
    return [];
  }
}

export async function getAllPendingPayments() {
  if (!adminDb) return [];
  try {
    const snap = await adminDb
      .collection('payment_requests')
      .where('status', '==', 'pending')
      .get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error('[getAllPendingPayments]', err.message);
    return [];
  }
}

export async function getAdminStats() {
  if (!adminDb) return { totalUsers: 0, totalTransactions: 0, pendingWithdrawals: 0, pendingPayments: 0, totalSparksInCirculation: 0, lifetimePurchasedSparks: 0 };
  try {
    const [usersSnap, txSnap, wdSnap, pmSnap] = await Promise.all([
      adminDb.collection('users').count().get(),
      adminDb.collection('transactions').count().get(),
      adminDb.collection('withdrawals').where('status', '==', 'pending').count().get(),
      adminDb.collection('payment_requests').where('status', '==', 'pending').count().get(),
    ]);
    return {
      totalUsers: usersSnap.data().count,
      totalTransactions: txSnap.data().count,
      pendingWithdrawals: wdSnap.data().count,
      pendingPayments: pmSnap.data().count,
      totalSparksInCirculation: 0,
      lifetimePurchasedSparks: 0,
    };
  } catch (err) {
    console.error('[getAdminStats]', err.message);
    return { totalUsers: 0, totalTransactions: 0, pendingWithdrawals: 0, pendingPayments: 0, totalSparksInCirculation: 0, lifetimePurchasedSparks: 0 };
  }
}

// ── Spend logic (used by API routes) ─────────────────────────────────────────

export async function spendSparks(uid, amount, { useCreator = true } = {}) {
  if (!adminDb || !uid || amount <= 0) return { ok: false, error: 'Invalid args' };
  try {
    const ref = adminDb.collection('wallets').doc(uid);
    let result = { ok: false };

    await adminDb.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      if (!doc.exists) throw new Error('Wallet not found');
      const w = doc.data();

      const total = (w.purchased || 0) + (w.bonus || 0) + (useCreator ? (w.creator || 0) : 0);
      if (total < amount) throw new Error('Insufficient Sparks');

      // Deduct: purchased first, then bonus, then creator (if allowed)
      let remaining = amount;
      const updates = {};

      const deductPurchased = Math.min(w.purchased || 0, remaining);
      updates.purchased = (w.purchased || 0) - deductPurchased;
      remaining -= deductPurchased;

      if (remaining > 0) {
        const deductBonus = Math.min(w.bonus || 0, remaining);
        updates.bonus = (w.bonus || 0) - deductBonus;
        remaining -= deductBonus;
      }

      if (remaining > 0 && useCreator) {
        const deductCreator = Math.min(w.creator || 0, remaining);
        updates.creator = (w.creator || 0) - deductCreator;
        remaining -= deductCreator;
      }

      updates.updated_at = new Date().toISOString();
      tx.update(ref, updates);
      result = { ok: true };
    });

    return result;
  } catch (err) {
    console.error('[spendSparks]', err.message);
    return { ok: false, error: err.message };
  }
}

// ── Credit Sparks (admin approved payment) ────────────────────────────────────

export async function creditSparks(uid, amount, type = 'purchased') {
  if (!adminDb || !uid || amount <= 0) return { ok: false };
  try {
    const ref = adminDb.collection('wallets').doc(uid);
    await adminDb.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      if (!doc.exists) {
        tx.set(ref, { ...defaultWallet(uid), [type]: amount, updated_at: new Date().toISOString() });
      } else {
        tx.update(ref, {
          [type]: FieldValue.increment(amount),
          [`lifetime_${type === 'purchased' ? 'purchased' : 'earned'}`]: FieldValue.increment(amount),
          updated_at: new Date().toISOString(),
        });
      }
    });
    return { ok: true };
  } catch (err) {
    console.error('[creditSparks]', err.message);
    return { ok: false, error: err.message };
  }
}
