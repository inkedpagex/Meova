/**
 * pushNotifications.js
 * Server-only: Dispatches Native Firebase Cloud Messaging (FCM) push notifications
 * to Android/Capacitor devices via FCM HTTP v1 API and Supabase Edge Function.
 */
import { supabaseAdmin } from './supabase/admin';

// In-memory cache for Google OAuth2 token to avoid generating a new token on every request
let cachedOAuthToken = null;
let cachedOAuthExpiry = 0;

/**
 * Generates an OAuth2 access token for FCM v1 using Google Service Account credentials (Node.js runtime)
 */
async function getGoogleOAuth2AccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedOAuthToken && now < cachedOAuthExpiry - 60) {
    return cachedOAuthToken;
  }

  const crypto = await import('crypto');

  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const toBase64Url = (str) =>
    Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedClaim = toBase64Url(JSON.stringify(claimSet));
  const signatureInput = `${encodedHeader}.${encodedClaim}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureInput);
  const signature = signer.sign(serviceAccount.private_key, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${signatureInput}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(`Failed to obtain Google access token: ${tokenData.error_description || tokenData.error || tokenRes.status}`);
  }

  cachedOAuthToken = tokenData.access_token;
  cachedOAuthExpiry = now + (tokenData.expires_in || 3600);
  return cachedOAuthToken;
}

/**
 * Send native FCM push notification to all active devices of a user.
 * @param {string} userId - Supabase user UID
 * @param {object} payload - { title, body, url, type, isCall, bookingId, callerPhoto, photo, senderPhoto, senderName, tag }
 */
export async function sendPushToUser(userId, payload) {
  if (!userId || !payload) return;

  try {
    // 1. Fetch user's registered FCM tokens from minimal device_tokens table
    const { data: tokenRows, error: fetchErr } = await supabaseAdmin
      .from('device_tokens')
      .select('id, fcm_token, platform')
      .eq('user_id', userId);

    if (fetchErr) {
      console.warn('[FCM] Failed to fetch device_tokens for user:', userId, fetchErr.message);
      return;
    }

    if (!tokenRows || tokenRows.length === 0) {
      return; // Cleanly skip if user has no registered mobile devices
    }

    const title = payload.title || 'Meova';
    const body = payload.body || '';
    const url = payload.url || payload.link || '/';
    const notifType = payload.type || 'general';

    // Parse Service Account Key if available in server environment
    const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT || null;
    let serviceAccount = null;
    if (rawKey) {
      try {
        serviceAccount = typeof rawKey === 'string' ? JSON.parse(rawKey) : rawKey;
      } catch (err) {
        console.warn('[FCM] Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON in env:', err.message);
      }
    }

    // Prepare FCM string data map
    const stringData = {
      url,
      type: notifType,
      isCall: payload.isCall ? 'true' : 'false',
      bookingId: payload.bookingId || '',
      tag: payload.tag || `meova-${notifType}-${Date.now()}`,
    };
    if (payload.senderName) stringData.senderName = String(payload.senderName);

    // If Service Account is configured directly on Next.js server, call FCM v1 directly:
    if (serviceAccount && serviceAccount.project_id && serviceAccount.client_email && serviceAccount.private_key) {
      const accessToken = await getGoogleOAuth2AccessToken(serviceAccount);
      const projectId = serviceAccount.project_id;
      const staleTokenIds = [];

      const isCall = payload.isCall || notifType === 'incoming_call';

      const sendPromises = tokenRows.map(async (row) => {
        const messagePayload = {
          message: {
            token: row.fcm_token,
            notification: {
              title,
              body,
            },
            data: stringData,
            android: {
              priority: 'HIGH',
              notification: {
                sound: 'default',
                click_action: 'FCM_PLUGIN_ACTIVITY',
                channel_id: isCall ? 'meova_calls' : 'meova_alerts',
                visibility: 'PUBLIC',
                notification_priority: isCall ? 'PRIORITY_MAX' : 'PRIORITY_HIGH',
                default_vibrate_timings: true,
                default_sound: true,
              },
            },
          },
        };

        try {
          const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(messagePayload),
          });

          const data = await res.json();
          if (!res.ok) {
            const errorCode = data?.error?.details?.[0]?.errorCode || data?.error?.status;
            if (
              res.status === 404 ||
              errorCode === 'UNREGISTERED' ||
              errorCode === 'INVALID_ARGUMENT' ||
              data?.error?.message?.includes('Requested entity was not found')
            ) {
              staleTokenIds.push(row.id);
            }
            console.warn('[FCM] Send warning:', data.error?.message || res.status);
          }
        } catch (sendErr) {
          console.warn('[FCM] Request error:', sendErr.message);
        }
      });

      await Promise.allSettled(sendPromises);

      // Purge invalid/stale device tokens
      if (staleTokenIds.length > 0) {
        await supabaseAdmin.from('device_tokens').delete().in('id', staleTokenIds).catch(() => {});
      }
    } else {
      // Fallback: Dispatch via Supabase Edge Function 'send-notification'
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

      if (supabaseUrl && serviceRoleKey) {
        fetch(`${supabaseUrl}/functions/v1/send-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            target_user_id: userId,
            title,
            body,
            data: stringData,
          }),
        }).catch((e) => console.warn('[FCM Edge Dispatch Error]', e.message));
      }
    }
  } catch (err) {
    console.error('[FCM] sendPushToUser error:', err.message);
  }
}
