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
    if (!uid || registeredRef.current) return;
    if (typeof window === 'undefined') return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

    if (Notification.permission === 'granted') {
      registeredRef.current = true;
      registerPushToken(uid);
    }

    const handler = () => {
      if (registeredRef.current) return;
      registeredRef.current = true;
      registerPushToken(uid);
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

    // 1. Ensure service worker is registered
    await navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((e) => console.warn('[SW Register]', e));

    // 2. Wait until active
    const readyReg = await navigator.serviceWorker.ready;
    if (!readyReg || !readyReg.pushManager) {
      console.warn('[WebPush] PushManager is unavailable');
      return false;
    }

    // 3. Check existing subscription or subscribe
    let subscription = await readyReg.pushManager.getSubscription();
    if (!subscription) {
      const vapidKey =
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
        'BL0rrb7KcJx_PBDIly5Um7yb3sGHsER-bovujlLSBsy8l31Y4npmYRzW8SIkomaMpKiLNYK7nok04ug0rzW0zgs';

      const appServerKey = urlBase64ToUint8Array(vapidKey.trim());
      subscription = await readyReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey,
      });
    }

    if (!subscription) return false;
    const token = JSON.stringify(subscription);

    // 4. Save token to server
    const res = await fetch('/api/fcm/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, userId: uid }),
    });

    return res.ok;
  } catch (err) {
    console.error('[WebPush] Registration error:', err.message);
    return false;
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function showInAppToast(title, body, url) {
  if (typeof document === 'undefined') return;

  const existing = document.getElementById('fcm-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'fcm-toast';
  toast.style.cssText = `
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 99999;
    background: #18181b;
    color: white;
    padding: 12px 16px;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    max-width: 340px;
    width: calc(100% - 32px);
    display: flex;
    align-items: flex-start;
    gap: 10px;
    animation: fcm-slide-in 0.3s ease;
    cursor: pointer;
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes fcm-slide-in {
      from { opacity: 0; transform: translateX(-50%) translateY(-16px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
  `;
  document.head.appendChild(style);

  toast.innerHTML = `
    <div style="width:32px;height:32px;border-radius:50%;background:#F05A00;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;">⚡</div>
    <div style="flex:1;min-width:0;">
      <p style="font-weight:800;font-size:13px;margin:0 0 2px;">${title}</p>
      ${body ? `<p style="font-size:11px;margin:0;opacity:0.7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${body}</p>` : ''}
    </div>
  `;

  toast.addEventListener('click', () => {
    window.location.href = url;
    toast.remove();
  });

  document.body.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 5000);
}
