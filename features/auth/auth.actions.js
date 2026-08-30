'use server';

import { supabaseAdmin } from '../../lib/supabase/admin';
import { creditSparks } from '../../lib/wallet';

export async function createProfileAdmin(profileData) {
  try {
    const uid = profileData?.id || profileData?.uid;
    if (!uid) {
      throw new Error('Profile ID (uid) is required');
    }

    const { data: existingProfile, error: fetchErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (fetchErr) {
      console.error('[createProfileAdmin fetch error]', fetchErr.message);
    }

    const isNewUser = !existingProfile;

    if (isNewUser) {
      // New user — create full profile
      const newProfile = {
        id: uid,
        email: profileData.email || '',
        full_name: profileData.full_name || '',
        photo_url: profileData.photo_url || '',
        username: '',
        profile_complete: false,
        year: profileData.year || '',
        branch: profileData.branch || '',
        university: profileData.university || '',
        interests: profileData.interests || [],
        bio: profileData.bio || '',
        instagram: profileData.instagram || '',
        age: profileData.age || 20,
        looking_for: profileData.lookingFor || profileData.looking_for || '',
        study_style: profileData.studyStyle || profileData.study_style || '',
        is_host: profileData.isHost || profileData.is_host || false,
        role: 'user',
        created_at: new Date().toISOString(),
      };

      const { error: insertErr } = await supabaseAdmin
        .from('profiles')
        .insert(newProfile);

      if (insertErr) {
        console.error('[createProfileAdmin insert error]', insertErr.message);
        throw new Error(insertErr.message);
      }

      // Initialize wallet & award welcome bonus via credit_sparks RPC
      await creditSparks(
        uid,
        50,
        'bonus',
        'bonus',
        'Welcome bonus ⚡',
        null
      );
    } else {
      // Returning user — update profile fields
      const updates = {};
      if (profileData.photo_url) updates.photo_url = profileData.photo_url;
      if (profileData.full_name) updates.full_name = profileData.full_name;
      if (profileData.year) updates.year = profileData.year;
      if (profileData.branch) updates.branch = profileData.branch;
      if (profileData.interests?.length) updates.interests = profileData.interests;

      if (Object.keys(updates).length > 0) {
        await supabaseAdmin
          .from('profiles')
          .update(updates)
          .eq('id', uid);
      }
    }

    return { success: true, isNewUser };
  } catch (err) {
    console.error('[createProfileAdmin] Error:', err.message);
    return { success: false, error: err.message };
  }
}
