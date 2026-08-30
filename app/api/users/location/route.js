import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/getAdminUser';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

export async function POST(request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const isLiveOnCampus = !!body.isLiveOnCampus;

    await supabaseAdmin
      .from('profiles')
      .update({
        is_live_on_campus: isLiveOnCampus,
        last_location_update: new Date().toISOString(),
      })
      .eq('id', user.uid);

    return NextResponse.json({ success: true, isLiveOnCampus });
  } catch (err) {
    console.error('[POST /api/users/location]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
