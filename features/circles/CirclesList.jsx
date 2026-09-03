'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search, SlidersHorizontal, Check, Zap, Users, Rocket,
  Gamepad2, Music2, Code2, Palette, Trophy, Star, MessageSquare, Share2, LogOut
} from '@/lib/icons';
import { getCartoonAvatar } from '../../utils/avatar';
import { toast } from 'react-hot-toast';
import CreateCircleModal from './CreateCircleModal';
import HostCircleDashboardModal from './HostCircleDashboardModal';

const CATEGORY_ICONS = {
  Tech: Code2, Gaming: Gamepad2, Music: Music2, Design: Palette,
  Startup: Rocket, Sports: Trophy, Creators: Star, Entertainment: Star, General: Users,
};

const CATEGORY_COLORS = {
  Tech: { bg: '#eff6ff', color: '#3b82f6', border: '#bfdbfe' },
  Gaming: { bg: '#f0f9ff', color: '#0ea5e9', border: '#bae6fd' },
  Music: { bg: '#F3EEFC', color: '#6D28D9', border: '#E4D9F7' },
  Design: { bg: '#F3EEFC', color: '#6D28D9', border: '#E4D9F7' },
  Startup: { bg: '#F3EEFC', color: '#6D28D9', border: '#E4D9F7' },
  Sports: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  Creators: { bg: '#fff1f2', color: '#e11d48', border: '#fecdd3' },
  Entertainment: { bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
  default: { bg: '#F3EEFC', color: '#6D28D9', border: '#E4D9F7' },
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

const FILTERS = ['All', 'Joined', 'My Channels', 'Tech', 'Gaming', 'Music', 'Design', 'Startup', 'Creators'];

export default function CirclesList({ circles = [], joinedCircleIds = new Set(), userId = null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    const circleIdParam = searchParams?.get('id');
    if (circleIdParam) {
      const found = (circles || []).find(c => c.id === circleIdParam) || MOCK_COMMUNITIES.find(c => c.id === circleIdParam);
      if (found) {
        setRulesCircle(found);
      }
    }
  }, [searchParams, circles]);

  useEffect(() => {
    let cancelled = false;
    const initial = {};
    if (joinedCircleIds) joinedCircleIds.forEach(id => { initial[id] = true; });
    const ls = typeof window !== 'undefined' ? localStorage.getItem('Meova_joined_circles') : null;
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
    member_count: c.member_count || c.members_count || 1, 
    desc: c.desc || c.description || '',
    isPaid: c.isPaid || c.is_paid || false, 
    price: c.price || 0,
    host_id: c.creator_id || c.host_id,
    host_name: c.host_name,
    host_photo: c.host_photo,
    whatsapp_link: c.invite_link || c.whatsapp_link || 'https://chat.whatsapp.com/',
  }));
  const allCircles = [...MOCK_COMMUNITIES];
  dbMapped.forEach(c => { if (!allCircles.some(a => a.id === c.id)) allCircles.push(c); });

  const featured = allCircles.find(c => c.featured);
  const normalCircles = allCircles.filter(c => !c.featured);

  const displayed = normalCircles.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase());
    
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

  // Helper to get avatar mock stack
  const getAvatarStack = (circleId) => [
    getCartoonAvatar(`${circleId}_1`),
    getCartoonAvatar(`${circleId}_2`),
    getCartoonAvatar(`${circleId}_3`),
  ];

  return (
    <div className="space-y-5 pb-24 pt-2">

      {/* Host a Community CTA Banner (Neo-Minimalist Flat Surface) */}
      <div className="bg-white rounded-[16px] p-5 text-[#1C1917] shadow-[0_2px_8px_rgba(28,25,23,0.06)] border border-[#E7E5E4] flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#F3EEFC] text-[#6D28D9] border border-[#E4D9F7]">
              Host Monetization
            </span>
            <span className="text-[10px] font-bold text-[#78716C] flex items-center gap-1">
              <Zap size={12} className="fill-[#6D28D9] text-[#6D28D9]" /> 100% Sparks Earnings
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold tracking-tight text-[#1C1917]">Create Your Campus Channel</h3>
          <p className="text-[12px] text-[#78716C] font-medium">Monetize your WhatsApp, Telegram or Insta community.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 rounded-full bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-bold text-xs transition-all shadow-[0_2px_8px_rgba(28,25,23,0.06)] active:scale-95 flex-shrink-0 cursor-pointer"
        >
          + Host Channel
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8A29E] pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search communities..."
          className="w-full pl-11 pr-12 py-3.5 rounded-full text-[13px] font-medium outline-none transition-all bg-white border border-[#E7E5E4] text-[#1C1917] focus:border-[#6D28D9]"
        />
        <button className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center bg-white border border-[#E7E5E4] text-[#78716C] hover:text-[#6D28D9] hover:border-[#6D28D9] transition-colors">
          <SlidersHorizontal size={14} />
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className="flex-shrink-0 px-4 py-2 rounded-full text-[12px] font-bold uppercase tracking-wide cursor-pointer transition-all active:scale-95 shadow-[0_2px_8px_rgba(28,25,23,0.06)]"
            style={activeFilter === f
              ? { background: '#6D28D9', color: '#ffffff', border: '1px solid #6D28D9' }
              : { background: '#ffffff', color: '#1C1917', border: '1px solid #E7E5E4' }}>
            {f}
          </button>
        ))}
      </div>

      {/* Featured community banner */}
      {featured && !search && activeFilter === 'All' && (
        <div className="relative rounded-[16px] p-5 overflow-hidden shadow-[0_2px_8px_rgba(28,25,23,0.06)]"
          style={{ background: '#6D28D9' }}>
          <div className="absolute top-0 right-0 w-36 h-36 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2 bg-white" />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[16px] bg-white/20 flex items-center justify-center">
                  <Rocket size={22} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-bold text-white">{featured.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-400 text-emerald-950">Verified</span>
                  </div>
                  <p className="text-[12px] text-white/80 mt-0.5 font-medium max-w-[200px] leading-snug">{featured.desc}</p>
                </div>
              </div>
              <button onClick={() => handleJoinClick(featured)}
                disabled={joiningId === featured.id}
                className="px-4 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wide cursor-pointer active:scale-95 transition-all flex-shrink-0 shadow-[0_2px_8px_rgba(28,25,23,0.06)]"
                style={joinedMap[featured.id]
                  ? { background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }
                  : { background: 'white', color: '#6D28D9' }}>
                {joiningId === featured.id ? 'Joining...' : (joinedMap[featured.id] ? 'Open' : 'Join')}
              </button>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/90">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {featured.online} online
              </div>
              {featured.nextMeetup && (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/90">
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
        {displayed.length === 0 ? (
          <div className="bg-white rounded-[16px] border border-[#E7E5E4] p-8 text-center space-y-3.5 shadow-[0_2px_8px_rgba(28,25,23,0.06)]">
            <div className="w-14 h-14 rounded-full bg-[#F3EEFC] border border-[#E4D9F7] text-[#6D28D9] flex items-center justify-center mx-auto shadow-[0_2px_8px_rgba(28,25,23,0.06)]">
              <Users size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#1C1917]">No Communities Found</h3>
              <p className="text-xs text-[#78716C] font-medium max-w-xs mx-auto leading-relaxed">
                {search || selectedCategory !== 'All' 
                  ? 'No circles match your current search or filter. Try a different term!' 
                  : 'Be the first student to create a campus circle or community!'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              {search || selectedCategory !== 'All' ? (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setSelectedCategory('All'); }}
                  className="px-5 py-2.5 rounded-full bg-[#FAFAF8] hover:bg-[#E7E5E4] text-[#1C1917] text-xs font-bold active:scale-95 transition-all cursor-pointer border border-[#E7E5E4]"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="px-5 py-2.5 rounded-full bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-bold shadow-[0_2px_8px_rgba(28,25,23,0.06)] active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1.5"
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
          const isHost = circle.host_id && circle.host_id === userId;
          const CategoryIcon = CATEGORY_ICONS[circle.category] || CATEGORY_ICONS.default;
          const categoryStyle = CATEGORY_COLORS[circle.category] || CATEGORY_COLORS.default;

          return (
            <div
              key={circle.id}
              onClick={() => handleJoinClick(circle)}
              className="bg-white border border-[#E7E5E4] hover:border-[#6D28D9] rounded-[16px] p-4 flex items-center justify-between gap-3 transition-all cursor-pointer group shadow-[0_2px_8px_rgba(28,25,23,0.06)]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Category Icon */}
                <div className="w-12 h-12 rounded-[16px] flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                  style={{ background: categoryStyle.bg, border: `1px solid ${categoryStyle.border}` }}>
                  <CategoryIcon size={20} style={{ color: categoryStyle.color }} />
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[14px] font-bold text-[#1C1917] truncate">{circle.name}</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0"
                      style={{ background: categoryStyle.bg, color: categoryStyle.color, border: `1px solid ${categoryStyle.border}` }}>
                      {circle.category}
                    </span>
                  </div>

                  <p className="text-[12px] text-[#78716C] font-normal truncate">{circle.desc || 'Campus Community'}</p>

                  <div className="flex items-center gap-1.5 pt-0.5 pb-0.5">
                    {circle.host_name ? (
                      <div className="flex items-center gap-1.5">
                        {circle.host_photo ? (
                          <img src={circle.host_photo} alt={circle.host_name} className="w-4 h-4 rounded-full object-cover border border-[#E7E5E4]" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-purple-100" />
                        )}
                        <span className="text-[11px] font-medium text-[#78716C]">by {circle.host_name.split(' ')[0]}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-[#6D28D9] uppercase tracking-wide bg-[#F3EEFC] px-1.5 py-0.5 rounded-md border border-[#E4D9F7]">
                          by Meova
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="flex items-center gap-1 text-[11px] font-medium text-[#78716C]">
                      <Users size={12} className="text-[#A8A29E]" />
                      <span>{circle.member_count} members</span>
                    </div>

                    {circle.isPaid ? (
                      <span className="text-[10px] font-bold text-[#6D28D9] px-2 py-0.5 rounded-full bg-[#F3EEFC] border border-[#E4D9F7] flex items-center gap-0.5">
                        <Zap size={10} className="fill-[#6D28D9] text-[#6D28D9]" />
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
                    const circleUrl = `${window.location.origin}/circles?id=${circle.id}`;
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
                  className="p-2 rounded-xl text-[#78716C] hover:text-black hover:bg-[#F3EEFC] transition-colors cursor-pointer"
                  title="Share Community"
                >
                  <Share2 size={15} />
                </button>

                {isHost ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); setManageCircle(circle); }}
                    className="px-3 py-2 rounded-xl text-[10.5px] font-bold uppercase tracking-wider bg-[#F3EEFC] text-[#6D28D9] border border-[#E4D9F7] hover:bg-[#F3EEFC] transition-colors cursor-pointer"
                  >
                    Manage
                  </button>
                ) : isJoined ? (
                  <button
                    onClick={(e) => handleLeaveCircle(circle, e)}
                    className="p-2 rounded-xl text-[#A8A29E] hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                    title="Leave Community"
                  >
                    <LogOut size={14} />
                  </button>
                ) : null}

                <button
                  onClick={(e) => { e.stopPropagation(); handleJoinClick(circle); }}
                  disabled={joiningId === circle.id}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide cursor-pointer transition-all active:scale-95 flex-shrink-0 flex items-center gap-1.5 shadow-[0_2px_8px_rgba(28,25,23,0.06)] ${
                    isJoined
                      ? 'bg-black text-white hover:bg-black/90'
                      : 'bg-[#6D28D9] text-white hover:bg-[#5B21B6]'
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
            className="w-full max-w-sm bg-white rounded-[16px] p-6 space-y-4 animate-in fade-in zoom-in duration-200 shadow-2xl border border-[#E7E5E4]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-[#E7E5E4] pb-3">
              <div className="w-10 h-10 rounded-[16px] bg-[#F3EEFC] flex items-center justify-center flex-shrink-0 border border-[#E4D9F7]">
                <Users size={18} className="text-[#6D28D9]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-[#1C1917] truncate">{rulesCircle.name}</h3>
                <p className="text-[10px] font-bold text-[#6D28D9] uppercase tracking-wider">{rulesCircle.category} Community</p>
              </div>
            </div>

            <div className="space-y-3 py-1 text-left">
              <h4 className="text-xs font-bold text-[#1C1917] uppercase tracking-wider">Community Guidelines & Rules:</h4>
              <ul className="space-y-2 text-xs font-medium text-[#78716C]">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#F3EEFC] text-[#6D28D9] border border-[#E4D9F7] flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">1</span>
                  <span><strong>Respect & Kindness:</strong> Maintain constructive, friendly discussions with campus peers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#F3EEFC] text-[#6D28D9] border border-[#E4D9F7] flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">2</span>
                  <span><strong>No Spam or Promo:</strong> Share relevant projects, meets, or notes only.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#F3EEFC] text-[#6D28D9] border border-[#E4D9F7] flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">3</span>
                  <span><strong>Campus Safety:</strong> Keep meetups in verified public campus spots.</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRulesCircle(null)}
                className="flex-1 py-3 rounded-[16px] text-xs font-bold text-[#78716C] bg-[#F3EEFC] hover:bg-[#E7E5E4] transition-colors"
              >
                Decline
              </button>
              <button
                onClick={confirmJoinCircle}
                className="flex-1 py-3 rounded-[16px] text-xs font-bold text-white bg-[#6D28D9] hover:bg-[#5B21B6] transition-all shadow-[0_2px_8px_rgba(28,25,23,0.06)] flex items-center justify-center gap-1.5"
              >
                {rulesCircle.isPaid ? `Agree & Join (${rulesCircle.price} Sparks)` : 'Agree & Join Group'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
