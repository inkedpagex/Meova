'use client';
/**
 * useNativePush.js
 * Native Firebase Cloud Messaging (FCM) via Capacitor PushNotifications plugin.
 * Handles device token registration, foreground notifications, and tap-to-open routing.
 */
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export function useNativePush(user) {
  const router = useRouter();
  const registeredRef = useRef(false);
  const uid = user?.uid || user?.id;

  useEffect(() => {
    if (!uid || typeof window === 'undefined') return;
    if (!Capacitor.isNativePlatform() && !Capacitor.isPluginAvailable('PushNotifications')) {
      return;
    }

    if (registeredRef.current) return;
    registeredRef.current = true;

    let isSubscribed = true;

    const setupPush = async () => {
      try {
        // 1. Remove any old listeners before adding new ones
        await PushNotifications.removeAllListeners();

        // 2. Create high-importance notification channels on Android for lockscreen wake-up
        if (Capacitor.getPlatform() === 'android') {
          await PushNotifications.createChannel({
            id: 'meova_calls',
            name: 'Incoming Calls',
            description: 'Full-screen incoming voice & video calls',
            importance: 5, // IMPORTANCE_HIGH: pop-up banner, rings, vibrates, lights screen
            visibility: 1, // VISIBILITY_PUBLIC: shows caller name on lock screen
            sound: 'default',
            vibration: true,
            lights: true,
          }).catch(() => {});

          await PushNotifications.createChannel({
            id: 'meova_alerts',
            name: 'Messages & Alerts',
            description: 'Chat messages, likes, and social updates',
            importance: 4,
            visibility: 1,
            sound: 'default',
            vibration: true,
          }).catch(() => {});
        }

        // 3. Listen for successful FCM token generation
        await PushNotifications.addListener('registration', async (token) => {
          if (!isSubscribed) return;
          const fcmToken = token?.value;
          if (fcmToken) {
            await registerDeviceTokenOnServer(uid, fcmToken);
          }
        });

        // 3. Listen for registration errors
        await PushNotifications.addListener('registrationError', (error) => {
          console.warn('[FCM Native] Registration error:', error);
        });

        // 4. Foreground notification handling (User is looking at the app)
        // Do not display system tray popup — dispatch in-app event instead
        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          if (!isSubscribed) return;
          try {
            window.dispatchEvent(
              new CustomEvent('meova_native_push_foreground', {
                detail: notification,
              })
            );
          } catch (e) {
            console.warn('[FCM Native] Foreground dispatch error:', e);
          }
        });

        // 5. Notification Tap (Action Performed) -> Route to target screen
        await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          if (!isSubscribed) return;
          try {
            const data = action?.notification?.data || {};
            const targetUrl = data.url || (data.conversation_id ? `/messages?id=${data.conversation_id}` : '/');
            if (targetUrl) {
              router.push(targetUrl);
            }
          } catch (err) {
            console.warn('[FCM Native] Tap route error:', err);
          }
        });

        // 6. Check permissions and register
        const permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'granted') {
          await PushNotifications.register();
        } else {
          const reqStatus = await PushNotifications.requestPermissions();
          if (reqStatus.receive === 'granted') {
            await PushNotifications.register();
          }
        }
      } catch (err) {
        console.warn('[FCM Native] Push setup failed:', err.message);
      }
    };

    setupPush();

    return () => {
      isSubscribed = false;
    };
  }, [uid, router]);
}

/**
 * Saves or updates device token in Supabase via backend API
 */
export async function registerDeviceTokenOnServer(uid, fcmToken) {
  if (!uid || !fcmToken) return false;
  try {
    const res = await fetch('/api/fcm/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: uid,
        token: fcmToken,
        platform: Capacitor.getPlatform() || 'android',
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[FCM Native] Token save error:', err.message);
    return false;
  }
}

/**
 * Manually request push notification permission from UI buttons
 */
export async function requestNativePushPermission(uid) {
  if (!Capacitor.isNativePlatform() && !Capacitor.isPluginAvailable('PushNotifications')) {
    return false;
  }
  try {
    const reqStatus = await PushNotifications.requestPermissions();
    if (reqStatus.receive === 'granted') {
      await PushNotifications.register();
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[FCM Native] Request permission error:', err);
    return false;
  }
}
