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

    // Check if tokens exist in device_tokens table
    const { data: tokens, error: tokensErr } = await supabaseAdmin
      .from('device_tokens')
      .select('id, fcm_token, platform')
      .eq('user_id', targetUserId);

    if (tokensErr) {
      console.error('[POST /api/notifications/test-push] query error:', tokensErr.message);
    }

    const hasTokens = !!(tokens && tokens.length > 0);

    // Send the Native FCM alert
    await sendPushToUser(targetUserId, {
      title: 'Meova Campus Life',
      body: 'Native FCM push notifications are active and ready on your Android device!',
      url: '/profile',
      type: 'system',
    });

    // Also record in in-app notifications
    await supabaseAdmin.from('notifications').insert({
      user_id: targetUserId,
      title: 'Meova Campus Life',
      message: 'Native FCM push notifications are active and ready on your device!',
      type: 'system',
      read: false,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      hasTokens,
      tokenCount: tokens?.length || 0,
      message: hasTokens
        ? 'Test native FCM notification dispatched successfully!'
        : 'Dispatched, but no registered device tokens were found for this user. Enable notifications in the Android app.',
    });
  } catch (err) {
    console.error('[POST /api/notifications/test-push]', err.message);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
