// Mock firebaseAdmin.js to prevent import errors across the application
// since firebase-admin has been completely removed to fix Vercel 500 errors.

export const adminDb = null;
export const adminAuth = null;
export const isFirebaseAdminConfigured = false;
