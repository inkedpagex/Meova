/**
 * POST /api/fcm/register
 * Save a Web Push subscription token for the authenticated user.
 * Called by the client's useFCM hook on first permission grant.
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/getAdminUser';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

export async function POST(request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { token } = body;

    if (!token || typeof token !== 'string' || token.length < 10) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    // Upsert into fcm_tokens table (unique constraint is on 'token')
    const { data, error: upsertErr } = await supabaseAdmin
      .from('fcm_tokens')
      .upsert(
        { user_id: user.uid, token },
        { onConflict: 'token' }
      )
      .select();

    if (upsertErr) {
      console.error('[POST /api/fcm/register] fcm_tokens upsert error:', upsertErr.message);
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: data?.length || 1 });
  } catch (err) {
    console.error('[POST /api/fcm/register] Unexpected error:', err.message);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  // Unregister a token (called when user logs out)
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { token } = body;
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('fcm_tokens')
      .delete()
      .eq('token', token)
      .eq('user_id', user.uid);

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
