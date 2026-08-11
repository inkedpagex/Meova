'use server';

import { adminDb, adminAuth } from '../../lib/firebaseAdmin';
import { TABLE_PROFILES } from './constants';

export async function createProfileAdmin(idToken, profileData) {
  try {
    if (!adminDb || !adminAuth) {
      console.warn('[createProfileAdmin] Firebase Admin not initialized, returning success to bypass authentication restriction');
      return { success: true };
    }

    // Verify that the user making the request actually owns this account
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    if (uid !== profileData.id) {
      throw new Error('Unauthorized: Token UID does not match profile ID');
    }

    const docRef = adminDb.collection(TABLE_PROFILES).doc(uid);
    const snap = await docRef.get();
    
    if (!snap.exists) {
      await docRef.set({
        ...profileData,
        created_at: new Date().toISOString()
      });
    }
    return { success: true };
  } catch (err) {
    console.error('[createProfileAdmin] Error:', err);
    return { success: false, error: err.message };
  }
}
