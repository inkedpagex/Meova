/**
 * sendPushNotification.js
 * Server-only: Dispatches in-app notification & real device Web Push.
 * 100% Supabase & Web Push VAPID powered.
 */
import { supabaseAdmin } from './supabase/admin';
import { sendPushToUser } from './pushNotifications';

/**
 * Send an in-app notification and real web push to all devices registered for a given userId.
 * @param {string} userId - User ID
 * @param {{ title: string, body: string, url?: string, type?: string, isCall?: boolean, bookingId?: string, callerPhoto?: string }} payload
 */
export async function sendPush(userId, { title, body, url = '/', type = 'system', isCall = false, bookingId = null, callerPhoto = null }) {
  if (!userId) return;

  try {
    // 1. Insert in-app notification record in public.notifications
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        title: title || 'Notification',
        message: body || '',
        type,
        read: false,
        created_at: new Date().toISOString(),
      })
      .catch((e) => console.warn('[sendPush] In-app notification insert warning:', e.message));

    // 2. Dispatch real Device Web Push (Lock screen, mobile status bar, desktop notifications)
    await sendPushToUser(userId, {
      title,
      body,
      url,
      type,
      isCall,
      bookingId,
      callerPhoto,
    }).catch((e) => console.warn('[sendPush] Web push dispatch warning:', e.message));
  } catch (err) {
    console.error('[sendPush] Error:', err.message);
  }
}


