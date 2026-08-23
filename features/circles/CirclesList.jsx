'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, SlidersHorizontal, Check, Zap, Users, Rocket,
  Gamepad2, Music2, Code2, Palette, Trophy, Star, MessageSquare
} from 'lucide-react';
import { getCartoonAvatar } from '../../utils/avatar';

const CATEGORY_ICONS = {
  Tech: Code2, Gaming: Gamepad2, Music: Music2, Design: Palette,
  Startup: Rocket, Sports: Trophy, Creators: Star, Entertainment: Star, General: Users,
};

const CATEGORY_COLORS = {
  Tech: { bg: '#eff6ff', color: '#3b82f6', border: '#bfdbfe' },
  Gaming: { bg: '#f0f9ff', color: '#0ea5e9', border: '#bae6fd' },
  Music: { bg: '#fdf4ff', color: '#b5609d', border: '#e9d5ff' },
  Design: { bg: '#fff7ed', color: '#f97316', border: '#fed7aa' },
  Startup: { bg: '#f5f3ff', color: '#8C3573', border: '#ddd6fe' },
  Sports: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  Creators: { bg: '#fff1f2', color: '#e11d48', border: '#fecdd3' },
  Entertainment: { bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
  default: { bg: '#f5f3ff', color: '#8C3573', border: '#ddd6fe' },
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
    whatsapp_link: 'https://chat.whatsapp.com/',
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
    whatsapp_link: 'https://chat.whatsapp.com/',
  },
  {
    id: 'creators_club',
    name: 'Creators Club VIP',
    category: 'Creators',
    member_count: 92,
    desc: 'Create. Share. Inspire.',
    isPaid: true,
    price: 50,
    whatsapp_link: 'https://chat.whatsapp.com/',
  },
  {
    id: 'anime_circle',
    name: 'Anime & Manga Society',
    category: 'Entertainment',
    member_count: 240,
    desc: 'Anime talks, watch parties & cosplay meets!',
    isPaid: false,
    price: 0,
    whatsapp_link: 'https://chat.whatsapp.com/',
  },
  {
    id: 'music_circle',
    name: 'Campus Jam & Music',
    category: 'Music',
    member_count: 157,
    desc: 'Make jams, vibe, share playlist links.',
    isPaid: true,
    price: 50,
    isVerified: true,
    whatsapp_link: 'https://chat.whatsapp.com/',
  },
  {
    id: 'gaming_arena',
    name: 'Campus Esports & Gaming',
    category: 'Gaming',
    member_count: 320,
    desc: 'BGMI, Valorant, FIFA tournaments & rooms.',
    isPaid: true,
    price: 100,
    whatsapp_link: 'https://chat.whatsapp.com/',
  },
  {
    id: 'design_lab',
    name: 'UI/UX & Design Lab',
    category: 'Design',
    member_count: 74,
    desc: 'UI · UX · Figma · Portfolio Reviews',
    isPaid: false,
    price: 0,
    whatsapp_link: 'https://chat.whatsapp.com/',
  },
];

const FILTERS = ['All', 'Tech', 'Gaming', 'Music', 'Design', 'Startup', 'Creators'];

export default function CirclesList({ circles = [], joinedCircleIds = new Set(), userId = null }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [joinedMap, setJoinedMap] = useState({});
  const [sparks, setSparks] = useState(0);

  // Modal states
  const [rulesCircle, setRulesCircle] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [manageCircle, setManageCircle] = useState(null);
  const [joiningId, setJoiningId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const initial = {};
    if (joinedCircleIds) joinedCircleIds.forEach(id => { initial[id] = true; });
    const ls = typeof window !== 'undefined' ? localStorage.getItem('meetify_joined_circles') : null;
    if (ls) try { Object.assign(initial, JSON.parse(ls)); } catch {}
    if (!cancelled) setJoinedMap(initial);

    if (userId && typeof window !== 'undefined') {
      fetch('/api/wallet')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (cancelled) return;
          if (data?.wallet) {
            const total = (data.wallet.purchased || 0) + (data.wallet.bonus || 0) + (data.wallet.creator || 0);
            setSparks(total);
          }
        })
        .catch(() => {});
    }
    return () => { cancelled = true; };
  }, [joinedCircleIds, userId]);

  // Merge DB circles
  const dbMapped = (circles || []).map(c => ({
    id: c.id, 
    name: c.name, 
    category: c.category || 'General',
    member_count: c.member_count || 0, 
    desc: c.desc || c.description || '',
    isPaid: c.isPaid || false, 
    price: c.price || 0,
    host_id: c.host_id,
    whatsapp_link: c.whatsapp_link || 'https://chat.whatsapp.com/',
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

  const handleJoinClick = (circle) => {
    const isJoined = joinedMap[circle.id];
    if (isJoined) {
      // Call secure join to retrieve unlocked link
      executeSecureJoin(circle);
      return;
    }
    // Show Group Rules & Agenda Modal before completing join
    setRulesCircle(circle);
  };

  const confirmJoinCircle = () => {
    if (!rulesCircle) return;
    executeSecureJoin(rulesCircle);
    setRulesCircle(null);
  };

  const executeSecureJoin = async (circle) => {
    setJoiningId(circle.id);
    try {
      const res = await fetch(`/api/circles/${circle.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setJoiningId(null);

      if (res.status === 402) {
        toast.error(data.error || 'Insufficient Sparks!');
        router.push('/wallet');
        return;
      }

      if (res.ok && data.success) {
        if (data.sparksDeducted > 0) {
          toast.success(`Joined ${circle.name}! ${data.sparksDeducted} Sparks deducted.`);
          setSparks(prev => Math.max(0, prev - data.sparksDeducted));
          window.dispatchEvent(new Event('wallet-updated'));
        }

        const next = { ...joinedMap, [circle.id]: true };
        setJoinedMap(next);
        if (typeof window !== 'undefined') localStorage.setItem('meetify_joined_circles', JSON.stringify(next));

        if (data.invite_link) {
          window.open(data.invite_link, '_blank');
        } else {
          router.push(`/messages?user=${encodeURIComponent(circle.name)}`);
        }
      } else {
        toast.error(data.error || 'Failed to join community');
      }
    } catch (err) {
      setJoiningId(null);
      console.error(err);
      toast.error('Network error, please try again');
    }
  };

  // Helper to get avatar mock stack
  const getAvatarStack = (circleId) => [
    getCartoonAvatar(`${circleId}_1`),
    getCartoonAvatar(`${circleId}_2`),
    getCartoonAvatar(`${circleId}_3`),
  ];

  return (
    <div className="space-y-5 pb-24 pt-2">

      {/* Host a Community CTA Banner */}
      <div className="bg-gradient-to-r from-[#512142] via-indigo-900 to-purple-950 rounded-3xl p-5 text-white shadow-xl shadow-purple-950/20 border border-[#60234d]/40 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#9e4685]/30 text-[#eac5e0] border border-[#b5609d]/30">
              Host Monetization
            </span>
            <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
              <Zap size={12} className="fill-current text-amber-300" /> 100% Sparks Earnings
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-black tracking-tight text-white">Create Your Campus Channel</h3>
          <p className="text-[11px] text-[#eac5e0]/80 font-medium">Monetize your WhatsApp, Telegram or Insta community and track joined students.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-3 rounded-2xl bg-white hover:bg-[#fcf6fa] text-[#512142] font-black text-xs transition-all shadow-lg active:scale-95 flex-shrink-0 cursor-pointer"
        >
          + Host Channel
        </button>
      </div>

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
              ? { background: '#8C3573', color: 'white', border: '1px solid transparent' }
              : { background: '#f4f4f6', color: '#71717a', border: '1px solid #ebebed' }}>
            {f}
          </button>
        ))}
      </div>

      {/* Featured community banner */}
      {featured && !search && activeFilter === 'All' && (
        <div className="relative rounded-3xl p-5 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #8C3573, #8C3573)', boxShadow: '0 8px 32px rgba(140,53,115,0.25)' }}>
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
              <button onClick={() => handleJoinClick(featured)}
                disabled={joiningId === featured.id}
                className="px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide cursor-pointer active:scale-95 transition-all flex-shrink-0"
                style={joinedMap[featured.id]
                  ? { background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }
                  : { background: 'white', color: '#8C3573' }}>
                {joiningId === featured.id ? 'Joining...' : (joinedMap[featured.id] ? 'Open' : 'Join')}
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
            </div>
          </div>
        </div>
      )}

      {/* Community cards list */}
      <div className="space-y-3">
        {displayed.map(circle => {
          const isJoined = joinedMap[circle.id];
          const isHost = circle.host_id && circle.host_id === userId;
          const CategoryIcon = CATEGORY_ICONS[circle.category] || CATEGORY_ICONS.default;
          const categoryStyle = CATEGORY_COLORS[circle.category] || CATEGORY_COLORS.default;

          return (
            <div
              key={circle.id}
              onClick={() => handleJoinClick(circle)}
              className="rounded-3xl p-4 sm:p-4.5 flex items-center justify-between gap-3 transition-all cursor-pointer group"
              style={{
                background: '#ffffff',
                border: '1px solid #f0f0f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}>
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Category Icon */}
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                  style={{ background: categoryStyle.bg, border: `1px solid ${categoryStyle.border}` }}>
                  <CategoryIcon size={20} style={{ color: categoryStyle.color }} />
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[13px] font-black text-zinc-900 truncate">{circle.name}</h4>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex-shrink-0"
                      style={{ background: categoryStyle.bg, color: categoryStyle.color, border: `1px solid ${categoryStyle.border}` }}>
                      {circle.category}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 font-medium truncate">{circle.desc || 'Campus Community'}</p>

                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500">
                      <Users size={11} className="text-zinc-400" />
                      <span>{circle.member_count} members</span>
                    </div>

                    {circle.isPaid ? (
                      <span className="text-[9.5px] font-black text-[#74295d] px-2 py-0.5 rounded-full bg-[#fcf6fa] border border-[#eac5e0] flex items-center gap-0.5">
                        <Zap size={9} className="fill-[#8C3573] text-[#8C3573]" />
                        {circle.price} Sparks
                      </span>
                    ) : (
                      <span className="text-[9.5px] font-black text-emerald-600 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                        Free
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {isHost && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setManageCircle(circle); }}
                    className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-[#fcf6fa] text-[#74295d] border border-[#eac5e0] hover:bg-[#f5ebf4] transition-colors"
                  >
                    Manage
                  </button>
                )}

                <button
                  onClick={(e) => { e.stopPropagation(); handleJoinClick(circle); }}
                  disabled={joiningId === circle.id}
                  className="px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide cursor-pointer transition-all active:scale-95 flex-shrink-0 flex items-center gap-1.5"
                  style={isJoined
                    ? { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }
                    : { background: '#8C3573', color: 'white' }}>
                  {joiningId === circle.id ? 'Joining...' : (isJoined ? 'JOINED' : (circle.isPaid ? `${circle.price} ⚡ JOIN` : 'JOIN'))}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {displayed.length === 0 && (
        <div className="text-center py-16">
          <Users size={28} className="mx-auto mb-3 text-zinc-300" />
          <p className="text-sm font-bold text-zinc-400">No communities found</p>
          <button onClick={() => { setSearch(''); setActiveFilter('All'); }}
            className="mt-3 text-[11px] font-black text-[#8C3573] cursor-pointer">Clear filters</button>
        </div>
      )}

      {/* ── CREATE COMMUNITY MODAL ────────────────────────── */}
      <CreateCircleModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* ── HOST COMMUNITY DASHBOARD MODAL ────────────────── */}
      {manageCircle && (
        <HostCircleDashboardModal
          isOpen={Boolean(manageCircle)}
          circleId={manageCircle.id}
          circleName={manageCircle.name}
          onClose={() => setManageCircle(null)}
        />
      )}

      {/* ── GROUP RULES & MEETING AGENDA PRE-JOIN MODAL ───────── */}
      {rulesCircle && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={() => setRulesCircle(null)}
        >
          <div 
            className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-4 animate-in fade-in zoom-in duration-200 shadow-2xl border border-[#f5ebf4]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-[#f5ebf4] flex items-center justify-center text-[#8C3573] font-black text-sm">
                👥
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-black text-zinc-900 truncate">{rulesCircle.name}</h3>
                <p className="text-[10px] font-bold text-[#8C3573] uppercase tracking-wider">{rulesCircle.category} Community</p>
              </div>
            </div>

            <div className="space-y-3 py-1 text-left">
              <h4 className="text-xs font-black text-zinc-800 uppercase tracking-wider">Community Guidelines & Rules:</h4>
              <ul className="space-y-2 text-xs font-medium text-zinc-600">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#f5ebf4] text-[#74295d] flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">1</span>
                  <span><strong>Respect & Kindness:</strong> Maintain constructive, friendly discussions with campus peers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#f5ebf4] text-[#74295d] flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">2</span>
                  <span><strong>No Spam or Promo:</strong> Share relevant projects, meets, or notes only.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#f5ebf4] text-[#74295d] flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">3</span>
                  <span><strong>Campus Safety:</strong> Keep meetups in verified public campus spots.</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRulesCircle(null)}
                className="flex-1 py-3 rounded-2xl text-xs font-black text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors"
              >
                Decline
              </button>
              <button
                onClick={confirmJoinCircle}
                className="flex-1 py-3 rounded-2xl text-xs font-black text-white bg-[#8C3573] hover:bg-[#74295d] transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                {rulesCircle.isPaid ? `Agree & Join (${rulesCircle.price} ⚡)` : 'Agree & Join Group'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
