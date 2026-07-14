/**
 * getAdminUser.js
 * Server-side helper: verifies session cookie + fetches role + wallet from Firestore.
 * Extends getUserAdmin to include role data.
 */
import { cookies } from 'next/headers';
import { adminAuth, adminDb, isFirebaseAdminConfigured } from './firebaseAdmin';
import { cache } from 'react';
const getCachedUserData = async (uid) => {
  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) return {};
    return JSON.parse(JSON.stringify(userDoc.data()));
  } catch (err) {
    console.warn("Firestore user query failed:", err.message);
    return {};
  }
};

export const getUserWithRole = cache(async () => {
  if (!isFirebaseAdminConfigured || !adminAuth) return null;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__meetify_session')?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const uid = decoded.uid;

    // Use unstable_cache to avoid hitting Firestore on every page transition
    // Note: passing dynamic keys to unstable_cache is done by passing arguments to the cached function!
    const userData = await getCachedUserData(uid);

    return {
      id:    uid,
      uid,
      email: decoded.email,
      role:  userData.role || 'user',
      ...userData,
    };
  } catch (err) {
    console.error("Session verification failed:", err);
    return null;
  }
});

export async function requireAdmin() {
  const user = await getUserWithRole();
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function requireAuth() {
  const user = await getUserWithRole();
  if (!user) return null;
  return user;
}
