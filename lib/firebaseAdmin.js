// Firebase Admin SDK — the ONLY file that initializes Firebase Admin for Server Components/Route Handlers.
// No UI or state logic here.
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
      // Next.js env vars replace \n with \\n — this restores it
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const adminAuth = isFirebaseAdminConfigured ? getAuth(getAdminApp()) : null;
export const adminDb = isFirebaseAdminConfigured ? getFirestore(getAdminApp()) : null;
