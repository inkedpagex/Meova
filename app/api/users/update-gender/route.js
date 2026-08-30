import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Lightweight JWT payload decoder (no verification — used only to extract uid from trusted cookie)
function decodeJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie =
      cookieStore.get('sb-access-token')?.value ||
      cookieStore.get('__Meova_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = decodeJwtPayload(sessionCookie);
    const uid = decoded?.sub || decoded?.user_id;
    if (!uid) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { gender } = body;

    if (!gender || !['male', 'female', 'other'].includes(gender)) {
      return NextResponse.json({ error: 'Please select a valid gender option.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ gender, updated_at: new Date().toISOString() })
      .eq('id', uid);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, gender });
  } catch (error) {
    console.error('Update gender error:', error);
    return NextResponse.json({ error: 'Failed to update gender.' }, { status: 500 });
  }
}
