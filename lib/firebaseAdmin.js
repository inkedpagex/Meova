// Firebase Admin SDK — the ONLY file that initializes Firebase Admin for Server Components/Route Handlers.
// No UI or state logic here. Never throws at module load — all errors are caught gracefully.

// Force Vercel to trace the entire firebase-admin package
import 'firebase-admin';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY
    ?.replace(/^['"]|['"]$/g, '')
    ?.replace(/\\n/g, '\n')
    ?.trim(),
};

export const isFirebaseAdminConfigured =
  !!process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_PROJECT_ID !== 'your-project-id' &&
  !!process.env.FIREBASE_PRIVATE_KEY &&
  !process.env.FIREBASE_PRIVATE_KEY.includes('YOUR_KEY_HERE');

function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  if (!isFirebaseAdminConfigured) {
    throw new Error('Firebase Admin environment variables are missing or invalid.');
  }
  return initializeApp({
    credential: cert(serviceAccount),
  });
}

function safeGetAuth() {
  try {
    return getAuth(getAdminApp());
  } catch (err) {
    console.error('[firebaseAdmin] Failed to initialize Auth:', err.message);
    return null;
  }
}

function safeGetFirestore() {
  try {
    const db = getFirestore(getAdminApp());
    // CRITICAL FIX: Force REST API instead of gRPC. 
    // gRPC hangs indefinitely on Vercel Serverless Functions causing 504 timeouts and Next.js "This page couldn't load" errors.
    db.settings({ preferRest: true });
    return db;
  } catch (err) {
    console.error('[firebaseAdmin] Failed to initialize Firestore:', err.message);
    return null;
  }
}

export const adminDb = isFirebaseAdminConfigured ? safeGetFirestore() : null;
export const adminAuth = isFirebaseAdminConfigured ? safeGetAuth() : null;
