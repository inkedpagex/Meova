'use server';

import { revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '../../lib/supabase/admin';
import { TABLE_PROFILES } from './constants';
import { getUserAdmin } from '../../lib/getUserAdmin';

export async function updateProfileAdmin(updates) {
  try {
    const user = await getUserAdmin();
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Store overrides in cookie for immediate UI reflection (photo_url may be base64)
    const cookieUpdates = { ...updates };
    if (cookieUpdates.photo_url && cookieUpdates.photo_url.startsWith('data:')) {
      delete cookieUpdates.photo_url;
    }

    const cookieStore = await cookies();
    cookieStore.set('__Meova_profile_overrides', JSON.stringify(cookieUpdates), {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    });

    // Update profile in Supabase
    const { error } = await supabaseAdmin
      .from(TABLE_PROFILES)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      console.error('[updateProfileAdmin] Supabase error:', error.message);
      // Non-fatal — cookie was already set for immediate UI update
    }

    // Revalidate the persistent cache so the user sees fresh data immediately
    revalidateTag('user-profile-data');

    return { success: true };
  } catch (error) {
    console.error('[updateProfileAdmin] Error:', error);
    return { success: false, error: error.message };
  }
}
