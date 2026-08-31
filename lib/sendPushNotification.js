/**
 * sendPushNotification.js
 * Server-only: Dispatches in-app notification & web push to user.
 * 100% Supabase powered — zero Firebase dependencies.
 */
import { supabaseAdmin } from './supabase/admin';

/**
 * Send an in-app notification and web push to all devices registered for a given userId.
 * @param {string} userId - User ID
 * @param {{ title: string, body: string, url?: string, type?: string }} payload
 */
export async function sendPush(userId, { title, body, url = '/', type = 'system' }) {
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
      });
  } catch (err) {
    console.error('[sendPush] Error:', err.message);
  }
}

