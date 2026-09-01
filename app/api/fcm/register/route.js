/**
 * POST /api/fcm/register
 * Save an FCM device token for the authenticated user.
 * Called by the client's useFCM hook on first permission grant.
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/getAdminUser';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

export async function POST(request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { token } = await request.json();
    if (!token || typeof token !== 'string' || token.length < 10) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    // 1. Upsert token in fcm_tokens table
    await supabaseAdmin
      .from('fcm_tokens')
      .upsert({
        user_id: user.uid,
        token,
        created_at: new Date().toISOString(),
      }, { onConflict: 'token' });

    // 2. Also save to profiles.fcm_token for redundancy
    await supabaseAdmin
      .from('profiles')
      .update({ fcm_token: token })
      .eq('id', user.uid)
      .catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/fcm/register]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  // Unregister a token (when user logs out)
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { token } = await request.json();
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('fcm_tokens')
      .delete()
      .eq('token', token)
      .eq('user_id', user.uid);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/fcm/register]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
