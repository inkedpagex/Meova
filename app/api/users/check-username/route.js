import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const USERNAME_REGEX = /^[a-z][a-z0-9_]{4,19}$/;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username')?.toLowerCase().trim();

  if (!username) {
    return NextResponse.json({ available: false, error: 'Username is required.' }, { status: 400 });
  }

  if (!USERNAME_REGEX.test(username)) {
    return NextResponse.json({
      available: false,
      error: 'Username must be 5-20 characters, start with a letter, and contain only lowercase letters, numbers, or underscores.',
    });
  }

  const digitCount = (username.match(/\d/g) || []).length;
  if (digitCount < 2) {
    return NextResponse.json({
      available: false,
      error: 'Username must contain at least 2 digits / numbers (e.g. user_01).',
    });
  }

  const RESERVED = ['admin', 'meova', 'meetify', 'support', 'help', 'api', 'root', 'system', 'user', 'mod', 'moderator'];
  if (RESERVED.includes(username)) {
    return NextResponse.json({ available: false, error: 'This username is reserved.' });
  }

  try {
    const { data: profileDoc, error } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .ilike('username', username)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[check-username error]', error.message);
      return NextResponse.json({ available: false, error: 'Check failed' }, { status: 500 });
    }

    return NextResponse.json({ available: !profileDoc });
  } catch (err) {
    console.error('[check-username]', err.message);
    return NextResponse.json({ available: false, error: 'Server error.' }, { status: 500 });
  }
}
