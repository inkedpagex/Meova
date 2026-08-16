'use client';
/**
 * toast.js
 * Lightweight in-app toast — no library needed.
 * Usage: import { toast } from '@/lib/toast';
 *   toast.success('Meeting verified!')
 *   toast.error('Verification failed.')
 *   toast.info('Please wait...')
 *   toast.warn('Enter a valid 6-digit code')
 */

function show(message, type = 'info', duration = 4000) {
  if (typeof document === 'undefined') return;

  // Remove any existing toast of same type to avoid stacking
  const existingId = `meetify-toast-${type}`;
  const existing = document.getElementById(existingId);
  if (existing) existing.remove();

  const colors = {
    success: { bg: '#16a34a', icon: '✓' },
    error:   { bg: '#dc2626', icon: '✕' },
    warn:    { bg: '#d97706', icon: '⚠' },
    info:    { bg: '#18181b', icon: '⚡' },
  };

  const { bg, icon } = colors[type] || colors.info;

  const el = document.createElement('div');
  el.id = existingId;
  el.setAttribute('role', 'alert');
  el.setAttribute('aria-live', 'polite');
  el.style.cssText = `
    position: fixed;
    top: 72px;
    left: 50%;
    transform: translateX(-50%) translateY(-8px);
    z-index: 99999;
    background: ${bg};
    color: white;
    padding: 11px 16px;
    border-radius: 14px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.25);
    max-width: 340px;
    width: calc(100% - 32px);
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif;
    font-size: 13px;
    font-weight: 700;
    opacity: 0;
    transition: opacity 0.2s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    pointer-events: auto;
    cursor: pointer;
  `;

  el.innerHTML = `
    <span style="width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,0.2);
      display:flex;align-items:center;justify-content:center;flex-shrink:0;
      font-size:12px;font-weight:900;">${icon}</span>
    <span style="flex:1;line-height:1.4;">${message}</span>
  `;

  document.body.appendChild(el);

  // Animate in
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateX(-50%) translateY(0)';
  });

  const dismiss = () => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(-8px)';
    setTimeout(() => el.remove(), 250);
  };

  el.addEventListener('click', dismiss);
  setTimeout(dismiss, duration);
}

export const toast = {
  success: (msg, duration) => show(msg, 'success', duration),
  error:   (msg, duration) => show(msg, 'error',   duration),
  warn:    (msg, duration) => show(msg, 'warn',    duration),
  info:    (msg, duration) => show(msg, 'info',    duration),
};
