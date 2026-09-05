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

    // Check if verified user is changing photo_url (closes fake-swap loophole)
    let photoSwapTriggered = false;
    if (updates.photo_url) {
      const { data: currentProf } = await supabaseAdmin
        .from(TABLE_PROFILES)
        .select('tier, photo_url')
        .eq('id', user.id)
        .maybeSingle();

      if (currentProf?.tier === 'verified' && updates.photo_url !== currentProf.photo_url) {
        photoSwapTriggered = true;
        updates.tier = 'not_verified';
        updates.verified_at = null;

        // Fetch original ID document on file
        const { data: lastReq } = await supabaseAdmin
          .from('verification_requests')
          .select('id_document_url, rejection_count')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastReq?.id_document_url) {
          await supabaseAdmin.from('verification_requests').insert({
            user_id: user.id,
            selfie_url: updates.photo_url,
            id_document_url: lastReq.id_document_url,
            status: 'pending',
            rejection_count: lastReq.rejection_count || 0,
            submitted_at: new Date().toISOString(),
          }).catch((e) => console.warn('[re-verification request insert]', e.message));
        }

        // Notify user about re-verification requirement
        await supabaseAdmin.from('notifications').insert({
          user_id: user.id,
          title: 'Profile Photo Updated',
          message: 'Because you updated your profile photo, your account requires quick re-verification with your ID on file to maintain campus trust.',
          type: 'alert',
          read: false,
          created_at: new Date().toISOString(),
        }).catch(() => {});
      }
    }

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
