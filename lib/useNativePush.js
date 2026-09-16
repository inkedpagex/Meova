'use client';
/**
 * useNativePush.js
 * Unified Push Notification Engine:
 * 1. Native Mobile (Capacitor FCM for Android/iOS APK).
 * 2. Web Push (PWA / Mobile Chrome / Safari iOS 16.4+ via VAPID & Service Worker).
 * Handles device token registration, foreground notifications, and tap-to-open routing.
 */
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerWebPushSubscription(uid) {
  if (!uid || typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

  try {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return false;

    // Ensure SW is registered
    await navigator.serviceWorker.register('/sw.js').catch(() => {});
    const registration = await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    }

    if (subscription) {
      const res = await fetch('/api/fcm/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uid,
          token: JSON.stringify(subscription),
          platform: 'web',
        }),
      });
      return res.ok;
    }
    return false;
  } catch (err) {
    console.warn('[WebPush] Subscription registration notice:', err.message);
    return false;
  }
}

export function useNativePush(user) {
  const router = useRouter();
  const registeredRef = useRef(false);
  const uid = user?.uid || user?.id;

  useEffect(() => {
    if (!uid || typeof window === 'undefined') return;

    // ── 1. Native Mobile App (Capacitor) ─────────────────────────────────────
    if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('PushNotifications')) {
      if (registeredRef.current) return;
      registeredRef.current = true;

      let isSubscribed = true;

      const setupNativePush = async () => {
        try {
          await PushNotifications.removeAllListeners();

          if (Capacitor.getPlatform() === 'android') {
            await PushNotifications.createChannel({
              id: 'meova_calls',
              name: 'Incoming Calls',
              description: 'Full-screen incoming voice & video calls',
              importance: 5,
              visibility: 1,
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

          await PushNotifications.addListener('registration', async (token) => {
            if (!isSubscribed) return;
            const fcmToken = token?.value;
            if (fcmToken) {
              await registerDeviceTokenOnServer(uid, fcmToken);
            }
          });

          await PushNotifications.addListener('registrationError', (error) => {
            console.warn('[FCM Native] Registration error:', error);
          });

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

          const permStatus = await PushNotifications.checkPermissions();
          if (permStatus.receive === 'granted') {
            await PushNotifications.register();
          }
        } catch (err) {
          console.warn('[FCM Native] Push setup failed:', err.message);
        }
      };

      setupNativePush();
      return () => {
        isSubscribed = false;
      };
    }

    // ── 2. PWA / Mobile Web Browser (Web Push) ──────────────────────────────
    if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});

      if (registeredRef.current) return;

      const attemptRegistration = async () => {
        try {
          let perm = Notification.permission;

          // Auto-request permission if not yet decided (first visit)
          if (perm === 'default') {
            perm = await Notification.requestPermission();
          }

          if (perm === 'granted') {
            registeredRef.current = true;
            const ok = await registerWebPushSubscription(uid);
            if (ok) {
              console.log('[WebPush] Device token registered successfully');
            }
          }
        } catch (err) {
          console.warn('[WebPush] Auto-registration notice:', err.message);
        }
      };

      // Small delay to avoid blocking initial page render
      const timer = setTimeout(attemptRegistration, 2000);
      return () => clearTimeout(timer);
    }
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
 * Manually request push notification permission from UI buttons or prompts
 */
export async function requestNativePushPermission(uid) {
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('PushNotifications')) {
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

  // Web / PWA fallback
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        if (uid) {
          await registerWebPushSubscription(uid);
        }
        return true;
      }
    } catch (err) {
      console.warn('[WebPush] Permission request error:', err);
    }
  }
  return false;
}

