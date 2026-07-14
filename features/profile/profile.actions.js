'use server';

import { revalidateTag } from 'next/cache';
import { adminDb } from '../../lib/firebaseAdmin';
import { TABLE_PROFILES } from './constants';
import { getUserAdmin } from '../../lib/getUserAdmin';

export async function updateProfileAdmin(updates) {
  try {
    const user = await getUserAdmin();
    if (!user) {
      throw new Error('Unauthorized');
    }

    if (!adminDb) {
      throw new Error('Firebase Admin not initialized');
    }

    const docRef = adminDb.collection(TABLE_PROFILES).doc(user.id);
    await docRef.update({
      ...updates,
      updated_at: new Date().toISOString()
    });

    // Revalidate the persistent cache so the user sees fresh data immediately
    revalidateTag('user-profile-data');

    return { success: true };
  } catch (error) {
    console.error('[updateProfileAdmin] Error:', error);
    return { success: false, error: error.message };
  }
}
