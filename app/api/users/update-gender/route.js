import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please login again.' }, { status: 401 });
    }

    const body = await request.json();
    const { gender } = body;

    if (!gender || !['male', 'female', 'other'].includes(gender)) {
      return NextResponse.json({ error: 'Please select a valid gender option.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ gender, updated_at: new Date().toISOString() })
      .eq('id', user.uid);

    if (error) {
      console.error('[update-gender error]', error.message);
      return NextResponse.json({ error: error.message || 'Failed to update gender.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, gender });
  } catch (error) {
    console.error('Update gender error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update gender.' }, { status: 500 });
  }
}
