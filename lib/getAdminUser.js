/**
 * getAdminUser.js
 * Server-side helper: decodes session cookie (Firebase idToken) directly for SSR.
 */
import { cookies } from 'next/headers';
import { cache } from 'react';

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

export const getUserWithRole = cache(async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__meetify_session')?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = decodeJwtPayload(sessionCookie);
    if (!decoded || !decoded.user_id) return null;

    const uid = decoded.user_id;

    const isAdmin = 
      decoded.admin === true || 
      decoded.role === 'admin' || 
      decoded.email === 'chirag2006chak@gmail.com' ||
      decoded.email?.startsWith('admin@');

    let overrides = {};
    try {
      const ovStr = cookieStore.get('__meetify_profile_overrides')?.value;
      if (ovStr) overrides = JSON.parse(ovStr);
    } catch(e) {}

    // Use mock data since adminDb is removed
    return {
      id:    uid,
      uid,
      email: decoded.email || 'user@example.com',
      role:  isAdmin ? 'admin' : 'user',
      full_name: overrides.full_name || overrides.name || decoded.name || decoded.email?.split('@')[0] || 'User',
      year: overrides.year || '1st',
      branch: overrides.branch || 'General',
      bio: overrides.bio || '',
      interests: overrides.interests || [],
      instagram: overrides.instagram || ''
    };
  } catch (err) {
    console.error("Session verification failed:", err);
    return null;
  }
});

export async function getUserAdmin() {
  return await getUserWithRole();
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
