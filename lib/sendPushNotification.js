/**
 * sendPushNotification.js
 * Server-only: Send FCM push notifications to a user's registered devices.
 * Uses Firebase Admin Messaging for webpush payload while reading tokens from Supabase fcm_tokens table.
 */
import { supabaseAdmin } from './supabase/admin';

let adminMessaging = null;

async function getMessagingAdmin() {
  if (adminMessaging) return adminMessaging;
  try {
    const { getApps } = await import('firebase-admin/app');
    const apps = getApps();
    const adminApp = apps.find(a => a.name === 'admin');
    if (!adminApp) return null;
    const { getMessaging } = await import('firebase-admin/messaging');
    adminMessaging = getMessaging(adminApp);
    return adminMessaging;
  } catch (err) {
    console.warn('[sendPush] Firebase Messaging admin init failed:', err.message);
    return null;
  }
}

/**
 * Send a push notification to all devices registered for a given userId.
 * @param {string} userId - User ID
 * @param {{ title: string, body: string, url?: string }} payload
 */
export async function sendPush(userId, { title, body, url = '/' }) {
  if (!userId) return;

  try {
    const messaging = await getMessagingAdmin();
    if (!messaging) return;

    // Fetch all stored FCM tokens for this user from public.fcm_tokens
    const { data: tokenRows, error } = await supabaseAdmin
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', userId);

    if (error || !tokenRows || tokenRows.length === 0) return;

    const tokens = tokenRows.map(r => r.token).filter(Boolean);
    if (tokens.length === 0) return;

    const message = {
      tokens,
      notification: { title, body },
      webpush: {
        notification: {
          title,
          body,
          icon: '/icon-512.png',
          badge: '/icon-512.png',
          vibrate: [200, 100, 200],
          requireInteraction: false,
        },
        fcmOptions: { link: url },
      },
    };

    const response = await messaging.sendEachForMulticast(message);

    // Clean up invalid / expired tokens from public.fcm_tokens
    const invalidTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errCode = resp.error?.code;
        if (
          errCode === 'messaging/registration-token-not-registered' ||
          errCode === 'messaging/invalid-registration-token'
        ) {
          invalidTokens.push(tokens[idx]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      await supabaseAdmin
        .from('fcm_tokens')
        .delete()
        .in('token', invalidTokens);
    }
  } catch (err) {
    console.error('[sendPush] Error:', err.message);
  }
}
