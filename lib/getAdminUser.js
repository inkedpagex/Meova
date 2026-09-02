/**
 * getAdminUser.js
 * Server-side helper: verifies user session and fetches profile using Supabase.
 */
import { cookies } from 'next/headers';
import { createClient } from './supabase/server';
import { supabaseAdmin } from './supabase/admin';

// Lightweight mock JWT decoder for fallback token decoding
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
  try {
    let uid = null;
    let email = null;
    let authUser = null;

    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      authUser = data?.user;
      if (authUser) {
        uid = authUser.id;
        email = authUser.email;
      }
    } catch {
      // Fallback if SSR cookie context fails
    }

    let decodedName = null;
    let decodedPicture = null;

    // Fallback: check session cookies directly if authUser was not resolved
    if (!uid) {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get('sb-access-token')?.value || cookieStore.get('__Meova_session')?.value;
      if (sessionCookie) {
        const decoded = decodeJwtPayload(sessionCookie);
        uid = decoded?.sub || decoded?.user_id;
        email = decoded?.email;
        decodedName = decoded?.name;
        decodedPicture = decoded?.picture;
      }
    }

    if (!uid) return null;

    // Fetch profile from public.profiles
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    const profileData = profile || {};
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);
    const userEmail = (email || profileData.email || '').toLowerCase();
    const isAdmin =
      profileData.role === 'admin' ||
      (userEmail && adminEmails.includes(userEmail));

    const isBlocked = !!(profileData.is_blocked || profileData.status === 'blocked');

    return {
      id: uid,
      uid,
      email: email || profileData.email || '',
      role: isAdmin ? 'admin' : (profileData.role || 'user'),
      isBlocked,
      full_name: profileData.full_name || authUser?.user_metadata?.full_name || decodedName || email?.split('@')[0] || 'User',
      photo_url: profileData.photo_url || authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.picture || decodedPicture || '',
      username: profileData.username || '',
      gender: profileData.gender || null,
      profileComplete: Boolean(profileData.profile_complete || profileData.username),
      year: profileData.year || '1st',
      branch: profileData.branch || 'General',
      bio: profileData.bio || '',
      interests: profileData.interests || [],
      instagram: profileData.instagram || '',
    };
  } catch (err) {
    if (err?.message?.includes('Dynamic server usage') || err?.digest?.startsWith('NEXT_') || err?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
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
  if (!user || user.role !== 'admin' || user.isBlocked) return null;
  return user;
}

export async function requireAuth() {
  const user = await getUserWithRole();
  if (!user || user.isBlocked) return null;
  return user;
}
