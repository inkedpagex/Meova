/**
 * POST /api/fcm/register
 * Saves or updates a native FCM device token for the authenticated user.
 * Upserts into minimal `device_tokens` table keyed by (user_id, platform).
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/getAdminUser';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

export async function POST(request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { token, platform = 'android' } = body;

    if (!token || typeof token !== 'string' || token.length < 10) {
      return NextResponse.json({ error: 'Invalid FCM token' }, { status: 400 });
    }

    const cleanPlatform = String(platform || 'android').toLowerCase();

    // Upsert into minimal device_tokens table keyed on (user_id, platform)
    const { data, error: upsertErr } = await supabaseAdmin
      .from('device_tokens')
      .upsert(
        {
          user_id: user.uid,
          fcm_token: token,
          platform: cleanPlatform,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,platform' }
      )
      .select();

    if (upsertErr) {
      console.error('[POST /api/fcm/register] device_tokens upsert error:', upsertErr.message);
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: data?.length || 1 });
  } catch (err) {
    console.error('[POST /api/fcm/register] Unexpected error:', err.message);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  // Unregister token on logout
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { platform = 'android' } = body;

    const { error } = await supabaseAdmin
      .from('device_tokens')
      .delete()
      .eq('user_id', user.uid)
      .eq('platform', String(platform || 'android').toLowerCase());

    if (error) {
      console.error('[DELETE /api/fcm/register] delete error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/fcm/register]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
