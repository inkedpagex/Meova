'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Zap, MessageSquare, Calendar, Users, Briefcase, X, Phone, PhoneOff } from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { useUserContext } from './providers/UserProvider';

const ICONS = {
  booking: Calendar,
  message: MessageSquare,
  chat: MessageSquare,
  sparks: Zap,
  wallet: Zap,
  tip: Zap,
  gig: Briefcase,
  circle: Users,
  incoming_call: Phone,
  call: Phone,
  default: Bell,
};

export default function InAppNotificationBanner() {
  const router = useRouter();
  const { user } = useUserContext();
  const [activeNotif, setActiveNotif] = useState(null);
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef(null);

  const dismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setActiveNotif(null);
      setIsExiting(false);
    }, 250);
  };

  const handleClick = () => {
    if (!activeNotif) return;
    const t = (activeNotif.type || activeNotif.title || '').toLowerCase();
    
    dismiss();

    if (t.includes('call')) router.push('/bookings');
    else if (t.includes('booking') || t.includes('meet')) router.push('/bookings');
    else if (t.includes('message') || t.includes('chat')) router.push('/messages');
    else if (t.includes('spark') || t.includes('wallet') || t.includes('tip') || t.includes('payment')) router.push('/wallet');
    else if (t.includes('gig')) router.push('/gigs');
    else if (t.includes('circle') || t.includes('community')) router.push('/circles');
    else router.push('/notifications');
  };

  useEffect(() => {
    if (!user?.id || !supabase) return;

    const channel = supabase
      .channel(`in-app-notifs-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newRow = payload.new;
          if (!newRow) return;

          // Clear any existing timer
          if (timerRef.current) clearTimeout(timerRef.current);

          setIsExiting(false);
          setActiveNotif({
            id: newRow.id,
            title: newRow.title || 'New Notification',
            message: newRow.message || '',
            type: newRow.type || 'default',
            senderName: newRow.sender_name,
            senderPhoto: newRow.sender_photo,
          });

          // Auto dismiss after 5.5 seconds
          timerRef.current = setTimeout(() => {
            dismiss();
          }, 5500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user?.id]);

  if (!activeNotif) return null;

  const notifType = (activeNotif.type || '').toLowerCase();
  const isCallNotif = notifType === 'incoming_call' || notifType === 'call' || activeNotif.title?.toLowerCase().includes('call');
  const IconComponent = ICONS[notifType] || ICONS.default;
  const accentColor = isCallNotif ? '#10b981' : '#F05A00';
  const bgClass = isCallNotif ? 'border-emerald-200/80 shadow-[0_12px_36px_rgba(16,185,129,0.18)]' : 'border-orange-200/90 shadow-[0_12px_36px_rgba(240,90,0,0.18)]';

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[99999] w-[calc(100%-32px)] max-w-sm transition-all duration-300 pointer-events-auto ${
        isExiting ? 'opacity-0 -translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100 animate-in slide-in-from-top-4'
      }`}
    >
      <div
        className={`bg-white/95 backdrop-blur-xl border ${bgClass} rounded-2xl p-3.5 flex items-start gap-3 cursor-pointer group hover:border-opacity-100 transition-all`}
        onClick={!isCallNotif ? handleClick : undefined}
      >
        {/* Brand Icon or Avatar */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs"
          style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}25`, color: accentColor }}
        >
          {isCallNotif ? (
            <Phone size={18} strokeWidth={2.5} className="animate-pulse" />
          ) : (
            <IconComponent size={18} strokeWidth={2.5} />
          )}
        </div>

        {/* Text Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-xs font-black text-zinc-950 truncate tracking-tight">
              {activeNotif.title}
            </h4>
            <span
              className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md border flex-shrink-0"
              style={{ background: `${accentColor}12`, color: accentColor, borderColor: `${accentColor}25` }}
            >
              Now
            </span>
          </div>
          <p className="text-[11px] font-semibold text-zinc-600 line-clamp-2 mt-0.5 leading-snug">
            {activeNotif.message}
          </p>

          {/* Call Actions */}
          {isCallNotif && (
            <div className="flex items-center gap-2 mt-2.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dismiss();
                  router.push('/bookings');
                }}
                className="flex-1 py-2 rounded-xl text-[11px] font-black text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
              >
                <Phone size={12} />
                Accept
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dismiss();
                }}
                className="flex-1 py-2 rounded-xl text-[11px] font-black bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <PhoneOff size={12} />
                Decline
              </button>
            </div>
          )}
        </div>

        {/* Dismiss Button */}
        {!isCallNotif && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dismiss();
            }}
            className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer flex-shrink-0"
            title="Dismiss"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
