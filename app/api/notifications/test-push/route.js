import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/getAdminUser';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { sendPushToUser } from '../../../../lib/pushNotifications';

export async function POST(req) {
  try {
    const authUser = await requireAuth();
    const body = await req.json().catch(() => ({}));
    const targetUserId = body.userId || authUser?.uid;

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if tokens exist in database
    const { data: tokens } = await supabaseAdmin
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', targetUserId);

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('fcm_token')
      .eq('id', targetUserId)
      .maybeSingle();

    const hasTokens = (tokens && tokens.length > 0) || !!profile?.fcm_token;

    // Send the Web Push alert
    await sendPushToUser(targetUserId, {
      title: 'Meova Campus Life',
      body: 'Push notifications are active and ready on your device!',
      url: '/profile',
      type: 'system',
    });

    // Also record in in-app notifications
    await supabaseAdmin.from('notifications').insert({
      user_id: targetUserId,
      title: 'Meova Campus Life',
      message: 'Push notifications are active and ready on your device!',
      type: 'system',
      read: false,
      created_at: new Date().toISOString(),
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      hasTokens,
      tokenCount: (tokens?.length || 0) + (profile?.fcm_token ? 1 : 0),
      message: 'Test notification dispatched successfully!',
    });
  } catch (err) {
    console.error('[POST /api/notifications/test-push]', err.message);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
