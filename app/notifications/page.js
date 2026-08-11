'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, SlidersHorizontal, Rocket, Camera, Zap, Trophy,
  Gamepad2, Bell, User, CheckCircle2, X, Check, Sparkles
} from 'lucide-react';
import { getCartoonAvatar } from '../../utils/avatar';

const INITIAL_NEW = [
  { id: 'n1', cat: 'Social',      seed: 'Aarav',    msg: 'Aarav Sharma wants to connect with you.', time: '2m ago',  action: 'connect', connected: false },
  { id: 'n2', cat: 'Events',      seed: 'Ritika',   msg: 'Ritika invited you to Coffee Connect', time: '15m ago', action: 'event' },
  { id: 'n3', cat: 'Communities', icon: 'rocket',   msg: 'Startup Circle posted a new event "Pitch Perfect"', time: '1h ago', action: 'community' },
  { id: 'n4', cat: 'Social',      seed: 'Nikhil',   msg: 'Nikhil reacted to your post in Study Buddies', time: '2h ago' },
];

const INITIAL_EARLIER = [
  { id: 'e1', cat: 'Events',      icon: 'camera',   msg: 'Your experience Photography Walk has been approved!', time: '3h ago' },
  { id: 'e2', cat: 'System',      icon: 'sparks',   msg: 'You earned 50 Sparks for joining Study Together.', time: '5h ago', points: '+50' },
  { id: 'e3', cat: 'Communities', icon: 'controller',msg: 'Gaming Arena has 2 new posts.', time: '6h ago' },
  { id: 'e4', cat: 'System',      icon: 'trophy',   msg: 'Weekly leaderboard is out! Check now', time: '1d ago' },
  { id: 'e5', cat: 'Social',      seed: 'Ananya',   msg: 'Your post "Looking for AI/ML Study Buddy" got 12 reactions.', time: '1d ago' },
];

const FILTERS = ['All', 'Social', 'Events', 'Communities', 'System'];

function SystemIcon({ type }) {
  const base = "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border";
  if (type === 'rocket')     return <div className={`${base} bg-purple-500/10 text-purple-500 border-purple-500/20`}><Rocket size={16} /></div>;
  if (type === 'camera')     return <div className={`${base} bg-blue-500/10 text-blue-500 border-blue-500/20`}><Camera size={16} /></div>;
  if (type === 'sparks')     return <div className={`${base} bg-orange-500/10 text-orange-500 border-orange-500/20`}><Zap size={16} className="fill-current" /></div>;
  if (type === 'controller') return <div className={`${base} bg-indigo-500/10 text-indigo-500 border-indigo-500/20`}><Gamepad2 size={16} /></div>;
  if (type === 'trophy')     return <div className={`${base} bg-pink-500/10 text-pink-500 border-pink-500/20`}><Trophy size={16} /></div>;
  return <div className={`${base} bg-zinc-500/10 border-zinc-200`} style={{ color: 'var(--text-muted)' }}><Sparkles size={16} /></div>;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState('All');
  const [newNotifs, setNewNotifs] = useState(INITIAL_NEW);
  const [earlier] = useState(INITIAL_EARLIER);

  const handleConnect = (id) => {
    setNewNotifs(prev => prev.map(n => n.id === id ? { ...n, connected: true } : n));
    router.push(`/messages?user=Aarav`);
  };

  const applyFilter = (list) => filter === 'All' ? list : list.filter(n => n.cat === filter);

  const NotifRow = ({ n, isNew }) => (
    <div className="p-4 rounded-2xl flex items-center justify-between gap-3 transition-all"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {n.seed
          ? <div className="w-10 h-10 rounded-full overflow-hidden border flex-shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
              <img src={getCartoonAvatar(n.seed)} alt={n.seed} className="w-full h-full object-cover" />
            </div>
          : <SystemIcon type={n.icon} />
        }
        <div className="min-w-0">
          <p className="text-[12px] font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>{n.msg}</p>
          <span className="text-[10px] mt-1 block" style={{ color: 'var(--text-muted)' }}>{n.time}</span>
        </div>
      </div>
      {/* Right action */}
      {n.action === 'connect' && (
        <button onClick={() => handleConnect(n.id)}
          className="px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex-shrink-0 cursor-pointer transition-all active:scale-95"
          style={n.connected
            ? { background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }
            : { background: '#7c3aed', color: 'white' }}>
          {n.connected ? 'Connected' : 'Connect'}
        </button>
      )}
      {n.points && (
        <span className="px-2.5 py-1 rounded-lg text-[11px] font-black flex-shrink-0 text-orange-500"
          style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
          {n.points}
        </span>
      )}
      {!n.action && !n.points && isNew && (
        <span className="w-2 h-2 rounded-full bg-[#7c3aed] flex-shrink-0" />
      )}
    </div>
  );

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
        <button className="p-2 rounded-xl border cursor-pointer" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
          <SlidersHorizontal size={15} />
        </button>
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

      {/* New */}
      {applyFilter(newNotifs).length > 0 && (
        <div className="mb-6">
          <span className="text-[10px] font-black uppercase tracking-widest block mb-3" style={{ color: 'var(--text-secondary)' }}>New</span>
          <div className="space-y-2">
            {applyFilter(newNotifs).map(n => <NotifRow key={n.id} n={n} isNew />)}
          </div>
        </div>
      )}

      {/* Earlier */}
      {applyFilter(earlier).length > 0 && (
        <div className="mb-6">
          <span className="text-[10px] font-black uppercase tracking-widest block mb-3" style={{ color: 'var(--text-secondary)' }}>Earlier</span>
          <div className="space-y-2">
            {applyFilter(earlier).map(n => <NotifRow key={n.id} n={n} isNew={false} />)}
          </div>
        </div>
      )}

      {/* All caught up */}
      <div className="text-center py-8">
        <CheckCircle2 size={28} className="mx-auto mb-2" style={{ color: 'var(--border-mid)' }} />
        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>You're all caught up</p>
      </div>

    </div>
  );
}
