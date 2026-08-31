import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createProfileAdmin } from '@/features/auth/auth.actions';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

const SESSION_COOKIE_NAME = '__Meova_session';
const SESSION_DURATION_MS = 60 * 60 * 24 * 5 * 1000; // 5 days

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

    const { accessToken } = await request.json();
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

    // 2. Fetch or create Supabase user
    let authUser = null;
    let isNewUser = false;

    // Check if profile exists first
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', googleUser.email)
      .maybeSingle();

    if (existingProfile) {
      authUser = { id: existingProfile.id, email: existingProfile.email };
    } else {
      // Find or create in Supabase auth.users
      try {
        const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
        const matched = userList?.users?.find(u => u.email?.toLowerCase() === googleUser.email.toLowerCase());

        if (matched) {
          authUser = matched;
        } else {
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
            console.error('[Google Auth] Supabase admin createUser error:', createErr);
            throw createErr;
          }
          authUser = newUserData.user;
          isNewUser = true;
        }
      } catch (authErr) {
        console.warn('[Google Auth] Supabase auth list/create fallback:', authErr.message);
        // Fallback: Use google sub as profile ID if auth table is restricted
        authUser = { id: googleUser.sub || `usr_${Date.now()}`, email: googleUser.email };
        isNewUser = true;
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
    });

    if (profileRes?.isNewUser) {
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

    cookieStore.set(SESSION_COOKIE_NAME, token, {
      maxAge: SESSION_DURATION_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: authUser.id,
        uid: authUser.id,
        email: googleUser.email,
        displayName: googleUser.name,
        photoURL: googleUser.picture,
      },
      isNewUser,
    });
  } catch (err) {
    console.error('[POST /api/auth/google]', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

