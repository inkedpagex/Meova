'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search, Check, MapPin, Zap, Coffee, BookOpen, Activity, Music,
  Layers, Camera, Trophy, Users, Palette, Star,
  AlertTriangle, X
} from 'lucide-react';
import useSWR from 'swr';
import { useUserContext } from '../../components/providers/UserProvider';
import { getCartoonAvatar, getUserAvatarUrl } from '../../utils/avatar';
import confetti from 'canvas-confetti';
import { useCampusPresence } from '../../lib/useCampusPresence';
import Skeleton from '../../components/Skeleton';

const fetcher = (url) => fetch(url).then((res) => res.json());

const INTEREST_COLORS = {
  'Coding': '#F05A00', 'Tech': '#F05A00', 'AI': '#F05A00', 'AI/ML': '#F05A00',
  'Gaming': '#3b82f6', 'Music': '#ec4899', 'Art': '#f97316',
  'Startups': '#10b981', 'Design': '#06b6d4', 'Sports': '#f59e0b',
  'Travel': '#8b5cf6', 'Photography': '#ef4444', 'Dance': '#f43f5e',
  'default': '#F05A00',
};

const FILTERS = ['All', 'People', 'Communities', 'Tournaments'];

// ── Algolia Search Hook ───────────────────────────────────────────────────────
// Gracefully falls back to local data if Algolia is not configured
const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;

function useAlgoliaSearch(query) {
  const [peopleResults, setPeopleResults] = useState(null);
  const [experienceResults, setExperienceResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef(null);

  const search = useCallback(async (q) => {
    if (!q || q.length < 2 || !ALGOLIA_APP_ID || !ALGOLIA_SEARCH_KEY) {
      setPeopleResults(null);
      setExperienceResults(null);
      return;
    }

    setIsSearching(true);
    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        // Use Algolia's search API directly (no heavy SDK needed)
        const [usersRes, expRes] = await Promise.all([
          fetch(`https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/Meova_users/query`, {
            method: 'POST',
            headers: {
              'X-Algolia-Application-Id': ALGOLIA_APP_ID,
              'X-Algolia-API-Key': ALGOLIA_SEARCH_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: q, hitsPerPage: 12, attributesToRetrieve: ['objectID', 'full_name', 'year', 'branch', 'interests', 'photo_url', 'isLiveOnCampus', 'isIdOn'] }),
          }),
          fetch(`https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/Meova_experiences/query`, {
            method: 'POST',
            headers: {
              'X-Algolia-Application-Id': ALGOLIA_APP_ID,
              'X-Algolia-API-Key': ALGOLIA_SEARCH_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: q, hitsPerPage: 8, attributesToRetrieve: ['objectID', 'title', 'category', 'price', 'location', 'days', 'slots', 'hostId'] }),
          }),
        ]);

        if (usersRes.ok) {
          const ud = await usersRes.json();
          // Hide users who have Signal Live turned off (isIdOn = false)
          const validUsers = (ud.hits || []).filter(h => h.isIdOn !== false).map(h => ({ ...h, id: h.objectID }));
          setPeopleResults(validUsers);
        }
        if (expRes.ok) {
          const ed = await expRes.json();
          setExperienceResults((ed.hits || []).map(h => ({ ...h, id: h.objectID })));
        }
      } catch {
        // Algolia unavailable — fall back to local filtering
        setPeopleResults(null);
        setExperienceResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    search(query);
    return () => clearTimeout(debounceRef.current);
  }, [query, search]);

  return { peopleResults, experienceResults, isSearching };
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DiscoverClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const interestParam = searchParams ? searchParams.get('interest') || searchParams.get('category') : null;
  const { user: currentUser, people: contextPeople } = useUserContext();
  
  const [activeFilter, setActiveFilter] = useState(interestParam ? 'People' : 'All');
  const [search, setSearch] = useState(interestParam || '');
  const [connectedIds, setConnectedIds] = useState(new Set());
  const [joinedIds, setJoinedIds] = useState(new Set());

  useEffect(() => {
    if (interestParam) {
    // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearch(interestParam);
      setActiveFilter('People');
    }
  }, [interestParam]);
  
  const [people, setPeople] = useState(contextPeople || []);
  const [visiblePeopleLimit, setVisiblePeopleLimit] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef(null);

  // Reset pagination limit on search or filter change
  useEffect(() => {
    setVisiblePeopleLimit(12);
  }, [search, activeFilter]);

  // Infinite Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 300) {
        setVisiblePeopleLimit(prev => prev + 12);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // SWR Hooks for caching and instant data fetching
  const { data: circlesData } = useSWR('/api/circles', fetcher);
  const { data: usersData } = useSWR('/api/users', fetcher);
  const isPeopleLoading = usersData === undefined;
  
  const circles = circlesData?.circles || [];
  const isCirclesLoading = circlesData === undefined;
  // Algolia search
  const { peopleResults, experienceResults, isSearching } = useAlgoliaSearch(search);
  const isAlgoliaSearch = search.length >= 2 && !!ALGOLIA_APP_ID;

  // Campus presence hook — marks user as "Live on Campus" when nearby
  const { isOnCampus } = useCampusPresence(currentUser);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dbUsers = usersData?.users || contextPeople || [];
      const filteredUsers = currentUser 
        ? dbUsers.filter(u => u.id !== currentUser.uid && u.isIdOn !== false) 
        : dbUsers.filter(u => u.isIdOn !== false);

      setPeople(filteredUsers);

      const savedJoined = localStorage.getItem('Meova_disc_joined');
      if (savedJoined) {
        try {
          setJoinedIds(new Set(JSON.parse(savedJoined)));
        } catch {}
      }
    }
  }, [currentUser, contextPeople, usersData]);

  const handleConnect = (person) => {
    confetti({ particleCount: 40, spread: 40, origin: { y: 0.6 } });
    setConnectedIds(prev => new Set([...prev, person.id]));
    router.push(`/messages?user=${encodeURIComponent(person.full_name)}`);
  };

  const handleJoinCommunity = (c) => {
    confetti({ particleCount: 40, spread: 40, origin: { y: 0.6 } });
    setJoinedIds(prev => {
      const next = new Set([...prev, c.id]);
      if (typeof window !== 'undefined') {
        localStorage.setItem('Meova_disc_joined', JSON.stringify([...next]));
      }
      return next;
    });
    setTimeout(() => router.push(`/messages?user=${encodeURIComponent(c.name)}`), 500);
  };

  const getAvatar = (p) => getUserAvatarUrl(p) || getCartoonAvatar(p.full_name || p.id);

  const chip = (label) => (
    <button key={label} onClick={() => setActiveFilter(label)}
      className="flex-shrink-0 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide cursor-pointer transition-all active:scale-95"
      style={activeFilter === label
        ? { background: 'linear-gradient(to right, #F05A00, #F05A00)', color: '#ffffff', border: '1px solid transparent' }
        : { background: '#f0f0f3', color: '#71717a', border: '1px solid #e4e4e7' }}>
      {label}
    </button>
  );

  /* ─── People Section ─── */
  const renderPeopleSection = () => {
    // Use Algolia results if searching, else local data
    const rawList = isAlgoliaSearch && peopleResults !== null ? peopleResults : people;
    
    // Sort: isLiveOnCampus first, then rest
    const sorted = [...rawList].sort((a, b) => {
      const aLive = a.isLiveOnCampus ? 1 : 0;
      const bLive = b.isLiveOnCampus ? 1 : 0;
      return bLive - aLive;
    });

    const fullList = sorted.filter(p => {
      if (!search || search.length < 2 || isAlgoliaSearch) return true;
      const q = search.toLowerCase();
      const nameMatch = p.full_name?.toLowerCase().includes(q);
      const branchMatch = p.branch?.toLowerCase().includes(q);
      const interestMatch = (p.interests || []).some(i => i.toLowerCase().includes(q) || q.includes(i.toLowerCase()));
      return nameMatch || branchMatch || interestMatch;
    });

    const list = fullList.slice(0, visiblePeopleLimit);
    const hasMore = fullList.length > visiblePeopleLimit;
    const liveCount = fullList.filter(p => p.isLiveOnCampus).length;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-black" style={{ color: '#09090b' }}>
            People nearby
          </h2>
          <div className="flex items-center gap-2">
            {liveCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {liveCount} Live on Campus
              </span>
            )}
            <span className="text-[11px] font-bold" style={{ color: '#F05A00' }}>{fullList.length} online</span>
          </div>
        </div>

        {isSearching && (
          <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-medium px-1">
            <div className="w-3 h-3 border-2 border-[#F05A00] border-t-transparent rounded-full animate-spin" />
            Searching...
          </div>
        )}

        {isPeopleLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden border border-zinc-100 flex flex-col relative">
                <Skeleton variant="rectangular" className="w-full h-[180px]" />
                <div className="p-3">
                  <Skeleton variant="text" className="w-24 h-4 mb-1" />
                  <Skeleton variant="text" className="w-16 h-3 mb-3" />
                  <Skeleton variant="rectangular" className="w-full h-9 rounded-2xl" />
                </div>
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-3xl p-10 text-center font-bold text-zinc-400 bg-white border border-zinc-100 flex flex-col items-center gap-2">
            <span>No classmates found matching your query.</span>
            {search && (
              <button onClick={() => setSearch('')} className="px-4 py-2 mt-2 bg-zinc-100 text-zinc-900 text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-zinc-200 transition-colors cursor-pointer">
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {list.map(person => (
                <div key={person.id}
                  onClick={() => router.push(`/users/${person.id}`)}
                  className="rounded-3xl p-4 flex flex-col items-center text-center cursor-pointer transition-all hover:border-orange-300 hover:shadow-md group"
                  style={{ background: '#ffffff', border: person.isLiveOnCampus ? '1.5px solid #bbf7d0' : '1px solid #f0f0f0', boxShadow: person.isLiveOnCampus ? '0 0 0 3px rgba(16,185,129,0.06)' : '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <div className="relative mb-3">
                    <div className="w-16 h-16 rounded-full overflow-hidden group-hover:scale-105 transition-transform"
                      style={{ border: person.isLiveOnCampus ? '3px solid #6ee7b7' : '3px solid #e0f2fe' }}>
                      <img
                        src={getAvatar(person)}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getCartoonAvatar(person.full_name || person.id || 'user');
                        }}
                      />
                    </div>
                    {/* Live on Campus indicator */}
                    {person.isLiveOnCampus ? (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Live Near You
                      </span>
                    ) : (
                      person.online !== false && <span className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 w-full flex flex-col items-center" style={{ marginTop: person.isLiveOnCampus ? 8 : 0 }}>
                    <span className="text-[13px] font-black truncate max-w-full group-hover:text-[#F05A00] transition-colors" style={{ color: '#09090b' }}>{person.full_name}</span>
                    <span className="text-[10px] font-semibold mt-0.5" style={{ color: '#a1a1aa' }}>
                      {person.year ? `${person.year} Yr` : ''} {person.branch ? `· ${person.branch}` : ''}
                    </span>
                    <div className="flex flex-wrap gap-1 mt-2 justify-center" style={{ minHeight: 24 }}>
                      {(person.interests || []).slice(0, 2).map((tag, idx) => (
                        <span key={`${tag}-${idx}`} className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase"
                          style={{ background: `${INTEREST_COLORS[tag] || INTEREST_COLORS.default}18`, color: INTEREST_COLORS[tag] || INTEREST_COLORS.default }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button onClick={(e) => {
                    e.stopPropagation();
                    connectedIds.has(person.id) ? router.push(`/messages?user=${encodeURIComponent(person.full_name)}`) : handleConnect(person);
                  }}
                    className="mt-3 w-full py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wide cursor-pointer transition-all active:scale-95"
                    style={connectedIds.has(person.id)
                      ? { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }
                      : { background: 'linear-gradient(to right, #F05A00, #F05A00)', color: '#ffffff' }}>
                    {connectedIds.has(person.id) ? 'Message' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>

            {/* Automatic Infinite Scroll Indicator */}
            {hasMore && (
              <div className="flex items-center justify-center py-6">
                <div className="flex items-center gap-2 text-xs font-bold text-[#F05A00] bg-orange-50 px-4 py-2 rounded-full border border-orange-100 shadow-xs">
                  <div className="w-3.5 h-3.5 border-2 border-[#F05A00] border-t-transparent rounded-full animate-spin" />
                  <span>Loading more classmates...</span>
                </div>
              </div>
            )}
          </>
        )}
        {/* Algolia attribution */}
        {isAlgoliaSearch && ALGOLIA_APP_ID && (
          <p className="text-center text-[9px] text-zinc-300 font-medium mt-1">Search powered by Algolia</p>
        )}
      </div>
    );
  };

  /* ─── Communities ─── */
  const renderCommunitiesSection = () => {
    const list = circles.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.category || '').toLowerCase().includes(search.toLowerCase()));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-black text-zinc-950">Communities</h2>
          <span className="text-[11px] font-bold text-[#F05A00]">{list.length} groups</span>
        </div>

        {isCirclesLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-4 rounded-3xl flex flex-col items-center bg-white border border-zinc-100">
                <Skeleton variant="rectangular" className="w-14 h-14 rounded-2xl mb-3" />
                <Skeleton variant="text" className="w-20 h-4 mb-1" />
                <Skeleton variant="text" className="w-16 h-3 mb-3" />
                <Skeleton variant="rectangular" className="w-full h-8 rounded-xl" />
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-3xl p-10 text-center font-bold text-zinc-400 bg-white border border-zinc-100 flex flex-col items-center gap-2">
            <Users size={24} className="text-[#F05A00]" />
            <span>No communities created yet.</span>
            <button onClick={() => router.push('/circles')} className="mt-2 px-4 py-2 bg-gradient-to-r from-[#F05A00] to-[#F05A00] text-white text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer active:scale-95 transition-all">
              Browse Communities
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {list.map(c => {
              const isJoined = joinedIds.has(c.id);
              return (
                <div key={c.id}
                  className="p-4 rounded-3xl flex flex-col items-center text-center cursor-pointer transition-all hover:shadow-sm active:scale-[0.98] bg-white border border-zinc-100"
                  onClick={() => isJoined ? router.push('/circles') : handleJoinCommunity(c)}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 bg-orange-50 border border-orange-100 text-[#F05A00]">
                    <Users size={24} strokeWidth={2} />
                  </div>
                  <span className="text-[12px] font-black text-zinc-950">{c.name}</span>
                  <span className="text-[9px] font-semibold text-zinc-400 mt-0.5">{(c.member_count || 0).toLocaleString()} members</span>
                  <div className="mt-2">
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Free</span>
                  </div>
                  <button className={`mt-3 w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-wide cursor-pointer transition-all active:scale-95 ${
                    isJoined ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-gradient-to-r from-[#F05A00] to-[#F05A00] text-white'
                  }`}>
                    {isJoined ? 'Open' : 'Join'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  /* ─── Tournaments ─── */
  const renderTournamentsSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-black text-zinc-950">Live Tournaments</h2>
        <span className="text-[11px] font-bold text-[#F05A00]">0 events</span>
      </div>
      <div className="rounded-3xl p-12 text-center font-bold text-zinc-400 bg-white border border-zinc-100 flex flex-col items-center gap-2">
        <Trophy size={28} className="text-[#F05A00]" />
        <span>No campus tournaments scheduled yet.</span>
      </div>
    </div>
  );

  const showPeople = activeFilter === 'All' || activeFilter === 'People';
  const showComm = activeFilter === 'All' || activeFilter === 'Communities';
  const showTourn = activeFilter === 'All' || activeFilter === 'Tournaments';

  return (
    <div className="space-y-5 pt-[68px] md:pt-4 px-4 max-w-[640px] mx-auto pb-24">
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search people, circles, gigs..."
          className="w-full pl-11 pr-10 py-3.5 rounded-2xl text-[13px] font-medium outline-none transition-all bg-zinc-100 border border-zinc-200 text-zinc-900 focus:border-[#F05A00]" />
        {search && (
          <button 
            type="button" 
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-zinc-600 cursor-pointer"
            title="Clear search"
          >
            <X size={15} />
          </button>
        )}
        {isSearching && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[#F05A00] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Campus presence banner */}
      {isOnCampus && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-2xl px-3 py-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <p className="text-[11px] font-bold text-emerald-700">You&apos;re Live on Campus! Others can see you nearby.</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map(f => chip(f))}
      </div>

      {/* Sections */}
      {showPeople && renderPeopleSection()}
      {showComm && renderCommunitiesSection()}
      {showTourn && renderTournamentsSection()}
    </div>
  );
}
