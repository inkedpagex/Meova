'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Zap, Bell, CheckCircle2, MessageSquare,
  BookOpen, Briefcase, AlertTriangle, Users, Sparkles, Compass, Star
} from 'lucide-react';
import Skeleton from '../../components/Skeleton';
import { getCartoonAvatar } from '../../utils/avatar';

const FILTERS = ['All', 'Bookings', 'Gigs', 'Sparks', 'Reviews', 'Social'];

function NotifIcon({ type, photo, name }) {
  if (photo) {
    return (
      <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 border-2 border-white ring-1 ring-zinc-200/80 shadow-xs bg-zinc-100">
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

  const base = "w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 border shadow-xs transition-transform";
  const t = (type || '').toLowerCase();
  if (t.includes('booking') || t.includes('meet')) {
    return <div className={`${base} bg-orange-50 text-[#F05A00] border-orange-200`}><BookOpen size={18} strokeWidth={2.2} /></div>;
  }
  if (t.includes('spark') || t.includes('wallet') || t.includes('tip') || t.includes('refund')) {
    return <div className={`${base} bg-amber-50 text-amber-600 border-amber-200`}><Zap size={18} className="fill-current" /></div>;
  }
  if (t.includes('gig')) {
    return <div className={`${base} bg-emerald-50 text-emerald-600 border-emerald-200`}><Briefcase size={18} strokeWidth={2.2} /></div>;
  }
  if (t.includes('review') || t.includes('rate') || t.includes('rating')) {
    return <div className={`${base} bg-amber-50 text-amber-500 border-amber-200`}><Star size={18} className="fill-current text-amber-400" /></div>;
  }
  if (t.includes('dispute') || t.includes('flag')) {
    return <div className={`${base} bg-rose-50 text-rose-600 border-rose-200`}><AlertTriangle size={18} strokeWidth={2.2} /></div>;
  }
  if (t.includes('circle') || t.includes('social') || t.includes('community')) {
    return <div className={`${base} bg-purple-50 text-purple-600 border-purple-200`}><Users size={18} strokeWidth={2.2} /></div>;
  }
  return <div className={`${base} bg-orange-50 text-[#F05A00] border-orange-200`}><Bell size={18} strokeWidth={2.2} /></div>;
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
        setNotifications(data.notifications || []);
      } catch (err) {
        console.error('[NotificationsPage] load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadNotifications();

    // Mark all as read when page mounts
    fetch('/api/notifications', { method: 'PATCH' }).catch(() => {});
    window.dispatchEvent(new Event('notifications-read'));
  }, []);

  const filtered = notifications.filter(n => {
    const t = (n.type || '').toLowerCase();
    // Chat messages strictly belong to /messages tab, never show in notification tab
    if (t === 'message' || t === 'chat') return false;

    if (filter === 'All') return true;
    if (filter === 'Bookings') return t.includes('booking') || t.includes('meet');
    if (filter === 'Gigs') return t.includes('gig');
    if (filter === 'Sparks') return t.includes('spark') || t.includes('wallet') || t.includes('tip') || t.includes('refund');
    if (filter === 'Reviews') return t.includes('review') || t.includes('rate') || t.includes('rating');
    if (filter === 'Social') return t.includes('circle') || t.includes('like') || t.includes('comment') || t.includes('follow');
    return true;
  });

  const unread = filtered.filter(n => !n.read);
  const read = filtered.filter(n => n.read);

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
    if (t.includes('booking') || t.includes('meet')) return { label: 'Meetup', cls: 'bg-orange-50 text-[#F05A00] border-orange-200' };
    if (t.includes('spark') || t.includes('wallet') || t.includes('tip') || t.includes('refund')) return { label: 'Sparks', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (t.includes('gig')) return { label: 'Gig', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (t.includes('review') || t.includes('rate')) return { label: 'Review', cls: 'bg-amber-50 text-amber-600 border-amber-200' };
    if (t.includes('circle') || t.includes('community')) return { label: 'Circle', cls: 'bg-purple-50 text-purple-700 border-purple-200' };
    if (t.includes('dispute') || t.includes('flag')) return { label: 'Alert', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
    return { label: 'Update', cls: 'bg-zinc-100 text-zinc-600 border-zinc-200' };
  };

  const NotifRow = ({ n }) => {
    const badge = getCategoryBadge(n.type);

    return (
      <div 
        onClick={() => handleNotifClick(n)}
        className={`p-3.5 sm:p-4 rounded-2xl flex items-start gap-3.5 transition-all cursor-pointer hover:shadow-xs active:scale-[0.99] border ${
          !n.read 
            ? 'bg-gradient-to-r from-orange-50/60 via-white to-white border-orange-200/90 shadow-2xs ring-1 ring-orange-200/40' 
            : 'bg-white border-zinc-100 hover:border-zinc-200 shadow-2xs'
        }`}
      >
        <NotifIcon type={n.type} photo={n.sender_photo || n.photo} name={n.sender_name || n.title} />
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.cls}`}>
                {badge.label}
              </span>
              <p className="text-xs font-black text-zinc-900 leading-snug truncate">{n.title || 'Campus Alert'}</p>
            </div>
            <span className="text-[10px] font-bold text-zinc-400 whitespace-nowrap flex-shrink-0">{timeAgo(n.created_at)}</span>
          </div>
          <p className="text-[11.5px] text-zinc-600 font-medium leading-relaxed line-clamp-2">{n.body || n.message}</p>
        </div>
        {!n.read && <span className="w-2 h-2 rounded-full bg-[#F05A00] flex-shrink-0 shadow-xs mt-2" />}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-6 max-w-[540px] mx-auto pb-24 space-y-4 select-none">
        <div className="flex items-center gap-3 mb-5">
          <Skeleton variant="rectangular" className="w-10 h-10 rounded-2xl" />
          <Skeleton variant="text" className="w-36 h-5" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} variant="rectangular" className="h-9 w-20 rounded-xl flex-shrink-0" />)}
        </div>
        <div className="space-y-2.5 pt-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-3 p-4 bg-white border border-zinc-100 rounded-2xl">
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
            className="p-2.5 rounded-2xl bg-white border border-zinc-200/80 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 cursor-pointer transition-all active:scale-95 shadow-2xs"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-base font-black tracking-tight text-zinc-950">Notifications</h1>
            <p className="text-[11px] text-zinc-500 font-bold">Activity, bookings & Sparks updates</p>
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map(f => (
          <button 
            key={f} 
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 shadow-2xs ${
              filter === f
                ? 'bg-[#F05A00] text-white border border-[#F05A00] shadow-[#F05A00]/20'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* New / Unread */}
      {unread.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-1.5 mb-2.5 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F05A00]" />
            <span className="text-[10.5px] font-black uppercase tracking-widest text-[#F05A00]">New Activity</span>
          </div>
          <div className="space-y-2">
            {unread.map(n => <NotifRow key={n.id} n={n} />)}
          </div>
        </div>
      )}

      {/* Earlier / Read */}
      {read.length > 0 && (
        <div className="mb-6">
          <span className="text-[10.5px] font-black uppercase tracking-widest text-zinc-400 block mb-2.5 px-1">Earlier</span>
          <div className="space-y-2">
            {read.map(n => <NotifRow key={n.id} n={n} />)}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="bg-white border border-zinc-200/80 rounded-3xl p-8 text-center space-y-4 my-8 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-orange-50 text-[#F05A00] flex items-center justify-center mx-auto border border-orange-100 shadow-2xs">
            <Bell size={24} strokeWidth={2.2} />
          </div>
          <div>
            <h3 className="text-sm font-black text-zinc-900">No {filter !== 'All' ? filter : ''} notifications</h3>
            <p className="text-xs text-zinc-500 font-medium mt-1 max-w-xs mx-auto leading-relaxed">
              When peers book meetups, leave reviews, or you earn Sparks, alerts will show up here.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F05A00] hover:bg-[#D94F00] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs active:scale-95"
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
          <p className="text-[11px] font-black uppercase tracking-wider text-zinc-400">You're all caught up</p>
        </div>
      )}

    </div>
  );
}

