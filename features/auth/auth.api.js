// Handles all Firebase authentication API calls.
// No UI or state logic here.
import { auth, db } from '../../lib/firebaseClient';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { TABLE_PROFILES } from './constants';

// Helper to create the session cookie via our Next.js Route Handler
async function createSessionCookie(user, profileOverrides = null) {
  const idToken = await user.getIdToken();
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, profileOverrides })
  });
  if (!res.ok) throw new Error('Failed to create session');
}

export async function signUpUser({ email, password, fullName, year, branch, interests, photoUrl, age, lookingFor, studyStyle, isHost }) {
  // 1. Sign up credentials
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // 2. Create profile document
  try {
    const idToken = await user.getIdToken();
    const { createProfileAdmin } = await import('./auth.actions');
    const res = await createProfileAdmin(idToken, {
      id: user.uid,
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
    if (!res.success) throw new Error(res.error);
  } catch (profileError) {
    console.error('Profile DB insert error:', profileError);
    throw new Error('User created but failed to save profile details.');
  }

  // 3. Create session cookie with profile overrides
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
  await createSessionCookie(user, profileOverrides);

  return user;
}

export async function logInUser({ email, password }) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Create session cookie
  await createSessionCookie(user);

  return user;
}

export async function logOutUser() {
  await signOut(auth);
  await fetch('/api/auth/session', { method: 'DELETE' });
}

export async function logInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    // Check if profile exists and create using secure admin action
    const idToken = await user.getIdToken();
    const { createProfileAdmin } = await import('./auth.actions');
    
    await createProfileAdmin(idToken, {
      id: user.uid,
      email: user.email,
      full_name: user.displayName || user.email.split('@')[0],
      year: '1st',
      branch: 'General',
      interests: []
    });

    // Create session cookie
    await createSessionCookie(user);
    return user;
  } catch (err) {
    console.error("Google popup login failed, trying redirect:", err);
    if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw err;
  }
}
