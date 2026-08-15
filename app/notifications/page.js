'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, SlidersHorizontal, Rocket, Camera, Zap, Trophy,
  Gamepad2, Bell, User, CheckCircle2, X, Check, Sparkles, MessageSquare, BookOpen
} from 'lucide-react';
import { getCartoonAvatar } from '../../utils/avatar';
import Skeleton from '../../components/Skeleton';

const FILTERS = ['All', 'Social', 'booking', 'sparks', 'message'];

function typeLabel(type) {
  if (type === 'booking') return 'Booking';
  if (type === 'sparks') return 'Sparks';
  if (type === 'message') return 'Message';
  return 'Social';
}

function NotifIcon({ type }) {
  const base = "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border";
  if (type === 'booking') return <div className={`${base} bg-purple-500/10 text-purple-500 border-purple-500/20`}><BookOpen size={16} /></div>;
  if (type === 'sparks')  return <div className={`${base} bg-orange-500/10 text-orange-500 border-orange-500/20`}><Zap size={16} className="fill-current" /></div>;
  if (type === 'message') return <div className={`${base} bg-blue-500/10 text-blue-500 border-blue-500/20`}><MessageSquare size={16} /></div>;
  return <div className={`${base} bg-zinc-100 border-zinc-200`}><Bell size={16} className="text-zinc-400" /></div>;
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

  const filtered = filter === 'All' ? notifications : notifications.filter(n => n.type === filter);
  const unread = filtered.filter(n => !n.read);
  const read = filtered.filter(n => n.read);

  const NotifRow = ({ n }) => (
    <div className={`p-4 rounded-2xl flex items-center gap-3 transition-all ${!n.read ? 'ring-1 ring-purple-100' : ''}`}
      style={{ background: n.read ? 'var(--bg-elevated)' : '#faf5ff', border: n.read ? '1px solid var(--border-subtle)' : '1px solid #e9d5ff' }}>
      <NotifIcon type={n.type} />
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
        <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>{n.body}</p>
        <span className="text-[10px] mt-1 block" style={{ color: 'var(--text-muted)' }}>{timeAgo(n.created_at)}</span>
      </div>
      {!n.read && <span className="w-2 h-2 rounded-full bg-[#7c3aed] flex-shrink-0" />}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-4 max-w-[500px] mx-auto pb-24">
        <div className="flex items-center gap-3 mb-5">
          <Skeleton variant="rectangular" className="w-10 h-10 rounded-xl" />
          <Skeleton variant="text" className="w-40 h-4" />
        </div>
        <div className="flex gap-2 mb-5">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rectangular" className="h-8 w-24 rounded-xl flex-shrink-0" />)}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-3 p-4 bg-white border border-zinc-100 rounded-2xl">
              <Skeleton variant="circular" className="w-10 h-10 flex-shrink-0" />
              <div className="flex-1">
                <Skeleton variant="text" className="h-4 w-48 mb-1" />
                <Skeleton variant="text" className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-4 max-w-[500px] mx-auto pb-24 anim-fade-in" style={{ background: 'var(--bg-base)' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="p-2 rounded-xl border cursor-pointer transition-all active:scale-95"
            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>
          <h1 className="text-[13px] font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Notifications</h1>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95"
            style={filter === f
              ? { background: '#7c3aed', color: 'white', border: '1px solid transparent' }
              : { background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
            {f}
          </button>
        ))}
      </div>

      {/* New / Unread */}
      {unread.length > 0 && (
        <div className="mb-6">
          <span className="text-[10px] font-black uppercase tracking-widest block mb-3" style={{ color: 'var(--text-secondary)' }}>New</span>
          <div className="space-y-2">
            {unread.map(n => <NotifRow key={n.id} n={n} />)}
          </div>
        </div>
      )}

      {/* Earlier / Read */}
      {read.length > 0 && (
        <div className="mb-6">
          <span className="text-[10px] font-black uppercase tracking-widest block mb-3" style={{ color: 'var(--text-secondary)' }}>Earlier</span>
          <div className="space-y-2">
            {read.map(n => <NotifRow key={n.id} n={n} />)}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Bell size={36} className="mx-auto mb-3 text-zinc-300" />
          <p className="text-[13px] font-black text-zinc-400">No notifications yet</p>
          <p className="text-[11px] text-zinc-300 mt-1">You'll see booking requests, Sparks, and messages here</p>
        </div>
      )}

      {/* All caught up */}
      {filtered.length > 0 && (
        <div className="text-center py-8">
          <CheckCircle2 size={28} className="mx-auto mb-2" style={{ color: 'var(--border-mid)' }} />
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>You're all caught up</p>
        </div>
      )}

    </div>
  );
}
