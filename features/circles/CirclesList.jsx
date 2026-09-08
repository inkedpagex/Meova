'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search, SlidersHorizontal, Check, Zap, Users, Rocket,
  Gamepad2, Music2, Code2, Palette, Trophy, Star, Share2, LogOut,
  ShieldCheck
} from '@/lib/icons';
import { toast } from 'react-hot-toast';
import CreateCircleModal from './CreateCircleModal';
import HostCircleDashboardModal from './HostCircleDashboardModal';

const CATEGORY_ICONS = {
  Tech: Code2,
  Gaming: Gamepad2,
  Music: Music2,
  Design: Palette,
  Startup: Rocket,
  Sports: Trophy,
  Creators: Star,
  Entertainment: Star,
  General: Users,
};

// High-contrast clean neutral badges across categories
const CATEGORY_COLORS = {
  Tech: { bg: '#FAFAF8', color: '#1C1917', border: '#E7E5E4' },
  Gaming: { bg: '#FAFAF8', color: '#1C1917', border: '#E7E5E4' },
  Music: { bg: '#FAFAF8', color: '#1C1917', border: '#E7E5E4' },
  Design: { bg: '#FAFAF8', color: '#1C1917', border: '#E7E5E4' },
  Startup: { bg: '#FAFAF8', color: '#1C1917', border: '#E7E5E4' },
  Sports: { bg: '#FAFAF8', color: '#1C1917', border: '#E7E5E4' },
  Creators: { bg: '#FAFAF8', color: '#1C1917', border: '#E7E5E4' },
  Entertainment: { bg: '#FAFAF8', color: '#1C1917', border: '#E7E5E4' },
  default: { bg: '#FAFAF8', color: '#1C1917', border: '#E7E5E4' },
};

// Initial database mirror for instant rendering before SWR finishes
const OFFICIAL_CAMPUS_CIRCLES = [
  {
    id: 'startup_circle',
    name: 'Startup Circle',
    category: 'Startup',
    member_count: 1240,
    online: 18,
    desc: 'Official campus startup & founder network. Build ideas, pitch decks, and find co-founders.',
    nextMeetup: 'Thursday · 4:00 PM',
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
    member_count: 380,
    desc: 'Open-source builders, web & app developers, AI hackathons, and DSA workshops.',
    isPaid: false,
    price: 0,
    isVerified: true,
    whatsapp_link: 'https://chat.whatsapp.com/',
  },
  {
    id: 'creators_club',
    name: 'Creators Club VIP',
    category: 'Creators',
    member_count: 195,
    desc: 'Campus content creators, video editors, podcasters, photographers, and visual artists.',
    isPaid: true,
    price: 50,
    isVerified: true,
    whatsapp_link: 'https://chat.whatsapp.com/',
  },
  {
    id: 'anime_circle',
    name: 'Anime & Manga Society',
    category: 'Entertainment',
    member_count: 290,
    desc: 'Weekly anime watch parties, manga discussions, art contests, and campus cosplay meetups.',
    isPaid: false,
    price: 0,
    isVerified: true,
    whatsapp_link: 'https://chat.whatsapp.com/',
  },
  {
    id: 'music_circle',
    name: 'Campus Jam & Music',
    category: 'Music',
    member_count: 215,
    desc: 'Acoustic jam sessions, beatmakers, vocalists, campus open-mic nights, and music collabs.',
    isPaid: true,
    price: 50,
    isVerified: true,
    whatsapp_link: 'https://chat.whatsapp.com/',
  },
  {
    id: 'gaming_arena',
    name: 'Campus Esports & Gaming',
    category: 'Gaming',
    member_count: 460,
    desc: 'Daily BGMI, Valorant, FIFA, and Rocket League campus scrims, tournaments & custom rooms.',
    isPaid: true,
    price: 100,
    isVerified: true,
    whatsapp_link: 'https://chat.whatsapp.com/',
  },
  {
    id: 'design_lab',
    name: 'UI/UX & Design Lab',
    category: 'Design',
    member_count: 140,
    desc: 'Figma jams, design systems, portfolio reviews, product teardowns, and campus redesigns.',
    isPaid: false,
    price: 0,
    isVerified: true,
    whatsapp_link: 'https://chat.whatsapp.com/',
  },
];

const FILTERS = ['All', 'Joined', 'My Channels', 'Tech', 'Gaming', 'Music', 'Design', 'Startup', 'Creators'];
const EMPTY_SET = new Set();

export default function CirclesList({
  circles = [],
  joinedCircleIds = EMPTY_SET,
  userId = null,
  externalSearch = '',
  hideSearch = false
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  
  // Lazy state init reads localStorage once without infinite re-render loop
  const [joinedMap, setJoinedMap] = useState(() => {
    const initial = {};
    if (joinedCircleIds && typeof joinedCircleIds.forEach === 'function') {
      joinedCircleIds.forEach(id => { initial[id] = true; });
    }
    if (typeof window !== 'undefined') {
      try {
        const ls = localStorage.getItem('Meova_joined_circles');
        if (ls) Object.assign(initial, JSON.parse(ls));
      } catch {}
    }
    return initial;
  });

  const [sparks, setSparks] = useState(0);

  const effectiveSearch = hideSearch ? externalSearch : search;

  // Modal states
  const [rulesCircle, setRulesCircle] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [manageCircle, setManageCircle] = useState(null);
  const [joiningId, setJoiningId] = useState(null);

  const circleIdParam = searchParams?.get('id');
  useEffect(() => {
    if (!circleIdParam) return;
    const found = (circles || []).find(c => c.id === circleIdParam) || OFFICIAL_CAMPUS_CIRCLES.find(c => c.id === circleIdParam);
    if (found) {
      setRulesCircle(found);
    }
  }, [circleIdParam, circles]);

  // Sync external joinedCircleIds changes safely
  const joinedKey = joinedCircleIds && typeof joinedCircleIds.forEach === 'function'
    ? Array.from(joinedCircleIds).sort().join(',')
    : '';

  useEffect(() => {
    if (!joinedKey) return;
    setJoinedMap(prev => {
      let hasNew = false;
      const next = { ...prev };
      joinedCircleIds.forEach(id => {
        if (!next[id]) {
          next[id] = true;
          hasNew = true;
        }
      });
      return hasNew ? next : prev;
    });
  }, [joinedKey]);

  // Fetch wallet balance once per user
  useEffect(() => {
    if (!userId || typeof window === 'undefined') return;
    let cancelled = false;
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
    return () => { cancelled = true; };
  }, [userId]);

  // Primary data source: Live Supabase circles, with official campus mirror
  const sourceCircles = circles && circles.length > 0 ? circles : OFFICIAL_CAMPUS_CIRCLES;
  
  const allCircles = sourceCircles.map(c => ({
    id: c.id, 
    name: c.name, 
    category: c.category || 'General',
    member_count: c.member_count || c.members_count || 1, 
    desc: c.desc || c.description || '',
    isPaid: c.isPaid || c.is_paid || (c.price > 0) || false, 
    price: c.price || 0,
    host_id: c.creator_id || c.host_id,
    host_name: c.host_name,
    host_photo: c.host_photo,
    whatsapp_link: c.invite_link || c.whatsapp_link || 'https://chat.whatsapp.com/',
    featured: Boolean(c.featured || c.id === 'startup_circle'),
    isVerified: c.isVerified !== undefined ? c.isVerified : true,
    nextMeetup: c.nextMeetup || (c.id === 'startup_circle' ? 'Thursday · 4:00 PM' : null),
    online: c.online || (c.id === 'startup_circle' ? 18 : 12),
  }));

  const featured = allCircles.find(c => c.featured);
  const normalCircles = allCircles.filter(c => !c.featured);

  const displayed = normalCircles.filter(c => {
    const query = (effectiveSearch || '').trim().toLowerCase();
    const matchSearch = !query || c.name.toLowerCase().includes(query) || c.category.toLowerCase().includes(query) || (c.desc || '').toLowerCase().includes(query);
    
    let matchFilter = true;
    if (activeFilter === 'Joined') {
      matchFilter = Boolean(joinedMap[c.id] || c.host_id === userId);
    } else if (activeFilter === 'My Channels') {
      matchFilter = c.host_id === userId;
    } else if (activeFilter !== 'All') {
      matchFilter = c.category === activeFilter;
    }
    
    return matchSearch && matchFilter;
  });

  const handleJoinClick = (circle) => {
    const isJoined = joinedMap[circle.id];
    if (isJoined) {
      executeSecureJoin(circle);
      return;
    }
    // Show pre-join rules modal
    setRulesCircle(circle);
  };

  const confirmJoinCircle = () => {
    if (!rulesCircle) return;
    executeSecureJoin(rulesCircle);
    setRulesCircle(null);
  };

  const handleLeaveCircle = async (circle, e) => {
    e?.stopPropagation();
    if (!window.confirm(`Leave the ${circle.name} community?`)) return;
    try {
      const res = await fetch(`/api/circles/${circle.id}/leave`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Left ${circle.name}`);
        const next = { ...joinedMap };
        delete next[circle.id];
        setJoinedMap(next);
        if (typeof window !== 'undefined') localStorage.setItem('Meova_joined_circles', JSON.stringify(next));
      } else {
        toast.error(data.error || 'Failed to leave community');
      }
    } catch {
      toast.error('Network error');
    }
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
        if (typeof window !== 'undefined') localStorage.setItem('Meova_joined_circles', JSON.stringify(next));

        const targetUrl = data.invite_link || circle.whatsapp_link;
        if (targetUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) {
          window.open(targetUrl, '_blank');
        } else {
          toast.success(`You are a verified member of ${circle.name}!`);
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

  return (
    <div className="space-y-4 pb-24 pt-1">

      {/* Host a Community Banner */}
      <div className="bg-white rounded-[26px] p-5 sm:p-6 text-black shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-black/10 flex items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-black/5 text-[#1C1917] border border-black/10 tracking-wider">
              Host Monetization
            </span>
            <span className="text-[10px] font-bold text-black/60 flex items-center gap-1">
              <Zap size={12} className="fill-amber-500 text-amber-500" /> 100% Sparks Earnings
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold tracking-tight text-black">Create Your Campus Channel</h3>
          <p className="text-[12px] text-black/60 font-medium">Monetize your WhatsApp, Telegram or campus community.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 h-10 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-xs transition-all shadow-[0_2px_10px_rgba(124,58,237,0.25)] active:scale-95 flex-shrink-0 whitespace-nowrap cursor-pointer"
        >
          + Host Channel
        </button>
      </div>

      {/* Search (if not controlled externally) */}
      {!hideSearch && (
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search communities..."
            className="w-full pl-11 pr-12 py-3.5 rounded-full text-[13px] font-medium outline-none transition-all bg-white border border-black/10 text-black focus:border-black"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center bg-white border border-black/10 text-black/60 hover:text-black hover:border-black/30 transition-colors">
            <SlidersHorizontal size={14} />
          </button>
        </div>
      )}

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map(f => {
          const isSelected = activeFilter === f;
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wide cursor-pointer transition-all active:scale-95 whitespace-nowrap ${
                isSelected
                  ? 'bg-black text-white shadow-xs border border-black'
                  : 'bg-white text-black/70 hover:text-black border border-black/10'
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* Featured Community Banner */}
      {featured && !effectiveSearch && activeFilter === 'All' && (
        <div 
          className="relative rounded-[26px] p-5 sm:p-6 overflow-hidden shadow-md bg-[#1C1917] text-white border border-white/10"
        >
          <div className="relative z-10 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-[20px] bg-white/10 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                  <Rocket size={22} className="text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">{featured.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-400 text-black tracking-wide">
                      Verified
                    </span>
                  </div>
                  <p className="text-[12px] text-white/85 mt-1 font-normal line-clamp-2 max-w-md leading-relaxed">
                    {featured.desc}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleJoinClick(featured)}
                disabled={joiningId === featured.id}
                className={`px-5 h-9 rounded-full text-xs font-bold uppercase tracking-wide cursor-pointer active:scale-95 transition-all flex-shrink-0 whitespace-nowrap shadow-md ${
                  joinedMap[featured.id]
                    ? 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
                    : 'bg-[#7657D9] text-white hover:bg-[#6848C9] active:bg-[#5B3FB3]'
                }`}
              >
                {joiningId === featured.id ? 'Joining...' : (joinedMap[featured.id] ? 'Open' : 'Join')}
              </button>
            </div>

            <div className="flex items-center gap-4 pt-1 border-t border-white/20 text-[11px] font-medium text-white/90 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{featured.online || 18} online</span>
              </div>
              <span className="text-white/40">·</span>
              <div className="flex items-center gap-1.5">
                <Users size={12} className="text-white/70" />
                <span>{featured.member_count} members</span>
              </div>
              {featured.nextMeetup && (
                <>
                  <span className="text-white/40">·</span>
                  <span>Next meetup: {featured.nextMeetup}</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Communities List */}
      <div className="space-y-3">
        {displayed.length === 0 ? (
          <div className="bg-white rounded-[26px] border border-black/10 p-8 text-center space-y-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <div className="w-14 h-14 rounded-[20px] bg-black/5 border border-black/10 text-black flex items-center justify-center mx-auto shadow-xs">
              <Users size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-black">No Communities Found</h3>
              <p className="text-xs text-black/60 font-medium max-w-xs mx-auto leading-relaxed">
                {effectiveSearch || activeFilter !== 'All' 
                  ? 'No circles match your current search or filter. Try a different term!' 
                  : 'Be the first student to create a campus circle or community!'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              {effectiveSearch || activeFilter !== 'All' ? (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setActiveFilter('All'); }}
                  className="px-5 py-2.5 rounded-full bg-black/5 hover:bg-black/10 text-black text-xs font-bold active:scale-95 transition-all cursor-pointer border border-black/10"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="px-5 py-2.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold shadow-[0_2px_10px_rgba(124,58,237,0.25)] active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Rocket size={13} />
                  <span>Create Circle</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          displayed.map(circle => {
            const isJoined = joinedMap[circle.id];
            const isHost = circle.host_id === user?.id;
            const categoryStyle = getCategoryStyle(circle.category);
            const CategoryIcon = categoryStyle.icon;

            return (
              <div
                key={circle.id}
                onClick={() => handleJoinClick(circle)}
                className="bg-white border border-black/10 hover:border-black/30 rounded-[26px] p-4 sm:p-5 flex items-center justify-between gap-3 sm:gap-4 transition-all duration-150 hover:shadow-sm active:scale-[0.99] cursor-pointer group"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                  {/* Category Icon */}
                  <div
                    className="w-12 h-12 rounded-[20px] flex items-center justify-center flex-shrink-0 transition-transform duration-150 group-hover:scale-105"
                    style={{ background: categoryStyle.bg, border: `1px solid ${categoryStyle.border}` }}
                  >
                    <CategoryIcon size={22} style={{ color: categoryStyle.color }} />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    {/* Category Pill & Verified Badge */}
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span
                        className="px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider flex-shrink-0"
                        style={{ background: categoryStyle.bg, color: categoryStyle.color, border: `1px solid ${categoryStyle.border}` }}
                      >
                        {circle.category}
                      </span>
                      {circle.isVerified && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
                          <Check size={9} className="stroke-[3]" /> Verified
                        </span>
                      )}
                    </div>

                    {/* Full Title (untruncated) */}
                    <h4 className="text-[14px] sm:text-[15px] font-bold text-black tracking-tight leading-snug line-clamp-1 group-hover:text-black/80 transition-colors">
                      {circle.name}
                    </h4>

                    {/* Description */}
                    <p className="text-[12px] text-black/60 font-normal line-clamp-1 mt-0.5 leading-relaxed">
                      {circle.desc || circle.description || 'Official campus community on Meova.'}
                    </p>

                    {/* Stats & Pricing */}
                    <div className="flex items-center gap-2 pt-1.5 text-[11px] font-medium text-black/50 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Users size={12} className="text-black/40" />
                        <span className="font-semibold text-black/80">{circle.member_count} members</span>
                      </div>
                      <span className="text-black/20">·</span>
                      {circle.host_name ? (
                        <div className="flex items-center gap-1">
                          {circle.host_photo ? (
                            <img src={circle.host_photo} alt="" className="w-3.5 h-3.5 rounded-full object-cover border border-black/10" />
                          ) : null}
                          <span>by {circle.host_name.split(' ')[0]}</span>
                        </div>
                      ) : (
                        <span className="text-[9.5px] font-bold text-black/70 uppercase bg-black/5 px-1.5 py-0.5 rounded-md border border-black/10">
                          Campus Circle
                        </span>
                      )}
                      <span className="text-black/20">·</span>
                      {circle.isPaid ? (
                        <span className="text-[10px] font-bold text-amber-700 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 flex items-center gap-0.5">
                          <Zap size={10} className="fill-amber-500 text-amber-500" />
                          {circle.price} Sparks
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                          Free
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const circleUrl = `${window.location.origin}/discover?tab=circles&id=${circle.id}`;
                      if (typeof window !== 'undefined' && navigator.share) {
                        navigator.share({
                          title: `${circle.name} on Meova`,
                          text: circle.desc || `Join the ${circle.name} community on Meova!`,
                          url: circleUrl
                        }).catch(() => {});
                      } else {
                        navigator.clipboard.writeText(circleUrl);
                        toast.success('Community link copied!');
                      }
                    }}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-black/60 hover:text-black hover:bg-black/5 border border-black/10 transition-all active:scale-95 cursor-pointer"
                    title="Share Community"
                  >
                    <Share2 size={14} />
                  </button>

                  {isHost ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); setManageCircle(circle); }}
                      className="px-3 h-9 rounded-full text-[11px] font-bold uppercase tracking-wider bg-black/5 text-black border border-black/10 hover:bg-black/10 transition-all cursor-pointer whitespace-nowrap"
                    >
                      Manage
                    </button>
                  ) : isJoined ? (
                    <button
                      onClick={(e) => handleLeaveCircle(circle, e)}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-black/40 hover:text-rose-600 hover:bg-rose-50 border border-black/10 hover:border-rose-200 transition-all cursor-pointer"
                      title="Leave Community"
                    >
                      <LogOut size={13} />
                    </button>
                  ) : null}

                  <button
                    onClick={(e) => { e.stopPropagation(); handleJoinClick(circle); }}
                    disabled={joiningId === circle.id}
                    className={`h-9 px-4 rounded-full text-xs font-bold uppercase tracking-wide cursor-pointer transition-all active:scale-95 flex-shrink-0 whitespace-nowrap flex items-center gap-1.5 ${
                      isJoined
                        ? 'bg-black text-white hover:bg-black/90 shadow-sm'
                        : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-[0_2px_10px_rgba(124,58,237,0.25)]'
                    }`}
                  >
                    {joiningId === circle.id ? 'Joining...' : (isJoined ? 'Open' : 'Join')}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Community Modal */}
      <CreateCircleModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Host Community Dashboard Modal */}
      {manageCircle && (
        <HostCircleDashboardModal
          isOpen={Boolean(manageCircle)}
          circleId={manageCircle.id}
          circleName={manageCircle.name}
          onClose={() => setManageCircle(null)}
        />
      )}

      {/* Group Rules & Guidelines Pre-Join Modal */}
      {rulesCircle && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setRulesCircle(null)}
        >
          <div 
            className="w-full max-w-sm bg-white rounded-[28px] p-6 space-y-4 shadow-2xl border border-black/10 anim-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-black/10 pb-3">
              <div className="w-11 h-11 rounded-[20px] bg-black/5 flex items-center justify-center flex-shrink-0 border border-black/10">
                <Users size={20} className="text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-black truncate">{rulesCircle.name}</h3>
                <p className="text-[10px] font-bold text-black/60 uppercase tracking-wider">{rulesCircle.category} Community</p>
              </div>
            </div>

            <div className="space-y-3 py-1 text-left">
              <h4 className="text-xs font-bold text-black uppercase tracking-wider">Community Guidelines & Rules:</h4>
              <ul className="space-y-2 text-xs font-medium text-black/70">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">1</span>
                  <span><strong>Respect & Kindness:</strong> Maintain constructive, friendly discussions with campus peers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">2</span>
                  <span><strong>No Spam or Promo:</strong> Share relevant projects, meets, or notes only.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">3</span>
                  <span><strong>Campus Safety:</strong> Keep meetups in verified public campus spots.</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRulesCircle(null)}
                className="flex-1 py-2.5 rounded-full text-xs font-bold text-black/70 bg-black/5 hover:bg-black/10 transition-colors cursor-pointer"
              >
                Decline
              </button>
              <button
                onClick={confirmJoinCircle}
                className="flex-1 py-2.5 rounded-full text-xs font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-all shadow-[0_2px_10px_rgba(124,58,237,0.25)] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {rulesCircle.isPaid ? `Agree & Join (${rulesCircle.price} Sparks)` : 'Agree & Join'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
