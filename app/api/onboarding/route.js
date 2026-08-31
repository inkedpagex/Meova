import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

const USERNAME_REGEX = /^[a-z][a-z0-9_]{4,19}$/;

export async function POST(request) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const uid = user.uid;

    const body = await request.json();
    const {
      username,
      full_name,
      gender,
      year,
      branch,
      university,
      bio,
      interests,
      instagram,
      photo_url,
    } = body;

    const VALID_YEARS = ['1st', '2nd', '3rd', '4th', '5th', 'Alumni'];

    // ── Validation ──────────────────────────────────────────────
    const errors = [];
    if (!username || !USERNAME_REGEX.test(username.toLowerCase().trim()))
      errors.push('Username is invalid (5-20 chars, start with a letter, lowercase letters/numbers/underscores).');
    if (!full_name?.trim() || full_name.trim().length < 2 || full_name.trim().length > 50) 
      errors.push('Full name must be between 2 and 50 characters.');
    if (!gender || !['male', 'female', 'other'].includes(gender))
      errors.push('Gender selection is required.');
    if (!year || !VALID_YEARS.includes(year)) 
      errors.push('Please select a valid study year (1st, 2nd, 3rd, 4th, 5th, or Alumni).');
    if (!branch?.trim() || branch.trim().length > 60) 
      errors.push('Branch / Course is required (max 60 characters).');
    if (!photo_url) errors.push('Profile photo is required.');
    if (!interests || !Array.isArray(interests) || interests.length < 1) 
      errors.push('Select at least 1 interest.');

    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0] }, { status: 400 });
    }

    const cleanUsername = username.toLowerCase().trim();

    // Check username availability in public.usernames
    const { data: usernameDoc } = await supabaseAdmin
      .from('usernames')
      .select('*')
      .eq('username', cleanUsername)
      .maybeSingle();

    if (usernameDoc && (usernameDoc.user_id || usernameDoc.uid) !== uid) {
      return NextResponse.json({ error: 'This username was just taken. Please choose another.' }, { status: 409 });
    }

    // Check if user previously held a different username and clean it up
    const { data: currentProfile } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .eq('id', uid)
      .maybeSingle();

    if (currentProfile?.username && currentProfile.username !== cleanUsername) {
      await supabaseAdmin
        .from('usernames')
        .delete()
        .eq('username', currentProfile.username);
    }

    // Claim username in public.usernames
    await supabaseAdmin
      .from('usernames')
      .upsert({
        username: cleanUsername,
        user_id: uid,
        uid: uid,
        created_at: new Date().toISOString(),
      }, { onConflict: 'username' });

    // Update public.profiles
    const profilePayload = {
      username: cleanUsername,
      full_name: full_name.trim(),
      gender,
      year,
      branch: branch.trim(),
      university: university?.trim() || '',
      bio: bio?.trim() || '',
      interests: interests || [],
      instagram: instagram?.trim() || '',
      photo_url: photo_url || '',
      profile_complete: true,
      updated_at: new Date().toISOString(),
    };

    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .update(profilePayload)
      .eq('id', uid);

    if (profileErr) {
      console.error('[onboarding POST profile update error]', profileErr.message);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    const cookieStore = await cookies();
    cookieStore.set(
      '__Meova_profile_overrides',
      JSON.stringify({ full_name: full_name.trim(), username: cleanUsername, photo_url: photo_url || '' }),
      { maxAge: 60 * 60 * 24 * 30, path: '/' }
    );

    cookieStore.set('__Meova_pc', '1', {
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[onboarding POST]', err.message);
    return NextResponse.json({ error: err.message || 'Server error.' }, { status: 500 });
  }
}
