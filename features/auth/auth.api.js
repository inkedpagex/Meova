// Handles Supabase authentication API calls.
// No UI or state logic here.
import { supabase } from '../../lib/supabase/client';
import { createProfileAdmin } from './auth.actions';

// Helper to create the session cookie via our Next.js Route Handler
async function createSessionCookie(tokenOrPayload, profileOverrides = null) {
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      idToken: typeof tokenOrPayload === 'string' ? tokenOrPayload : tokenOrPayload?.access_token || tokenOrPayload?.id,
      profileOverrides 
    })
  });
  if (!res.ok) throw new Error('Failed to create session');
}

export async function signUpUser({ email, password, fullName, year, branch, interests, photoUrl, age, lookingFor, studyStyle, isHost }) {
  // 1. Sign up with Supabase
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        photo_url: photoUrl,
      }
    }
  });

  if (error) throw error;
  const user = data.user;
  if (!user) throw new Error('Sign up failed. Please try again.');

  // 2. Create profile document
  try {
    const res = await createProfileAdmin({
      id: user.id,
      email: user.email,
      full_name: fullName,
      year,
      branch,
      interests,
      photo_url: photoUrl,
      age: Number(age) || 20,
      lookingFor: lookingFor || 'New friends & hangouts',
      studyStyle: studyStyle || 'Interactive group study',
      isHost: isHost === undefined ? false : isHost
    });
    if (!res.success) console.warn('[signUpUser] Profile notice:', res.error);
  } catch (profileError) {
    console.error('Profile DB insert error:', profileError);
  }

  // 3. Create session cookie with profile overrides
  const token = data.session?.access_token || user.id;
  const profileOverrides = {
    full_name: fullName,
    year,
    branch,
    interests,
    photo_url: photoUrl,
    age: Number(age) || 20,
    lookingFor: lookingFor || 'New friends & hangouts',
    studyStyle: studyStyle || 'Interactive group study',
    isHost: isHost === undefined ? false : isHost
  };
  await createSessionCookie(token, profileOverrides);

  return user;
}

export async function logInUser({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  const user = data.user;
  if (!user) throw new Error('Login failed. Please check credentials.');

  // Create session cookie
  const token = data.session?.access_token || user.id;
  await createSessionCookie(token);

  return user;
}

export async function logOutUser() {
  await supabase.auth.signOut();
  await fetch('/api/auth/session', { method: 'DELETE' });
}

export async function logInWithGoogle(idToken = null, accessToken = null) {
  try {
    // Authenticate with Google via our backend endpoint which creates/links Supabase profile & sets session cookie
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken, idToken })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to authenticate with backend');

    return { user: data.user, isNewUser: data.isNewUser };
  } catch (err) {
    console.error("Google Auth failed:", err);
    throw err;
  }
}

