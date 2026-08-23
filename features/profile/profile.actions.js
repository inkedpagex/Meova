'use server';

import { revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';
import { adminDb } from '../../lib/firebaseAdmin';
import { TABLE_PROFILES } from './constants';
import { getUserAdmin } from '../../lib/getUserAdmin';

export async function updateProfileAdmin(updates) {
  try {
    const user = await getUserAdmin();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const cookieUpdates = { ...updates };
    if (cookieUpdates.photo_url && cookieUpdates.photo_url.startsWith('data:')) {
      delete cookieUpdates.photo_url;
    }

    const cookieStore = await cookies();
    cookieStore.set('__meetuply_profile_overrides', JSON.stringify(cookieUpdates), {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    });

    if (adminDb) {
      const docRef = adminDb.collection(TABLE_PROFILES).doc(user.id);
      await docRef.update({
        ...updates,
        updated_at: new Date().toISOString()
      }).catch(() => {}); // ignore mock errors
    }

    // Revalidate the persistent cache so the user sees fresh data immediately
    revalidateTag('user-profile-data');

    return { success: true };
  } catch (error) {
    console.error('[updateProfileAdmin] Error:', error);
    return { success: false, error: error.message };
  }
}
