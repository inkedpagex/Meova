'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, SlidersHorizontal, Check, Zap, Users, Rocket,
  Gamepad2, Music2, Code2, Palette, Trophy, Star, MessageSquare
} from 'lucide-react';
import { mockDb } from '../../lib/mockDatabase';
import { getCartoonAvatar } from '../../utils/avatar';

const CATEGORY_ICONS = {
  Tech: Code2, Gaming: Gamepad2, Music: Music2, Design: Palette,
  Startup: Rocket, Sports: Trophy, Creators: Star, Entertainment: Star, General: Users,
};

const CATEGORY_COLORS = {
  Tech: { bg: '#eff6ff', color: '#3b82f6', border: '#bfdbfe' },
  Gaming: { bg: '#f0f9ff', color: '#0ea5e9', border: '#bae6fd' },
  Music: { bg: '#fdf4ff', color: '#a855f7', border: '#e9d5ff' },
  Design: { bg: '#fff7ed', color: '#f97316', border: '#fed7aa' },
  Startup: { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
  Sports: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  Creators: { bg: '#fff1f2', color: '#e11d48', border: '#fecdd3' },
  Entertainment: { bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
  default: { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
};

const MOCK_COMMUNITIES = [
  {
    id: 'startup_circle',
    name: 'Startup Circle',
    category: 'Startup',
    member_count: 1200,
    online: 12,
    desc: 'Build ideas. Find teammates. Meet ambitious students.',
    nextMeetup: '24 May · 4:00 PM',
    isPaid: false,
    price: 0,
    isVerified: true,
    featured: true,
  },
  {
    id: 'gdsc',
    name: 'Google Developer Club',
    category: 'Tech',
    member_count: 181,
    desc: 'Build · Learn · Grow',
    isPaid: false,
    price: 0,
    isVerified: true,
  },
  {
    id: 'creators_club',
    name: 'Creators Club',
    category: 'Creators',
    member_count: 92,
    desc: 'Create. Share. Inspire.',
    isPaid: true,
    price: 50,
  },
  {
    id: 'anime_circle',
    name: 'Anime Circle',
    category: 'Entertainment',
    member_count: 240,
    desc: 'Anime talks & more!',
    isPaid: false,
    price: 0,
  },
  {
    id: 'music_circle',
    name: 'Music Circle',
    category: 'Music',
    member_count: 157,
    desc: 'Make. Jam. Vibe.',
    isPaid: true,
    price: 50,
    isVerified: true,
  },
  {
    id: 'gaming_arena',
    name: 'Gaming Arena',
    category: 'Gaming',
    member_count: 320,
    desc: 'Play. Compete. Win.',
    isPaid: true,
    price: 100,
  },
  {
    id: 'design_lab',
    name: 'Design Lab',
    category: 'Design',
    member_count: 74,
    desc: 'UI · UX · Figma · Branding',
    isPaid: false,
    price: 0,
  },
];

const FILTERS = ['All', 'Tech', 'Gaming', 'Music', 'Design', 'Startup', 'Creators'];

export default function CirclesList({ circles, joinedCircleIds, userId }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [joinedMap, setJoinedMap] = useState({});
  const [sparks, setSparks] = useState(0);

  useEffect(() => {
    const initial = {};
    if (joinedCircleIds) joinedCircleIds.forEach(id => { initial[id] = true; });

    const ls = typeof window !== 'undefined' ? localStorage.getItem('meetify_joined_circles') : null;
    if (ls) try { Object.assign(initial, JSON.parse(ls)); } catch {}
    setJoinedMap(initial);

    if (userId && typeof window !== 'undefined') {
      const w = mockDb.getWallet(userId);
      if (w) setSparks((w.purchased || 0) + (w.bonus || 0) + (w.creator || 0));
    }
  }, [joinedCircleIds, userId]);

  // Merge DB circles
  const dbMapped = (circles || []).map(c => ({
    id: c.id, name: c.name, category: c.category || 'General',
    member_count: c.member_count || 0, desc: c.desc || '',
    isPaid: false, price: 0,
  }));
  const allCircles = [...MOCK_COMMUNITIES];
  dbMapped.forEach(c => { if (!allCircles.some(a => a.id === c.id)) allCircles.push(c); });

  const featured = allCircles.find(c => c.featured);
  const normalCircles = allCircles.filter(c => !c.featured);

  const displayed = normalCircles.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === 'All' || c.category === activeFilter;
    return matchSearch && matchFilter;
  });

  const handleJoin = (circle) => {
    const isJoined = joinedMap[circle.id];

    if (isJoined) {
      // Already joined — go to messages/community chat
      router.push(`/messages?user=${encodeURIComponent(circle.name)}`);
      return;
    }

    if (circle.isPaid) {
      if (sparks < circle.price) {
        alert(`You need ${circle.price} Sparks to join. Your balance: ${sparks} Sparks.\n\nVisit Wallet to add more Sparks.`);
        router.push('/wallet');
        return;
      }
      if (!window.confirm(`Join ${circle.name} for ${circle.price} Sparks?`)) return;
      // Deduct sparks
      if (userId) {
        const w = mockDb.getWallet(userId) || { purchased: 0, bonus: 0, creator: 0 };
        w.purchased = Math.max(0, (w.purchased || 0) - circle.price);
        mockDb.saveWallet(userId, w);
        setSparks(prev => prev - circle.price);
        window.dispatchEvent(new Event('wallet-updated'));
      }
    }

    const next = { ...joinedMap, [circle.id]: true };
    setJoinedMap(next);
    if (typeof window !== 'undefined') localStorage.setItem('meetify_joined_circles', JSON.stringify(next));

    // After joining, open community chat
    setTimeout(() => router.push(`/messages?user=${encodeURIComponent(circle.name)}`), 400);
  };

  const getInitials = (name) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const CommunityAvatar = ({ circle, size = 48 }) => {
    const theme = CATEGORY_COLORS[circle.category] || CATEGORY_COLORS.default;
    const Icon = CATEGORY_ICONS[circle.category] || Users;
    return (
      <div className="rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ width: size, height: size, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.color }}>
        <Icon size={size * 0.4} strokeWidth={2} />
      </div>
    );
  };

  return (
    <div className="space-y-5 pb-24 pt-2">

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search communities..."
          className="w-full pl-11 pr-12 py-3.5 rounded-2xl text-[13px] font-medium outline-none transition-all"
          style={{ background: '#f4f4f6', border: '1px solid #ebebed', color: '#09090b' }}
        />
        <button className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: '#ebebed', color: '#71717a' }}>
          <SlidersHorizontal size={14} />
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className="flex-shrink-0 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide cursor-pointer transition-all active:scale-95"
            style={activeFilter === f
              ? { background: '#7c3aed', color: 'white', border: '1px solid transparent' }
              : { background: '#f4f4f6', color: '#71717a', border: '1px solid #ebebed' }}>
            {f}
          </button>
        ))}
      </div>

      {/* Featured community banner */}
      {featured && !search && activeFilter === 'All' && (
        <div className="relative rounded-3xl p-5 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 8px 32px rgba(124,58,237,0.25)' }}>
          <div className="absolute top-0 right-0 w-36 h-36 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2 bg-white" />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Rocket size={22} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-black text-white">{featured.name}</h3>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-emerald-400 text-emerald-900">Verified</span>
                  </div>
                  <p className="text-[11px] text-white/75 mt-0.5 font-medium max-w-[200px] leading-snug">{featured.desc}</p>
                </div>
              </div>
              <button onClick={() => handleJoin(featured)}
                className="px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide cursor-pointer active:scale-95 transition-all flex-shrink-0"
                style={joinedMap[featured.id]
                  ? { background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }
                  : { background: 'white', color: '#7c3aed' }}>
                {joinedMap[featured.id] ? 'Open' : 'Join'}
              </button>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/80">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {featured.online} online
              </div>
              {featured.nextMeetup && (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/80">
                  <span className="text-white/50">·</span>
                  Next meetup: {featured.nextMeetup}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/80">
                <span className="text-white/50">·</span>
                {(featured.member_count || 0).toLocaleString()} members
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">All Communities</span>
        <span className="text-[11px] font-bold text-[#7c3aed]">{displayed.length} groups</span>
      </div>

      {/* Communities list */}
      <div className="space-y-2.5">
        {displayed.map(circle => {
          const isJoined = joinedMap[circle.id];
          const theme = CATEGORY_COLORS[circle.category] || CATEGORY_COLORS.default;
          const Icon = CATEGORY_ICONS[circle.category] || Users;

          return (
            <div key={circle.id}
              onClick={() => handleJoin(circle)}
              className="p-4 rounded-2xl flex items-center gap-3 cursor-pointer transition-all hover:shadow-sm active:scale-[0.99]"
              style={{ background: '#ffffff', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>

              {/* Avatar */}
              <div className="rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ width: 48, height: 48, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.color }}>
                <Icon size={20} strokeWidth={2} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-black text-zinc-900 truncate">{circle.name}</span>
                  {circle.isVerified && (
                    <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <Check size={9} className="text-white" strokeWidth={3.5} />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: theme.color }}>{circle.category}</span>
                  <span className="text-[9.5px] text-zinc-400">·</span>
                  <span className="text-[9.5px] text-zinc-400 font-medium">{(circle.member_count || 0).toLocaleString()} members</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5 font-medium truncate">{circle.desc}</p>

                {/* Bottom row */}
                <div className="flex items-center gap-3 mt-2">
                  {circle.isPaid ? (
                    <span className="flex items-center gap-1 text-[10px] font-black text-orange-600"
                      style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '2px 8px', borderRadius: 99 }}>
                      <Zap size={9} className="fill-current" />
                      {circle.price} Sparks
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-emerald-600"
                      style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 99 }}>
                      Free
                    </span>
                  )}
                </div>
              </div>

              {/* Join button */}
              <button
                onClick={(e) => { e.stopPropagation(); handleJoin(circle); }}
                className="px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide cursor-pointer transition-all active:scale-95 flex-shrink-0"
                style={isJoined
                  ? { background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }
                  : { background: '#7c3aed', color: 'white' }}>
                {isJoined ? 'Open' : 'Join'}
              </button>
            </div>
          );
        })}
      </div>

      {displayed.length === 0 && (
        <div className="text-center py-16">
          <Users size={28} className="mx-auto mb-3 text-zinc-300" />
          <p className="text-sm font-bold text-zinc-400">No communities found</p>
          <button onClick={() => { setSearch(''); setActiveFilter('All'); }}
            className="mt-3 text-[11px] font-black text-[#7c3aed] cursor-pointer">Clear filters</button>
        </div>
      )}

    </div>
  );
}
