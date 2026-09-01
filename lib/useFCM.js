'use client';
/**
 * useFCM.js (Web Push Notifications Hook)
 * Requests notification permission, registers standard Web Push subscription token with the server.
 */
import { useEffect, useRef } from 'react';

export function useFCM(user) {
  const registeredRef = useRef(false);
  const uid = user?.uid || user?.id;

  useEffect(() => {
    if (!uid) return;
    if (typeof window === 'undefined') return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

    // If already granted, register immediately (covers page reloads)
    if (Notification.permission === 'granted' && !registeredRef.current) {
      registeredRef.current = true;
      registerPushToken(uid).then((ok) => {
        // If registration failed, allow retry next time
        if (!ok) registeredRef.current = false;
      });
    }

    // Also listen for the event fired by NotificationPermissionPrompt after user clicks Allow
    const handler = () => {
      if (registeredRef.current) return;
      registeredRef.current = true;
      registerPushToken(uid).then((ok) => {
        if (!ok) registeredRef.current = false;
      });
    };
    window.addEventListener('Meova_notif_granted', handler);
    return () => window.removeEventListener('Meova_notif_granted', handler);
  }, [uid]);
}

export async function registerPushToken(uid) {
  try {
    if (typeof window === 'undefined') return false;
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[WebPush] Push notifications not supported on this device/browser');
      return false;
    }
    if (Notification.permission !== 'granted') return false;

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
    if (!vapidKey) {
      console.error('[WebPush] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set!');
      return false;
    }

    // 1. Register service worker (idempotent — won't create duplicate if already registered)
    let reg;
    try {
      reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    } catch (e) {
      console.warn('[SW] Registration failed:', e.message);
      return false;
    }

    // 2. Wait for the SW to be fully active
    await navigator.serviceWorker.ready;

    // Re-fetch the active registration after ready (in case reg above is a waiting SW)
    const readyReg = await navigator.serviceWorker.ready;
    if (!readyReg?.pushManager) {
      console.warn('[WebPush] PushManager unavailable');
      return false;
    }

    // 3. Get existing subscription or create new one
    let subscription = await readyReg.pushManager.getSubscription();

    if (!subscription) {
      const appServerKey = urlBase64ToUint8Array(vapidKey);
      subscription = await readyReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey,
      });
    }

    if (!subscription) {
      console.error('[WebPush] Failed to get push subscription');
      return false;
    }

    // 4. Serialize and save to server
    const token = JSON.stringify(subscription.toJSON());

    const res = await fetch('/api/fcm/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, userId: uid }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('[WebPush] Token save failed:', err.error || res.status);
      return false;
    }

    console.log('[WebPush] Push subscription registered successfully');
    return true;
  } catch (err) {
    console.error('[WebPush] Registration error:', err.message);
    return false;
  }
}

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
