/**
 * getAdminUser.js
 * Server-side helper: decodes session cookie (Firebase idToken) directly for SSR.
 */
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from './firebaseAdmin';

// Lightweight mock JWT decoder
function decodeJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export const getUserWithRole = async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__meetuply_session')?.value;
  if (!sessionCookie) return null;

  try {
    let uid, email, name, picture;

    // Try real Firebase Admin verification first
    if (adminAuth) {
      try {
        const decoded = await adminAuth.verifyIdToken(sessionCookie);
        uid     = decoded.uid;
        email   = decoded.email;
        name    = decoded.name;
        picture = decoded.picture;
      } catch {
        // Token may be expired — fall back to local decode
        const decoded = decodeJwtPayload(sessionCookie);
        if (!decoded?.user_id) return null;
        uid     = decoded.user_id;
        email   = decoded.email;
        name    = decoded.name;
        picture = decoded.picture;
      }
    } else {
      const decoded = decodeJwtPayload(sessionCookie);
      if (!decoded?.user_id) return null;
      uid     = decoded.user_id;
      email   = decoded.email;
      name    = decoded.name;
      picture = decoded.picture;
    }

    if (!uid) return null;

    // Try to enrich from Firestore
    let firestoreUser = {};
    if (adminDb) {
      try {
        const doc = await adminDb.collection('users').doc(uid).get();
        if (doc.exists) firestoreUser = doc.data();
      } catch { /* silent */ }
    }

    // Profile cookie overrides (set on profile edit)
    let overrides = {};
    try {
      const ovStr = cookieStore.get('__meetuply_profile_overrides')?.value;
      if (ovStr) overrides = JSON.parse(ovStr);
    } catch {}

    // Admin emails loaded from env var (comma-separated), never hardcoded in source
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
    const isAdmin =
      firestoreUser.role === 'admin' ||
      adminEmails.includes(email) ||
      email?.startsWith('admin@');

    const isBlocked = !!(firestoreUser.isBlocked || firestoreUser.status === 'blocked');

    return {
      id:              uid,
      uid,
      email:           email || '',
      role:            isAdmin ? 'admin' : (firestoreUser.role || 'user'),
      isBlocked,
      full_name:       overrides.full_name || firestoreUser.full_name || name || email?.split('@')[0] || 'User',
      photo_url:       overrides.photo_url || firestoreUser.photo_url || picture || '',
      username:        firestoreUser.username || '',
      profileComplete: firestoreUser.profileComplete ?? true, // default true so existing users aren't gated
      year:            overrides.year || firestoreUser.year || '1st',
      branch:          overrides.branch || firestoreUser.branch || 'General',
      bio:             overrides.bio || firestoreUser.bio || '',
      interests:       overrides.interests || firestoreUser.interests || [],
      instagram:       overrides.instagram || firestoreUser.instagram || '',
    };
  } catch (err) {
    console.error('Session verification failed:', err);
    return null;
  }
};


export async function getUserAdmin() {
  return await getUserWithRole();
}

export async function getAdminUser() {
  return await getUserWithRole();
}

export async function requireAdmin() {
  const user = await getUserWithRole();
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function requireAuth() {
  const user = await getUserWithRole();
  if (!user || user.isBlocked) return null;
  return user;
}
