/**
 * sendPushNotification.js
 * Server-only: Dispatches in-app notification & Native FCM Push.
 * 100% Supabase & Firebase Cloud Messaging (FCM) HTTP v1.
 */
import { supabaseAdmin } from './supabase/admin.js';
import { sendPushToUser } from './pushNotifications.js';

/**
 * Send an in-app notification and real web push to all devices registered for a given userId.
 * @param {string} userId - User ID
 * @param {{ title: string, body: string, url?: string, type?: string, isCall?: boolean, bookingId?: string, callerPhoto?: string, photo?: string, senderPhoto?: string, senderName?: string, tag?: string }} payload
 */
export async function sendPush(userId, { 
  title, 
  body, 
  url = '/', 
  type = 'system', 
  isCall = false, 
  bookingId = null, 
  callerPhoto = null,
  photo = null,
  senderPhoto = null,
  senderName = null,
  tag = null,
}) {
  if (!userId) return;

  const actualPhoto = photo || senderPhoto || callerPhoto || null;

  try {
    const isChatMessage = type === 'message' || type === 'chat';

    // 1. Insert in-app notification record in public.notifications
    const { error: notifErr } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        title: title || (isChatMessage ? 'New Message' : 'Notification'),
        message: body || '',
        type: type || (isChatMessage ? 'message' : 'system'),
        sender_name: senderName || null,
        sender_photo: actualPhoto || null,
        url: url || (isChatMessage ? '/messages' : '/'),
        read: false,
        created_at: new Date().toISOString(),
      });

    if (notifErr) {
      console.warn('[sendPush] In-app notification insert warning:', notifErr.message);
    }

    // 2. Dispatch instant WebSocket broadcast to user's active session
    try {
      const userChan = supabaseAdmin.channel(`user-realtime-${userId}`);
      await userChan.send({
        type: 'broadcast',
        event: 'new-notification',
        payload: {
          id: `notif_${Date.now()}`,
          title: title || (isChatMessage ? 'New Message' : 'Notification'),
          message: body || '',
          type: type || (isChatMessage ? 'message' : 'system'),
          senderName: senderName || title,
          senderPhoto: actualPhoto,
          url: url || (isChatMessage ? '/messages' : '/'),
          isChatMessage,
          timestamp: Date.now(),
        },
      });
      supabaseAdmin.removeChannel(userChan);
    } catch (bcErr) {
      console.warn('[sendPush] Realtime broadcast notice:', bcErr.message);
    }

    // 3. Dispatch real Device Web Push (Lock screen, mobile status bar, desktop notifications)
    try {
      await sendPushToUser(userId, {
        title,
        body,
        url,
        type,
        isCall,
        bookingId,
        callerPhoto,
        photo: actualPhoto,
        senderPhoto: actualPhoto,
        senderName,
        tag,
      });
    } catch (pushErr) {
      console.warn('[sendPush] Web push dispatch warning:', pushErr.message);
    }
  } catch (err) {
    console.error('[sendPush] Error:', err.message);
  }
}
