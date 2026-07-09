/**
 * getAdminUser.js
 * Server-side helper: verifies session cookie + fetches role + wallet from Firestore.
 * Extends getUserAdmin to include role data.
 */
import { cookies } from 'next/headers';
import { adminAuth, adminDb, isFirebaseAdminConfigured } from './firebaseAdmin';

export async function getUserWithRole() {
  if (!isFirebaseAdminConfigured || !adminAuth) return null;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__meetify_session')?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const uid = decoded.uid;

    let userData = {};
    try {
      // Fetch role from Firestore
      const userDoc = await adminDb.collection('users').doc(uid).get();
      userData = userDoc.exists ? userDoc.data() : {};
    } catch (err) {
      console.warn("Firestore user query failed (likely quota limit). Using verified token data fallback:", err.message);
      userData = {
        name: decoded.name || decoded.email.split('@')[0],
        email: decoded.email,
        role: 'user',
      };
    }

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
}

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
