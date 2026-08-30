import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { isFree, location, durationMinutes } = await request.json();

    if (isFree) {
      const until = new Date(Date.now() + (durationMinutes || 60) * 60000);
      await supabaseAdmin
        .from('profiles')
        .update({
          is_live_on_campus: true,
          live_location: location || 'Campus',
          live_until: until.toISOString(),
        })
        .eq('id', user.uid);
    } else {
      await supabaseAdmin
        .from('profiles')
        .update({
          is_live_on_campus: false,
          live_location: null,
          live_until: null,
        })
        .eq('id', user.uid);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/users/free-now]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
