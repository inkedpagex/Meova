'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Zap, MessageSquare, Calendar, Users, Briefcase, X, Phone, PhoneOff, ArrowRight } from '@/lib/icons';
import { supabase } from '../lib/supabase/client';
import { useUserContext } from './providers/UserProvider';
import { getCartoonAvatar } from '../utils/avatar';

const NOTIF_CONFIG = {
  message: {
    icon: MessageSquare,
    accent: '#6D28D9',
    tag: 'Message',
    bg: 'bg-white',
    border: 'border-black/[0.08] shadow-xs',
    actionText: 'Reply',
  },
  chat: {
    icon: MessageSquare,
    accent: '#6D28D9',
    tag: 'Chat',
    bg: 'bg-white',
    border: 'border-black/[0.08] shadow-xs',
    actionText: 'Reply',
  },
  incoming_call: {
    icon: Phone,
    accent: '#10b981',
    tag: 'Voice Call',
    bg: 'bg-white',
    border: 'border-emerald-200 shadow-xs',
    actionText: 'Join',
  },
  call: {
    icon: Phone,
    accent: '#10b981',
    tag: 'Voice Call',
    bg: 'bg-white',
    border: 'border-emerald-200 shadow-xs',
    actionText: 'Join',
  },
  booking: {
    icon: Calendar,
    accent: '#6D28D9',
    tag: 'Meetup',
    bg: 'bg-white',
    border: 'border-black/[0.08] shadow-xs',
    actionText: 'View Meetup',
  },
  meetup: {
    icon: Calendar,
    accent: '#6D28D9',
    tag: 'Meetup',
    bg: 'bg-white',
    border: 'border-black/[0.08] shadow-xs',
    actionText: 'View Meetup',
  },
  sparks: {
    icon: Zap,
    accent: '#6D28D9',
    tag: 'Sparks',
    bg: 'bg-white',
    border: 'border-black/[0.08] shadow-xs',
    actionText: 'View Wallet',
  },
  wallet: {
    icon: Zap,
    accent: '#6D28D9',
    tag: 'Wallet',
    bg: 'bg-white',
    border: 'border-black/[0.08] shadow-xs',
    actionText: 'View Wallet',
  },
  tip: {
    icon: Zap,
    accent: '#6D28D9',
    tag: 'Tip Received',
    bg: 'bg-white',
    border: 'border-black/[0.08] shadow-xs',
    actionText: 'View Balance',
  },
  gig: {
    icon: Briefcase,
    accent: '#6D28D9',
    tag: 'Campus Activity',
    bg: 'bg-white',
    border: 'border-black/[0.08] shadow-xs',
    actionText: 'View',
  },
  circle: {
    icon: Users,
    accent: '#6D28D9',
    tag: 'Circle',
    bg: 'bg-white',
    border: 'border-black/[0.08] shadow-xs',
    actionText: 'View Circle',
  },
  default: {
    icon: Bell,
    accent: '#6D28D9',
    tag: 'Meova',
    bg: 'bg-white',
    border: 'border-black/[0.08] shadow-xs',
    actionText: 'View',
  },
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

          timerRef.current = setTimeout(() => {
            dismiss();
          }, 6000);
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
  const cfg = NOTIF_CONFIG[notifType] || NOTIF_CONFIG.default;
  const IconComponent = cfg.icon;

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[99999] w-[calc(100%-28px)] max-w-sm transition-all duration-300 pointer-events-auto ${
        isExiting ? 'opacity-0 -translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100 animate-in slide-in-from-top-4'
      }`}
    >
      <div
        className={`${cfg.bg} backdrop-blur-xl border ${cfg.border} rounded-2xl p-3.5 flex items-start gap-3 cursor-pointer group hover:scale-[1.01] transition-all`}
        onClick={!isCallNotif ? handleClick : undefined}
      >
        {/* Avatar or Themed Category Icon — 100% Round Circular DP */}
        {activeNotif.senderPhoto ? (
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-[#E7E5E4] shadow-xs">
            <img 
              src={activeNotif.senderPhoto} 
              alt="" 
              className="w-full h-full rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = getCartoonAvatar(activeNotif.senderName || 'user');
              }}
            />
          </div>
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-xs transition-transform group-hover:scale-105"
            style={{ 
              background: `${cfg.accent}15`, 
              border: `1px solid ${cfg.accent}30`, 
              color: cfg.accent 
            }}
          >
            {isCallNotif ? (
              <Phone size={18} strokeWidth={2.5} className="animate-pulse" />
            ) : (
              <IconComponent size={18} strokeWidth={2.2} />
            )}
          </div>
        )}

        {/* Text Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1.5 mb-0.5">
            <h4 className="text-xs font-bold text-[#1C1917] truncate tracking-tight">
              {activeNotif.title}
            </h4>
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border flex-shrink-0"
              style={{ 
                background: `${cfg.accent}12`, 
                color: cfg.accent, 
                borderColor: `${cfg.accent}25` 
              }}
            >
              {cfg.tag}
            </span>
          </div>

          <p className="text-[11px] font-semibold text-[#78716C] line-clamp-2 leading-snug">
            {activeNotif.message}
          </p>

          {/* Call Action Buttons */}
          {isCallNotif ? (
            <div className="flex items-center gap-2 mt-2.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dismiss();
                  router.push('/bookings');
                }}
                className="flex-1 py-2 rounded-xl text-[11px] font-bold text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-md shadow-emerald-500/20"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
              >
                <Phone size={12} />
                <span>Accept</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dismiss();
                }}
                className="flex-1 py-2 rounded-xl text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <PhoneOff size={12} />
                <span>Decline</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 mt-1 text-[10px] font-bold" style={{ color: cfg.accent }}>
              <span>{cfg.actionText}</span>
              <ArrowRight size={10} strokeWidth={2.5} />
            </div>
          )}
        </div>

        {/* Close Button */}
        {!isCallNotif && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dismiss();
            }}
            className="p-1 text-[#A8A29E] hover:text-[#78716C] hover:bg-[#FAFAF8] rounded-lg transition-colors cursor-pointer flex-shrink-0"
            title="Dismiss"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
