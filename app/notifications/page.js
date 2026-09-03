'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Zap, Bell, CheckCircle2, MessageSquare,
  BookOpen, Briefcase, AlertTriangle, Users, Sparkles, Compass, Star
} from '@/lib/icons';
import Skeleton from '../../components/Skeleton';
import { getCartoonAvatar } from '../../utils/avatar';

const FILTERS = ['All', 'Bookings', 'Gigs', 'Sparks', 'Reviews', 'Social'];

function NotifIcon({ type, photo, name, unread }) {
  if (photo) {
    return (
      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-white ring-1 ring-[#E7E5E4] shadow-[0_2px_8px_rgba(28,25,23,0.06)] bg-[#F3EEFC]">
        <img
          src={photo}
          alt=""
          className="w-full h-full rounded-full object-cover"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = getCartoonAvatar(name || 'user');
          }}
        />
      </div>
    );
  }

  const base = "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border shadow-[0_2px_8px_rgba(28,25,23,0.06)] transition-transform";
  const t = (type || '').toLowerCase();
  
  if (t.includes('booking') || t.includes('meet')) {
    return <div className={`${base} ${unread ? 'bg-[#F3EEFC] text-[#6D28D9] border-[#E4D9F7]' : 'bg-[#FAFAF8] text-[#78716C] border-[#E7E5E4]'}`}><BookOpen size={17} strokeWidth={2.2} /></div>;
  }
  if (t.includes('spark') || t.includes('wallet') || t.includes('tip') || t.includes('refund')) {
    return <div className={`${base} ${unread ? 'bg-[#F3EEFC] text-[#6D28D9] border-[#E4D9F7]' : 'bg-[#FAFAF8] text-[#78716C] border-[#E7E5E4]'}`}><Zap size={17} className="fill-current" /></div>;
  }
  if (t.includes('presence') || t.includes('online')) {
    return <div className={`${base} bg-emerald-50 text-emerald-600 border-emerald-200`}> <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /> </div>;
  }
  if (t.includes('review') || t.includes('rate') || t.includes('rating')) {
    return <div className={`${base} ${unread ? 'bg-[#F3EEFC] text-[#6D28D9] border-[#E4D9F7]' : 'bg-[#FAFAF8] text-[#78716C] border-[#E7E5E4]'}`}><Star size={17} className="fill-current" /></div>;
  }
  if (t.includes('dispute') || t.includes('flag')) {
    return <div className={`${base} bg-rose-50 text-rose-600 border-rose-200`}><AlertTriangle size={17} strokeWidth={2.2} /></div>;
  }
  if (t.includes('circle') || t.includes('social') || t.includes('community')) {
    return <div className={`${base} ${unread ? 'bg-[#F3EEFC] text-[#6D28D9] border-[#E4D9F7]' : 'bg-[#FAFAF8] text-[#78716C] border-[#E7E5E4]'}`}><Users size={17} strokeWidth={2.2} /></div>;
  }
  return <div className={`${base} ${unread ? 'bg-[#F3EEFC] text-[#6D28D9] border-[#E4D9F7]' : 'bg-[#FAFAF8] text-[#78716C] border-[#E7E5E4]'}`}><Bell size={17} strokeWidth={2.2} /></div>;
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState('All');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await fetch('/api/notifications');
        if (!res.ok) { setLoading(false); return; }
        const data = await res.json();
        const rawNotifs = data.notifications || [];
        const seen = new Set();
        const deduped = rawNotifs.filter((n) => {
          const timeBucket = n.created_at ? Math.floor(new Date(n.created_at).getTime() / (30 * 1000)) : 'none';
          const key = `${n.sender_id || ''}_${n.type || ''}_${n.title || ''}_${timeBucket}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setNotifications(deduped);
      } catch (err) {
        console.error('[NotificationsPage] load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadNotifications();

    fetch('/api/notifications', { method: 'PATCH' }).catch(() => {});
    window.dispatchEvent(new Event('notifications-read'));
  }, []);

  const filtered = notifications.filter(n => {
    const t = (n.type || '').toLowerCase();
    if (t === 'message' || t === 'chat') return false;

    if (filter === 'All') return true;
    if (filter === 'Bookings') return t.includes('booking') || t.includes('meet');
    if (filter === 'Gigs') return t.includes('gig');
    if (filter === 'Sparks') return t.includes('spark') || t.includes('wallet') || t.includes('tip') || t.includes('refund');
    if (filter === 'Reviews') return t.includes('review') || t.includes('rate') || t.includes('rating');
    if (filter === 'Social') return t.includes('circle') || t.includes('like') || t.includes('comment') || t.includes('follow');
    return true;
  });

  const handleNotifClick = (n) => {
    if (n.url || n.link) {
      router.push(n.url || n.link);
      return;
    }
    const t = (n.type || '').toLowerCase();
    if (t.includes('booking')) router.push('/bookings');
    else if (t.includes('gig')) router.push('/gigs');
    else if (t.includes('message') || t.includes('chat')) router.push('/messages');
    else if (t.includes('spark') || t.includes('wallet') || t.includes('refund')) router.push('/wallet');
    else if (t.includes('circle')) router.push('/circles');
    else router.push('/');
  };

  const getCategoryBadge = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('booking') || t.includes('meet')) return { label: 'Meetup', cls: 'bg-[#F3EEFC] text-[#6D28D9] border-[#E4D9F7]' };
    if (t.includes('spark') || t.includes('wallet') || t.includes('tip') || t.includes('refund')) return { label: 'Sparks', cls: 'bg-[#F3EEFC] text-[#6D28D9] border-[#E4D9F7]' };
    if (t.includes('review') || t.includes('rate')) return { label: 'Review', cls: 'bg-[#F3EEFC] text-[#6D28D9] border-[#E4D9F7]' };
    if (t.includes('circle') || t.includes('community')) return { label: 'Circle', cls: 'bg-[#F3EEFC] text-[#6D28D9] border-[#E4D9F7]' };
    if (t.includes('dispute') || t.includes('flag')) return { label: 'Alert', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
    return { label: 'Activity', cls: 'bg-[#FAFAF8] text-[#78716C] border-[#E7E5E4]' };
  };

  // Group notifications into Today, This Week, Earlier
  const todayNotifs = [];
  const thisWeekNotifs = [];
  const earlierNotifs = [];

  const now = new Date();
  filtered.forEach((n) => {
    if (!n.created_at) {
      earlierNotifs.push(n);
      return;
    }
    const d = new Date(n.created_at);
    const diffHours = (now - d) / (1000 * 60 * 60);
    if (diffHours <= 24) {
      todayNotifs.push(n);
    } else if (diffHours <= 24 * 7) {
      thisWeekNotifs.push(n);
    } else {
      earlierNotifs.push(n);
    }
  });

  const NotifRow = ({ n }) => {
    const badge = getCategoryBadge(n.type);
    const isUnread = !n.read;

    return (
      <div 
        onClick={() => handleNotifClick(n)}
        className={`p-4 rounded-[16px] flex items-start gap-3.5 transition-all cursor-pointer hover:shadow-[0_2px_8px_rgba(28,25,23,0.06)] active:scale-[0.99] border ${
          isUnread 
            ? 'bg-[#F3EEFC] border-[#E4D9F7] shadow-[0_2px_8px_rgba(28,25,23,0.06)]' 
            : 'bg-white border-[#E7E5E4] hover:border-[#6D28D9] shadow-[0_2px_8px_rgba(28,25,23,0.06)]'
        }`}
      >
        <NotifIcon type={n.type} photo={n.sender_photo || n.photo} name={n.sender_name || n.title} unread={isUnread} />
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.cls}`}>
                {badge.label}
              </span>
              <p className="text-[14px] font-bold text-[#1C1917] leading-snug truncate">{n.title || 'Campus Alert'}</p>
            </div>
            <span className="text-[11px] font-medium text-[#A8A29E] whitespace-nowrap flex-shrink-0">{timeAgo(n.created_at)}</span>
          </div>
          <p className="text-[13px] text-[#78716C] font-normal leading-relaxed line-clamp-2">{n.body || n.message}</p>
        </div>
        {isUnread && <span className="w-2 h-2 rounded-full bg-[#6D28D9] flex-shrink-0 shadow-[0_2px_8px_rgba(28,25,23,0.06)] mt-2" />}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-6 max-w-[540px] mx-auto pb-24 space-y-4 select-none">
        <div className="flex items-center gap-3 mb-5">
          <Skeleton variant="rectangular" className="w-10 h-10 rounded-[16px]" />
          <Skeleton variant="text" className="w-36 h-5" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} variant="rectangular" className="h-9 w-20 rounded-full flex-shrink-0" />)}
        </div>
        <div className="space-y-2.5 pt-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-3 p-4 bg-white border border-[#E7E5E4] rounded-[16px]">
              <Skeleton variant="circular" className="w-11 h-11 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton variant="text" className="h-4 w-48" />
                <Skeleton variant="text" className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-[540px] mx-auto pb-24 select-none animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) router.back();
              else router.push('/');
            }}
            className="p-2.5 rounded-full bg-white border border-[#E7E5E4] text-[#1C1917] hover:bg-[#FAFAF8] cursor-pointer transition-all active:scale-95 shadow-[0_2px_8px_rgba(28,25,23,0.06)]"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-base font-bold tracking-tight text-[#1C1917]">Notifications</h1>
            <p className="text-[12px] text-[#78716C] font-medium">Activity, bookings &amp; Sparks updates</p>
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 no-scrollbar">
        {FILTERS.map(f => (
          <button 
            key={f} 
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-[12px] font-bold uppercase tracking-wider cursor-pointer transition-all active:scale-95 shadow-[0_2px_8px_rgba(28,25,23,0.06)] ${
              filter === f
                ? 'bg-[#6D28D9] text-white border border-[#6D28D9]'
                : 'bg-white text-[#78716C] border border-[#E7E5E4] hover:bg-[#FAFAF8]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Group 1: TODAY */}
      {todayNotifs.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-1.5 mb-2.5 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6D28D9]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6D28D9]">Today</span>
          </div>
          <div className="space-y-2">
            {todayNotifs.map(n => <NotifRow key={n.id} n={n} />)}
          </div>
        </div>
      )}

      {/* Group 2: THIS WEEK */}
      {thisWeekNotifs.length > 0 && (
        <div className="mb-6">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C] block mb-2.5 px-1">This Week</span>
          <div className="space-y-2">
            {thisWeekNotifs.map(n => <NotifRow key={n.id} n={n} />)}
          </div>
        </div>
      )}

      {/* Group 3: EARLIER */}
      {earlierNotifs.length > 0 && (
        <div className="mb-6">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#A8A29E] block mb-2.5 px-1">Earlier</span>
          <div className="space-y-2">
            {earlierNotifs.map(n => <NotifRow key={n.id} n={n} />)}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="bg-white border border-[#E7E5E4] rounded-[16px] p-8 text-center space-y-4 my-8 shadow-[0_2px_8px_rgba(28,25,23,0.06)]">
          <div className="w-14 h-14 rounded-full bg-[#F3EEFC] text-[#6D28D9] flex items-center justify-center mx-auto border border-[#E4D9F7] shadow-[0_2px_8px_rgba(28,25,23,0.06)]">
            <Bell size={24} strokeWidth={2.2} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1C1917]">No {filter !== 'All' ? filter : ''} notifications</h3>
            <p className="text-xs text-[#78716C] font-medium mt-1 max-w-xs mx-auto leading-relaxed">
              When peers book meetups, leave reviews, or you earn Sparks, alerts will show up here.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6D28D9] hover:bg-[#5B21B6] text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-[0_2px_8px_rgba(28,25,23,0.06)] active:scale-95"
          >
            <Compass size={14} />
            <span>Explore Campus Feed</span>
          </Link>
        </div>
      )}

      {/* All caught up */}
      {filtered.length > 0 && (
        <div className="text-center py-6">
          <CheckCircle2 size={24} className="mx-auto mb-1 text-emerald-500" strokeWidth={2.2} />
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#A8A29E]">You&apos;re all caught up</p>
        </div>
      )}

    </div>
  );
}
