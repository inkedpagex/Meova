'use client';
/**
 * useFCM.js
 * Client-side hook: requests notification permission, gets FCM token,
 * and registers it with the server.
 *
 * SETUP:
 *   Add NEXT_PUBLIC_FIREBASE_VAPID_KEY to .env.local
 *   Get it from: Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
 */
import { useEffect, useRef } from 'react';
import { getFirebaseMessaging } from './firebaseClient';
import { onMessage } from 'firebase/messaging';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export function useFCM(user) {
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!user?.uid || registeredRef.current) return;
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;

    // Only request on browsers that support it
    registerFCM(user.uid);
  }, [user?.uid]);
}

async function registerFCM(uid) {
  try {
    // Request permission (won't re-prompt if already decided)
    if (Notification.permission === 'denied') return;

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
    }

    if (!VAPID_KEY) {
      // VAPID key not configured — FCM tokens can't be generated
      // Add NEXT_PUBLIC_FIREBASE_VAPID_KEY to .env.local to enable push notifications
      console.info('[FCM] VAPID key not set — push notifications disabled. Add NEXT_PUBLIC_FIREBASE_VAPID_KEY to .env.local');
      return;
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) return;

    // Dynamic import to avoid server bundle
    const { getToken } = await import('firebase/messaging');

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.ready,
    });

    if (!token) return;

    // Save token to server
    await fetch('/api/fcm/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    // Listen for foreground messages (app is open)
    onMessage(messaging, (payload) => {
      const { title, body } = payload.notification || {};
      if (!title) return;

      // Show in-app toast when app is in foreground
      showInAppToast(title, body, payload.fcmOptions?.link || '/');
    });

  } catch (err) {
    // Non-fatal: push notifications are enhancement, not core feature
    console.warn('[FCM] Registration failed:', err.message);
  }
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
    <div style="width:32px;height:32px;border-radius:50%;background:#7c3aed;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;">⚡</div>
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
