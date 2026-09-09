import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createProfileAdmin } from '@/features/auth/auth.actions';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

const SESSION_COOKIE_NAME = '__Meova_session';
const SESSION_DURATION_MS = 60 * 60 * 24 * 5 * 1000; // 5 days

export const dynamic = 'force-dynamic';


export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`auth:${ip}`, { limit: 20, windowMs: 5 * 60_000 });
    if (!rl.ok) {
      return NextResponse.json({ error: 'Too many login attempts. Please try again later.' }, {
        status: 429,
        headers: { 'Retry-After': rl.retryAfter }
      });
    }

    const { accessToken, termsAccepted, termsVersion } = await request.json();
    if (!accessToken) {
      return NextResponse.json({ error: 'Access token required' }, { status: 400 });
    }

    // 1. Verify the Google access token by fetching the user profile from Google
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (!googleRes.ok) {
      console.error('Google token verification failed:', await googleRes.text());
      return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 });
    }

    const googleUser = await googleRes.json();
    if (!googleUser.email) {
      return NextResponse.json({ error: 'No email associated with this Google account' }, { status: 400 });
    }

    // 2. Fetch or create Supabase user (Fast direct query — no listUsers scan)
    let authUser = null;
    let isNewUser = false;

    // Check if profile exists first in public.profiles
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, profile_complete, username')
      .eq('email', googleUser.email)
      .maybeSingle();

    if (existingProfile) {
      authUser = { id: existingProfile.id, email: existingProfile.email };
      // If user hasn't finished onboarding or doesn't have a username, treat as new user
      if (!existingProfile.profile_complete || !existingProfile.username) {
        isNewUser = true;
      }
    } else {
      isNewUser = true;
      try {
        const { data: newUserData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: googleUser.email,
          email_confirm: true,
          user_metadata: {
            full_name: googleUser.name || googleUser.email.split('@')[0],
            avatar_url: googleUser.picture || '',
            google_sub: googleUser.sub,
          },
        });

        if (createErr) {
          // If auth user already exists in auth.users, fallback to existing auth ID
          console.warn('[Google Auth] createUser warning:', createErr.message);
          authUser = { id: googleUser.sub || `usr_${Date.now()}`, email: googleUser.email };
        } else {
          authUser = newUserData.user;
        }
      } catch (authErr) {
        console.warn('[Google Auth] Supabase auth fallback:', authErr.message);
        authUser = { id: googleUser.sub || `usr_${Date.now()}`, email: googleUser.email };
      }
    }

    // 3. Create or update profile record in public.profiles
    const profileRes = await createProfileAdmin({
      id: authUser.id,
      email: googleUser.email,
      full_name: googleUser.name || googleUser.email.split('@')[0],
      photo_url: googleUser.picture || '',
      year: '1st',
      branch: 'General',
      interests: [],
      termsAccepted: termsAccepted === true,
      termsVersion: termsVersion || '2026.1',
    });

    if (profileRes?.isNewUser || !existingProfile?.profile_complete || !existingProfile?.username) {
      isNewUser = true;
    }

    // 4. Set session cookie with token payload
    const cookieStore = await cookies();
    const sessionPayload = Buffer.from(JSON.stringify({
      sub: authUser.id,
      user_id: authUser.id,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor((Date.now() + SESSION_DURATION_MS) / 1000)
    })).toString('base64');
    
    const token = `header.${sessionPayload}.sig`;

    const isProd = process.env.NODE_ENV === 'production';
    const host = request.headers.get('host') || '';
    const isAdminHost = host.startsWith('admin.');

    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);
    const userEmail = (googleUser.email || '').toLowerCase();
    const isAdmin =
      existingProfile?.role === 'admin' ||
      adminEmails.includes(userEmail);

    if (isAdminHost || isAdmin) {
      // Set dedicated host-only admin session cookie
      cookieStore.set('__Meova_admin_session', token, {
        maxAge: SESSION_DURATION_MS / 1000,
        httpOnly: true,
        secure: isProd,
        path: '/',
        sameSite: 'lax',
      });
    }

    cookieStore.set(SESSION_COOKIE_NAME, token, {
      maxAge: SESSION_DURATION_MS / 1000,
      httpOnly: true,
      secure: isProd,
      path: '/',
      sameSite: 'lax',
      ...(isProd && { domain: '.meova.in' }),
    });

    // Clear stale pc cookie if user needs onboarding
    if (isNewUser) {
      cookieStore.delete('__Meova_pc');
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authUser.id,
        uid: authUser.id,
        email: googleUser.email,
        displayName: googleUser.name,
        photoURL: googleUser.picture,
        profile_complete: !isNewUser,
        role: isAdmin ? 'admin' : (existingProfile?.role || 'user'),
      },
      isAdmin,
      isNewUser,
    });
  } catch (err) {
    console.error('[POST /api/auth/google]', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

