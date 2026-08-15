/**
 * firebaseAdmin.js
 * Real Firebase Admin SDK initialization.
 * Only runs on the server (Node.js runtime) — never bundled for the browser.
 */
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminApp = null;
let adminDb = null;
let adminAuth = null;
let isFirebaseAdminConfigured = false;

function initAdmin() {
  if (adminApp) return; // Already initialized

  const projectId    = process.env.FIREBASE_PROJECT_ID;
  const clientEmail  = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey   = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('[firebaseAdmin] Missing env vars — admin SDK disabled.');
    return;
  }

  try {
    if (getApps().some(a => a.name === 'admin')) {
      adminApp = getApps().find(a => a.name === 'admin');
    } else {
      adminApp = initializeApp(
        { credential: cert({ projectId, clientEmail, privateKey }) },
        'admin'
      );
    }
    adminDb  = getFirestore(adminApp);
    adminAuth = getAuth(adminApp);
    isFirebaseAdminConfigured = true;
    console.log('[firebaseAdmin] ✅ Initialized successfully');
  } catch (err) {
    console.error('[firebaseAdmin] ❌ Init failed:', err.message);
  }
}

// Initialize immediately when module is first imported (server-side only)
if (typeof window === 'undefined') {
  initAdmin();
}

export { adminDb, adminAuth, isFirebaseAdminConfigured };
