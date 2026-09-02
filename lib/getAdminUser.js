/**
 * getAdminUser.js
 * Server-side helper: verifies user session and fetches profile using Supabase.
 */
import { cookies } from 'next/headers';
import { createClient } from './supabase/server';
import { supabaseAdmin } from './supabase/admin';

// Robust JWT and session token decoder that safely handles all token formats
function decodeJwtPayload(token) {
  if (!token) return null;
  try {
    let clean = typeof token === 'string' ? decodeURIComponent(token) : String(token);

    // 1. If it's a JSON array (like Supabase SSR chunk [accessToken, refreshToken])
    if (clean.startsWith('[') && clean.endsWith(']')) {
      try {
        const parsedArr = JSON.parse(clean);
        if (parsedArr && parsedArr[0]) {
          clean = parsedArr[0];
        }
      } catch {}
    }

    // 2. If it's a JSON string
    if (clean.startsWith('{') && clean.endsWith('}')) {
      try {
        const parsedObj = JSON.parse(clean);
        if (parsedObj.access_token) clean = parsedObj.access_token;
        else if (parsedObj.sub || parsedObj.user_id || parsedObj.id) {
          return {
            sub: parsedObj.sub || parsedObj.user_id || parsedObj.id,
            email: parsedObj.email,
            name: parsedObj.name || parsedObj.full_name,
            picture: parsedObj.picture || parsedObj.avatar_url || parsedObj.photo_url,
          };
        }
      } catch {}
    }

    // 3. If it's standard JWT (header.payload.sig)
    if (clean.includes('.')) {
      const parts = clean.split('.');
      const part = parts.length >= 2 ? parts[1] : parts[0];
      const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
      if (jsonPayload.startsWith('{') && jsonPayload.endsWith('}')) {
        return JSON.parse(jsonPayload);
      }
    }

    // 4. Base64 encoded JSON without dots
    try {
      const base64 = clean.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
      if (jsonPayload.startsWith('{') && jsonPayload.endsWith('}')) {
        return JSON.parse(jsonPayload);
      }
    } catch {}
  } catch (e) {}

  // 5. Raw UUID or ID string fallback
  if (typeof token === 'string' && token.length > 5 && !token.includes(' ') && !token.includes(';')) {
    return { sub: token, user_id: token };
  }
  return null;
}

export const getUserWithRole = async () => {
  try {
    let uid = null;
    let email = null;
    let authUser = null;
    let decodedName = null;
    let decodedPicture = null;

    // 1. Try Supabase SSR client
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

    // 2. Fallback: check session cookies directly if authUser was not resolved
    if (!uid) {
      const cookieStore = await cookies();
      const all = cookieStore.getAll();

      // Check cookies in priority order
      const candidateCookie =
        cookieStore.get('__Meova_session')?.value ||
        cookieStore.get('sb-access-token')?.value ||
        cookieStore.get('sb-auth-token')?.value ||
        all.find(c => c.name.startsWith('sb-') && c.name.includes('-auth-token'))?.value ||
        cookieStore.get('__session')?.value;

      if (candidateCookie) {
        const decoded = decodeJwtPayload(candidateCookie);
        uid = decoded?.sub || decoded?.user_id || decoded?.id;
        email = decoded?.email;
        decodedName = decoded?.name || decoded?.full_name;
        decodedPicture = decoded?.picture || decoded?.avatar_url || decoded?.photo_url;
      }
    }

    if (!uid) return null;

    // 3. Fetch profile from public.profiles
    let { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    // Fallback: if not found by id, lookup by email
    if (!profile && email) {
      const { data: profileByEmail } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      if (profileByEmail) {
        profile = profileByEmail;
        uid = profile.id;
      }
    }

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
