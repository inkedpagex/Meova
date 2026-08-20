'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search, Check, MapPin, Zap, Coffee, BookOpen, Activity, Music,
  Layers, Camera, Trophy, Users, Palette, Star,
  AlertTriangle
} from 'lucide-react';
import useSWR from 'swr';
import { useUserContext } from '../../components/providers/UserProvider';
import { getCartoonAvatar, getUserAvatarUrl } from '../../utils/avatar';
import confetti from 'canvas-confetti';
import { useCampusPresence } from '../../lib/useCampusPresence';

const fetcher = (url) => fetch(url).then((res) => res.json());

const INTEREST_COLORS = {
  'Coding': '#7c3aed', 'Tech': '#7c3aed', 'AI': '#7c3aed', 'AI/ML': '#7c3aed',
  'Gaming': '#3b82f6', 'Music': '#ec4899', 'Art': '#f97316',
  'Startups': '#10b981', 'Design': '#06b6d4', 'Sports': '#f59e0b',
  'Travel': '#8b5cf6', 'Photography': '#ef4444', 'Dance': '#f43f5e',
  'default': '#6366f1',
};

const FILTERS = ['All', 'People', 'Experiences', 'Communities', 'Tournaments'];

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
          fetch(`https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/meetify_users/query`, {
            method: 'POST',
            headers: {
              'X-Algolia-Application-Id': ALGOLIA_APP_ID,
              'X-Algolia-API-Key': ALGOLIA_SEARCH_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: q, hitsPerPage: 12, attributesToRetrieve: ['objectID', 'full_name', 'year', 'branch', 'interests', 'photo_url', 'isLiveOnCampus'] }),
          }),
          fetch(`https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/meetify_experiences/query`, {
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
          setPeopleResults((ud.hits || []).map(h => ({ ...h, id: h.objectID })));
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
  
  // SWR Hooks for caching and instant data fetching
  const { data: expData } = useSWR('/api/experiences', fetcher);
  const { data: circlesData } = useSWR('/api/circles', fetcher);
  const { data: usersData } = useSWR('/api/users', fetcher);
  
  const experiences = expData?.experiences || [];
  const circles = circlesData?.circles || [];

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

    // eslint-disable-next-line react-hooks/set-state-in-effect
      setPeople(filteredUsers);

      const savedJoined = localStorage.getItem('meetify_disc_joined');
      if (savedJoined) {
        try {
          setJoinedIds(new Set(JSON.parse(savedJoined)));
        } catch {}
      }
    }
  }, [currentUser, contextPeople]);

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
        localStorage.setItem('meetify_disc_joined', JSON.stringify([...next]));
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
        ? { background: '#7c3aed', color: '#ffffff', border: '1px solid transparent' }
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

    const list = sorted
      .filter(p => {
        if (!search || search.length < 2 || isAlgoliaSearch) return true;
        const q = search.toLowerCase();
        const nameMatch = p.full_name?.toLowerCase().includes(q);
        const branchMatch = p.branch?.toLowerCase().includes(q);
        const interestMatch = (p.interests || []).some(i => i.toLowerCase().includes(q) || q.includes(i.toLowerCase()));
        return nameMatch || branchMatch || interestMatch;
      })
      .slice(0, 12);

    const liveCount = list.filter(p => p.isLiveOnCampus).length;

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
            <span className="text-[11px] font-bold" style={{ color: '#7c3aed' }}>{list.length} online</span>
          </div>
        </div>

        {isSearching && (
          <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-medium px-1">
            <div className="w-3 h-3 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
            Searching...
          </div>
        )}

        {list.length === 0 ? (
          <div className="rounded-3xl p-10 text-center font-bold text-zinc-400 bg-white border border-[#f0f0f0] flex flex-col items-center gap-2">
            <span>No classmates found matching your query.</span>
            {search && (
              <button onClick={() => setSearch('')} className="px-4 py-2 mt-2 bg-zinc-100 text-zinc-900 text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-zinc-200 transition-colors cursor-pointer">
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {list.map(person => (
              <div key={person.id}
                onClick={() => router.push(`/users/${person.id}`)}
                className="rounded-3xl p-4 flex flex-col items-center text-center cursor-pointer transition-all hover:border-purple-300 hover:shadow-md group"
                style={{ background: '#ffffff', border: person.isLiveOnCampus ? '1.5px solid #bbf7d0' : '1px solid #f0f0f0', boxShadow: person.isLiveOnCampus ? '0 0 0 3px rgba(16,185,129,0.06)' : '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div className="relative mb-3">
                  <div className="w-16 h-16 rounded-full overflow-hidden group-hover:scale-105 transition-transform"
                    style={{ border: person.isLiveOnCampus ? '3px solid #6ee7b7' : '3px solid #ede9fe' }}>
                    <img src={getAvatar(person)} alt={person.full_name} className="w-full h-full object-cover" />
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
                  <span className="text-[13px] font-black truncate max-w-full group-hover:text-purple-600 transition-colors" style={{ color: '#09090b' }}>{person.full_name}</span>
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
                    : { background: '#7c3aed', color: '#ffffff' }}>
                  {connectedIds.has(person.id) ? 'Message' : 'Connect'}
                </button>
              </div>
            ))}
          </div>
        )}
        {/* Algolia attribution */}
        {isAlgoliaSearch && ALGOLIA_APP_ID && (
          <p className="text-center text-[9px] text-zinc-300 font-medium mt-1">Search powered by Algolia</p>
        )}
      </div>
    );
  };

  /* ─── Experiences ─── */
  const renderExperiencesSection = () => {
    const list = isAlgoliaSearch && experienceResults !== null
      ? experienceResults
      : experiences.filter(e => !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase()));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-black" style={{ color: '#09090b' }}>Experiences for you</h2>
          <span className="text-[11px] font-bold" style={{ color: '#7c3aed' }}>{list.length} available</span>
        </div>

        {list.length === 0 ? (
          <div className="rounded-3xl p-10 text-center font-bold text-zinc-400 bg-white border border-[#f0f0f0] flex flex-col items-center gap-2">
            <Coffee size={24} className="text-[#7c3aed]" />
            <span>No campus experiences found.</span>
            {search ? (
              <button onClick={() => setSearch('')} className="mt-2 px-4 py-2 bg-zinc-100 text-zinc-900 text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-zinc-200 transition-colors cursor-pointer">
                Clear Search
              </button>
            ) : (
              <button onClick={() => router.push('/create/experience')} className="mt-2 px-4 py-2 bg-[#7c3aed] text-white text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer">
                Host first experience
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {list.map(exp => {
              const cat = (exp.category || '').toLowerCase();
              let ExpIcon = Coffee;
              if (cat.includes('study') || cat.includes('learn') || cat.includes('together')) ExpIcon = BookOpen;
              else if (cat.includes('sport') || cat.includes('match') || cat.includes('fitness') || cat.includes('badminton')) ExpIcon = Activity;
              else if (cat.includes('music') || cat.includes('jam')) ExpIcon = Music;
              else if (cat.includes('design') || cat.includes('figma') || cat.includes('art')) ExpIcon = Layers;
              else if (cat.includes('camera') || cat.includes('photo')) ExpIcon = Camera;

              return (
                <div key={exp.id}
                  className="p-4 rounded-3xl flex items-center gap-4 cursor-pointer transition-all hover:shadow-sm active:scale-[0.99]"
                  style={{ background: '#ffffff', border: '1px solid #f0f0f0' }}
                  onClick={() => router.push(`/experiences/${exp.id}`)}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                    <ExpIcon size={20} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-black truncate" style={{ color: '#09090b' }}>{exp.title}</h3>
                    <p className="text-[10px] font-semibold mt-0.5 uppercase tracking-wide" style={{ color: '#71717a' }}>
                      {exp.days ? exp.days[0] : 'Today'} · {exp.slots ? exp.slots[0] : '5:00 PM'}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={9} style={{ color: '#a1a1aa' }} />
                      <span className="text-[10px] text-zinc-400">{exp.location}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="flex items-center gap-1 text-[11px] font-black" style={{ color: '#7c3aed' }}>
                      {exp.price > 0 ? <><span>{exp.price}</span><Zap size={9} className="fill-current" /></> : <span className="text-emerald-600">Free</span>}
                    </span>
                    <button className="text-[10px] font-black uppercase px-3 py-1.5 rounded-xl transition-all active:scale-95"
                      style={{ background: '#7c3aed', color: '#ffffff' }}>
                      Book
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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
          <h2 className="text-[15px] font-black" style={{ color: '#09090b' }}>Communities</h2>
          <span className="text-[11px] font-bold" style={{ color: '#7c3aed' }}>{list.length} groups</span>
        </div>

        {list.length === 0 ? (
          <div className="rounded-3xl p-10 text-center font-bold text-zinc-400 bg-white border border-[#f0f0f0] flex flex-col items-center gap-2">
            <Users size={24} className="text-[#7c3aed]" />
            <span>No communities created yet.</span>
            <button onClick={() => router.push('/circles')} className="mt-2 px-4 py-2 bg-[#7c3aed] text-white text-[10px] font-black uppercase tracking-wider rounded-xl">
              Browse Communities
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {list.map(c => {
              const isJoined = joinedIds.has(c.id);
              return (
                <div key={c.id}
                  className="p-4 rounded-3xl flex flex-col items-center text-center cursor-pointer transition-all hover:shadow-sm active:scale-[0.98]"
                  style={{ background: '#ffffff', border: '1px solid #f0f0f0' }}
                  onClick={() => isJoined ? router.push('/circles') : handleJoinCommunity(c)}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                    style={{ background: '#f5f3ff', border: `1px solid #ddd6fe`, color: '#7c3aed' }}>
                    <Users size={24} strokeWidth={2} />
                  </div>
                  <span className="text-[12px] font-black" style={{ color: '#09090b' }}>{c.name}</span>
                  <span className="text-[9px] font-semibold mt-0.5" style={{ color: '#a1a1aa' }}>{(c.member_count || 0).toLocaleString()} members</span>
                  <div className="mt-2">
                    <span className="text-[9px] font-black text-emerald-600 px-2 py-0.5 rounded-full" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>Free</span>
                  </div>
                  <button className="mt-3 w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-wide cursor-pointer transition-all active:scale-95"
                    style={isJoined ? { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' } : { background: '#7c3aed', color: '#ffffff' }}>
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
        <h2 className="text-[15px] font-black" style={{ color: '#09090b' }}>Live Tournaments</h2>
        <span className="text-[11px] font-bold" style={{ color: '#7c3aed' }}>0 events</span>
      </div>
      <div className="rounded-3xl p-12 text-center font-bold text-zinc-400 bg-white border border-[#f0f0f0] flex flex-col items-center gap-2">
        <Trophy size={28} className="text-[#7c3aed]" />
        <span>No campus tournaments scheduled yet.</span>
      </div>
    </div>
  );

  const showPeople = activeFilter === 'All' || activeFilter === 'People';
  const showExp = activeFilter === 'All' || activeFilter === 'Experiences';
  const showComm = activeFilter === 'All' || activeFilter === 'Communities';
  const showTourn = activeFilter === 'All' || activeFilter === 'Tournaments';

  return (
    <div className="space-y-5 pb-24 pt-2">
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#a1a1aa' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search people, experiences, communities..."
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-[13px] font-medium outline-none transition-all"
          style={{ background: '#f0f0f3', border: '1px solid #e4e4e7', color: '#09090b' }} />
        {isSearching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
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
      {showExp && renderExperiencesSection()}
      {showComm && renderCommunitiesSection()}
      {showTourn && renderTournamentsSection()}
    </div>
  );
}
