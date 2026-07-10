// Firebase Admin SDK — the ONLY file that initializes Firebase Admin for Server Components/Route Handlers.
// No UI or state logic here. Never throws at module load — all errors are caught gracefully.
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export const isFirebaseAdminConfigured =
  !!process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_PROJECT_ID !== 'your-project-id' &&
  !!process.env.FIREBASE_PRIVATE_KEY &&
  !process.env.FIREBASE_PRIVATE_KEY.includes('YOUR_KEY_HERE');

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Vercel stores \n as \\n in env vars — this restores the real newlines, strips surrounding quotes, and trims whitespace
      privateKey: process.env.FIREBASE_PRIVATE_KEY
        ?.replace(/^['"]|['"]$/g, '')
        ?.replace(/\\n/g, '\n')
        ?.trim(),
    }),
  });
}

// Wrap in try/catch so a bad env var never crashes the entire server at module load
function safeGetAuth() {
  try {
    return getAuth(getAdminApp());
  } catch (err) {
    console.error('[firebaseAdmin] Failed to initialize Firebase Admin Auth:', err.message);
    return null;
  }
}

function safeGetFirestore() {
  try {
    const db = getFirestore(getAdminApp());
    db.settings({ preferRest: true });
    return db;
  } catch (err) {
    console.error('[firebaseAdmin] Failed to initialize Firebase Admin Firestore:', err.message);
    return null;
  }
}

export const adminAuth = isFirebaseAdminConfigured ? safeGetAuth() : null;
export const adminDb   = isFirebaseAdminConfigured ? safeGetFirestore() : null;
