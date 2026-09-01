import webpush from 'web-push';
import { supabaseAdmin } from './supabase/admin';

// Initialize web-push VAPID credentials
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || 'mailto:support@meova.in';

let isVapidConfigured = false;
if (publicKey && privateKey) {
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    isVapidConfigured = true;
  } catch (err) {
    console.warn('[WebPush] VAPID initialization warning:', err.message);
  }
}

/**
 * Send a background push notification to all active devices of a user.
 * @param {string} userId - Supabase user UID
 * @param {object} payload - { title, body, url, type, isCall, bookingId, callerPhoto }
 */
export async function sendPushToUser(userId, payload) {
  if (!userId || !payload || !isVapidConfigured) return;

  try {
    const { data: tokens, error } = await supabaseAdmin
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', userId);

    if (error || !tokens || tokens.length === 0) return;

    const pushPayload = JSON.stringify({
      title: payload.title || 'Meova Notification',
      body: payload.body || '',
      url: payload.url || payload.link || '/',
      type: payload.type || 'general',
      isCall: !!payload.isCall,
      bookingId: payload.bookingId || null,
      callerPhoto: payload.callerPhoto || null,
    });

    const sendPromises = tokens.map(async ({ token }) => {
      try {
        let subscription = null;
        if (typeof token === 'string' && token.startsWith('{')) {
          subscription = JSON.parse(token);
        } else if (typeof token === 'object') {
          subscription = token;
        }

        if (!subscription || !subscription.endpoint) return;

        await webpush.sendNotification(subscription, pushPayload, {
          TTL: payload.isCall ? 60 : 86400, // 1 min for calls, 24 hrs for messages
          urgency: payload.isCall ? 'high' : 'normal',
        });
      } catch (sendErr) {
        // If the subscription is no longer valid or unsubscribed (410 Gone / 404 Not Found), purge it
        if (sendErr.statusCode === 410 || sendErr.statusCode === 404) {
          await supabaseAdmin
            .from('fcm_tokens')
            .delete()
            .eq('token', token)
            .catch(() => {});
        }
      }
    });

    await Promise.allSettled(sendPromises);
  } catch (err) {
    console.error('[WebPush] sendPushToUser error:', err.message);
  }
}
