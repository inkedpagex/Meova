import webpush from 'web-push';
import { supabaseAdmin } from './supabase/admin';

// Initialize web-push VAPID credentials
const publicKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').trim();
const privateKey = (process.env.VAPID_PRIVATE_KEY || '').trim();
const subject = (process.env.VAPID_SUBJECT || 'mailto:support@meova.in').trim();

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
 * @param {object} payload - { title, body, url, type, isCall, bookingId, callerPhoto, photo, senderPhoto, tag }
 */
export async function sendPushToUser(userId, payload) {
  if (!userId || !payload) return;

  if (!isVapidConfigured) {
    // Attempt lazy re-init if env vars became available at runtime
    const lazyPublic = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').trim();
    const lazyPrivate = (process.env.VAPID_PRIVATE_KEY || '').trim();
    if (lazyPublic && lazyPrivate) {
      try {
        webpush.setVapidDetails(subject, lazyPublic, lazyPrivate);
        isVapidConfigured = true;
      } catch (err) {
        console.warn('[WebPush] Lazy VAPID init error:', err.message);
        return;
      }
    } else {
      console.warn('[WebPush] VAPID keys not configured on server');
      return;
    }
  }

  try {
    // 1. Fetch all tokens from fcm_tokens table
    const { data: tokenRows, error: fetchErr } = await supabaseAdmin
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', userId);

    if (fetchErr) {
      console.error('[WebPush] Failed to fetch fcm_tokens for user:', userId, fetchErr.message);
      return;
    }

    const rawTokens = (tokenRows || []).map(r => r.token).filter(Boolean);
    if (rawTokens.length === 0) {
      return;
    }

    const userPhoto = payload.photo || payload.senderPhoto || payload.callerPhoto || null;

    const pushPayload = JSON.stringify({
      title: payload.title || 'Meova',
      body: payload.body || '',
      url: payload.url || payload.link || '/',
      type: payload.type || 'general',
      isCall: !!payload.isCall,
      bookingId: payload.bookingId || null,
      callerPhoto: payload.callerPhoto || userPhoto,
      photo: userPhoto,
      senderPhoto: userPhoto,
      senderName: payload.senderName || null,
      icon: userPhoto || payload.icon || '/icon-192.png',
      tag: payload.tag || (payload.isCall ? `call-${payload.bookingId || Date.now()}` : `meova-${payload.type || 'gen'}-${Date.now()}`),
    });

    const isHighPriority = payload.isCall || payload.type === 'message' || payload.type === 'booking';

    const sendPromises = rawTokens.map(async (rawToken) => {
      try {
        let subscription = null;
        if (typeof rawToken === 'string' && rawToken.startsWith('{')) {
          subscription = JSON.parse(rawToken);
        } else if (typeof rawToken === 'object') {
          subscription = rawToken;
        }

        if (!subscription || !subscription.endpoint) return;

        await webpush.sendNotification(subscription, pushPayload, {
          TTL: payload.isCall ? 60 : 86400, // 1 min for calls, 24 hrs for standard notifications
          urgency: isHighPriority ? 'high' : 'normal',
        });
      } catch (sendErr) {
        // If the subscription is no longer valid (410 Gone / 404 Not Found), purge it
        if (sendErr.statusCode === 410 || sendErr.statusCode === 404) {
          const tokenStr = typeof rawToken === 'string' ? rawToken : JSON.stringify(rawToken);
          await supabaseAdmin
            .from('fcm_tokens')
            .delete()
            .eq('token', tokenStr)
            .catch(() => {});
        }
      }
    });

    await Promise.allSettled(sendPromises);
  } catch (err) {
    console.error('[WebPush] sendPushToUser error:', err.message);
  }
}
