import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username')?.toLowerCase().trim();

  if (!username) {
    return NextResponse.json({ available: false, error: 'Username is required.' }, { status: 400 });
  }

  if (!USERNAME_REGEX.test(username)) {
    return NextResponse.json({
      available: false,
      error: 'Username must be 3-20 characters: lowercase letters, numbers, underscores only.',
    });
  }

  const RESERVED = ['admin', 'Meova', 'Meetify', 'support', 'help', 'api', 'root', 'system', 'user', 'mod', 'moderator'];
  if (RESERVED.includes(username)) {
    return NextResponse.json({ available: false, error: 'This username is reserved.' });
  }

  try {
    const { data: usernameDoc } = await supabaseAdmin
      .from('usernames')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (usernameDoc) {
      return NextResponse.json({ available: false });
    }

    const { data: profileDoc } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    return NextResponse.json({ available: !profileDoc });
  } catch (err) {
    console.error('[check-username]', err.message);
    return NextResponse.json({ available: false, error: 'Server error.' }, { status: 500 });
  }
}
