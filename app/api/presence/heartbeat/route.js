import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: true });
    }

    const { action, userId } = body;
    if (!userId) {
      return NextResponse.json({ ok: true });
    }

    const now = new Date().toISOString();

    if (action === 'ping') {
      await supabaseAdmin
        .from('profiles')
        .update({
          last_location_update: now,
          updated_at: now,
        })
        .eq('id', userId);
    } else if (action === 'leave') {
      await supabaseAdmin
        .from('profiles')
        .update({
          is_live_on_campus: false,
          updated_at: now,
        })
        .eq('id', userId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
