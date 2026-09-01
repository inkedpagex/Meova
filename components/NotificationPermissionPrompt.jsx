'use client';
/**
 * NotificationPermissionPrompt.jsx
 * User-friendly notification permission request.
 * Instead of silently calling Notification.requestPermission() (which gets blocked),
 * this shows a branded modal explaining WHY before asking, boosting grant rates.
 *
 * Shown only once per device, after user has been logged in for 3 seconds.
 */
import { useEffect, useState } from 'react';
import { Bell, X, Zap, MessageSquare, Briefcase } from 'lucide-react';

const PROMPT_KEY = 'Meova_notif_prompted';

export default function NotificationPermissionPrompt({ user }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const userId = user?.uid || user?.id;
    if (!userId) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'default') return; // already granted or denied
    if (localStorage.getItem(PROMPT_KEY) === '1') return; // already shown

    // Show after 4s so it doesn't feel like an immediate ambush
    const t = setTimeout(() => setShow(true), 4000);
    return () => clearTimeout(t);
  }, [user?.uid, user?.id]);

  const handleAllow = async () => {
    setShow(false);
    localStorage.setItem(PROMPT_KEY, '1');

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Trigger FCM registration now that we have permission
        // The useFCM hook will pick this up on next render
        window.dispatchEvent(new Event('Meova_notif_granted'));
      }
    } catch {
      // Permission API not available on this browser
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(PROMPT_KEY, '1');
  };

  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
        onClick={handleDismiss}
        style={{ animation: 'fadeInBackdrop 0.2s ease' }}
      />

      {/* Modal */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[9999] sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-sm sm:w-full"
        style={{ animation: 'slideUpModal 0.35s cubic-bezier(.22,1,.36,1)' }}
      >
        <style>{`
          @keyframes fadeInBackdrop { from { opacity: 0 } to { opacity: 1 } }
          @keyframes slideUpModal {
            from { opacity: 0; transform: translateY(32px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @media (min-width: 640px) {
            @keyframes slideUpModal {
              from { opacity: 0; transform: translate(-50%, calc(-50% + 16px)); }
              to   { opacity: 1; transform: translate(-50%, -50%); }
            }
          }
        `}</style>

        <div
          className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-orange-100/80"
        >
          {/* Orange header bar */}
          <div
            className="px-6 pt-6 pb-5 relative"
            style={{ background: 'linear-gradient(135deg, #F05A00 0%, #D94F00 100%)' }}
          >
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg">
                <Bell size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-black text-lg leading-tight">Stay in the loop</h3>
                <p className="text-orange-100 text-[12px] font-medium mt-1">
                  Enable notifications to never miss a moment
                </p>
              </div>
            </div>
          </div>

          {/* Benefits list */}
          <div className="px-6 py-5 space-y-3">
            {[
              { icon: MessageSquare, color: '#3b82f6', label: 'New Messages', desc: 'Instant alerts when someone texts you' },
              { icon: Briefcase,    color: '#10b981', label: 'Gig Updates',   desc: 'Know when your Gig is accepted or paid' },
              { icon: Zap,          color: '#f59e0b', label: 'Spark Activity', desc: 'Tips, withdrawals, and balance changes' },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}18` }}
                >
                  <Icon size={16} style={{ color }} />
                </div>
                <div>
                  <p className="text-zinc-900 font-bold text-[13px]">{label}</p>
                  <p className="text-zinc-400 text-[11px] font-medium">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 pt-1 flex flex-col gap-2">
            <button
              onClick={handleAllow}
              className="w-full py-3.5 rounded-2xl font-black text-sm text-white transition-all active:scale-95 shadow-lg cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #F05A00 0%, #D94F00 100%)', boxShadow: '0 8px 24px rgba(240,90,0,0.35)' }}
            >
              Enable Notifications
            </button>
            <button
              onClick={handleDismiss}
              className="w-full py-3 rounded-2xl font-bold text-sm text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
