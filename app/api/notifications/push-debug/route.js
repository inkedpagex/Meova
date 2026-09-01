import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/getAdminUser';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import webpush from 'web-push';

/**
 * GET /api/notifications/push-debug
 * Returns diagnostic info about push notification configuration for the current user.
 */
export async function GET() {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const publicKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').trim();
    const privateKey = (process.env.VAPID_PRIVATE_KEY || '').trim();
    const subject = (process.env.VAPID_SUBJECT || '').trim();

    const vapidOk = !!(publicKey && privateKey && subject);

    // Check tokens in DB
    const { data: tokenRows, error: tokenErr } = await supabaseAdmin
      .from('fcm_tokens')
      .select('token, created_at')
      .eq('user_id', user.uid);

    const tokens = tokenRows || [];

    // Check each token is a valid push subscription JSON
    const tokenDetails = tokens.map((row, i) => {
      try {
        const parsed = JSON.parse(row.token);
        return {
          index: i + 1,
          valid: !!(parsed?.endpoint),
          endpoint: parsed?.endpoint ? parsed.endpoint.slice(0, 60) + '...' : 'INVALID',
          created_at: row.created_at,
        };
      } catch {
        return { index: i + 1, valid: false, raw_length: row.token?.length };
      }
    });

    // Try sending a real test push to first valid token
    let testResult = null;
    if (vapidOk && tokens.length > 0) {
      try {
        webpush.setVapidDetails(subject, publicKey, privateKey);
        const firstValid = tokens.find(r => r.token?.startsWith('{'));
        if (firstValid) {
          const sub = JSON.parse(firstValid.token);
          await webpush.sendNotification(sub, JSON.stringify({
            title: 'Meova Push Debug',
            body: 'If you see this outside the app, Web Push is working perfectly!',
            url: '/profile',
            type: 'system',
          }), { TTL: 60, urgency: 'high' });
          testResult = 'SENT_OK';
        }
      } catch (e) {
        testResult = `FAILED: ${e.message} (status: ${e.statusCode})`;
      }
    }

    return NextResponse.json({
      userId: user.uid,
      vapidConfigured: vapidOk,
      vapidPublicKeyPrefix: publicKey ? publicKey.slice(0, 20) + '...' : 'MISSING',
      tokenCount: tokens.length,
      tokenQueryError: tokenErr ? tokenErr.message : null,
      tokens: tokenDetails,
      testPushResult: testResult,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
