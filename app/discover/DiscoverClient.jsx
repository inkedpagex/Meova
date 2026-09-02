'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search, Check, MapPin, Zap, Coffee, BookOpen, Activity,
  Star, AlertTriangle, X, MessageSquare, Calendar
} from 'lucide-react';
import useSWR from 'swr';
import { useUserContext } from '../../components/providers/UserProvider';
import { getCartoonAvatar, getUserAvatarUrl } from '../../utils/avatar';
import { useCampusPresence } from '../../lib/useCampusPresence';
import Skeleton from '../../components/Skeleton';
import BookCoffeeButton from '../../features/users/BookCoffeeButton';

const fetcher = (url) => fetch(url).then((res) => res.json());

const INTEREST_COLORS = {
  'Coding': '#F05A00', 'Tech': '#F05A00', 'AI': '#F05A00', 'AI/ML': '#F05A00',
  'Gaming': '#3b82f6', 'Music': '#ec4899', 'Art': '#f97316',
  'Startups': '#10b981', 'Design': '#06b6d4', 'Sports': '#f59e0b',
  'Travel': '#8b5cf6', 'Photography': '#ef4444', 'Dance': '#f43f5e',
  'default': '#F05A00',
};

const FILTERS = ['All', 'Live on Campus', 'Engineering', 'Management', 'Design', 'AI & Tech'];

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
  
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState(interestParam || '');
  const [connectedIds, setConnectedIds] = useState(new Set());

  useEffect(() => {
    if (interestParam) {
    // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearch(interestParam);
      setActiveFilter('All');
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
  
  // SWR Hook for instant users data fetching
  const { data: usersData } = useSWR('/api/users', fetcher);
  const isPeopleLoading = usersData === undefined;
  
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
    }
  }, [currentUser, contextPeople, usersData]);

  const handleConnect = async (person) => {
    setConnectedIds(prev => new Set([...prev, person.id]));
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherUserId: person.id }),
      });
      const data = await res.json();
      if (data?.chatId) {
        router.push(`/messages?chatId=${data.chatId}`);
        return;
      }
    } catch {}
    router.push(`/messages?uid=${person.id}`);
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
      if (activeFilter === 'Live on Campus' && !p.isLiveOnCampus) return false;
      if (activeFilter !== 'All' && activeFilter !== 'Live on Campus') {
        const branch = (p.branch || '').toLowerCase();
        const dept = (p.department || '').toLowerCase();
        const bio = (p.bio || '').toLowerCase();
        const filter = activeFilter.toLowerCase();
        const match = branch.includes(filter) || dept.includes(filter) || bio.includes(filter) || (p.interests || []).some(i => i.toLowerCase().includes(filter));
        if (!match) return false;
      }
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
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-zinc-100 flex flex-col relative">
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
          <div className="rounded-2xl p-10 text-center font-bold text-zinc-400 bg-white border border-zinc-100 flex flex-col items-center gap-2">
            <span>No classmates found matching your query.</span>
            {search && (
              <button onClick={() => setSearch('')} className="px-4 py-2 mt-2 bg-zinc-100 text-zinc-900 text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-zinc-200 transition-colors cursor-pointer">
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {list.map(person => (
                <Link
                  key={person.id}
                  href={`/users/${person.id}`}
                  prefetch={true}
                  className="rounded-2xl p-4 flex flex-col items-center text-center cursor-pointer transition-all bg-white border border-zinc-200/80 hover:border-orange-300 hover:shadow-md active:scale-[0.99] relative overflow-hidden group shadow-xs"
                >
                  <div className="relative mb-2.5">
                    <div
                      className="w-16 h-16 rounded-full overflow-hidden p-0.5 transition-transform group-hover:scale-105"
                      style={{
                        background: person.isLiveOnCampus
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : 'linear-gradient(135deg, #F05A00 0%, #D94F00 100%)',
                      }}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden bg-white">
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
                    </div>

                    {/* Live on Campus indicator */}
                    {person.isLiveOnCampus ? (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-emerald-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full whitespace-nowrap shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Live Near You
                      </span>
                    ) : (
                      person.online !== false && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
                      )
                    )}
                  </div>

                  <div className="flex-1 w-full flex flex-col items-center">
                    <span className="text-xs sm:text-sm font-black text-zinc-900 group-hover:text-[#F05A00] transition-colors leading-tight line-clamp-1">
                      {person.full_name}
                    </span>
                    {person._affinityReason ? (
                      <span className="text-[10px] font-black text-[#F05A00] bg-orange-50 border border-orange-100/80 px-2 py-0.5 rounded-full mt-1 line-clamp-1">
                        {person._affinityReason}
                      </span>
                    ) : (
                      <span className="text-[10.5px] font-semibold text-zinc-500 mt-0.5 line-clamp-1">
                        {person.year ? (person.year.toLowerCase().includes('year') ? person.year : `${person.year} Year`) : ''} {person.branch ? `· ${person.branch}` : ''}
                      </span>
                    )}

                    <div className="flex flex-wrap gap-1 mt-2 justify-center" style={{ minHeight: 22 }}>
                      {(person.interests || []).slice(0, 2).map((tag, idx) => (
                        <span
                          key={`${tag}-${idx}`}
                          className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
                          style={{
                            background: `${INTEREST_COLORS[tag] || INTEREST_COLORS.default}15`,
                            color: INTEREST_COLORS[tag] || INTEREST_COLORS.default,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 w-full flex items-center gap-1.5 pt-1 border-t border-zinc-100">
                    <BookCoffeeButton
                      targetUserId={person.id}
                      targetName={person.full_name}
                      targetPhoto={getAvatar(person)}
                      isLoggedIn={!!currentUser}
                      rate={50}
                      renderButton={({ onClick }) => (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onClick();
                          }}
                          className="flex-1 py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-orange-50 hover:bg-orange-100 text-[#F05A00] border border-orange-200 flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer whitespace-nowrap shadow-2xs"
                          title={`Book Meetup with ${person.full_name}`}
                        >
                          <Calendar size={11} />
                          <span>Meet</span>
                        </button>
                      )}
                    />

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleConnect(person);
                      }}
                      className="flex-1 py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-[#F05A00] hover:bg-[#D94F00] text-white flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs whitespace-nowrap"
                      title={`Chat with ${person.full_name}`}
                    >
                      <MessageSquare size={11} />
                      <span>Chat</span>
                    </button>
                  </div>
                </Link>
              ))}
            </div>

            {/* Load More Classmates Button & Status */}
            {hasMore ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <button
                  type="button"
                  onClick={() => setVisiblePeopleLimit(prev => prev + 12)}
                  className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-white hover:bg-orange-50 text-[#F05A00] border border-orange-200 shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>Load More Classmates</span>
                  <span className="text-[10px] bg-orange-100 px-2 py-0.5 rounded-full">
                    +{fullList.length - visiblePeopleLimit}
                  </span>
                </button>
                <span className="text-[10px] font-semibold text-zinc-400">
                  Showing {list.length} of {fullList.length} classmates
                </span>
              </div>
            ) : (
              fullList.length > 0 && (
                <div className="text-center py-6 text-zinc-400 text-[11px] font-bold">
                  Showing all {fullList.length} campus peers
                </div>
              )
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

  return (
    <div className="space-y-5 pt-2 px-4 max-w-[640px] mx-auto pb-20">
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search students by name, branch, skills..."
          className="w-full pl-11 pr-10 py-3.5 rounded-2xl text-[13px] font-medium outline-none transition-all bg-zinc-50 border border-zinc-200 text-zinc-900 focus:border-[#F05A00] focus:ring-2 focus:ring-[#F05A00]/10 focus:bg-white" />
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

      {/* Student List */}
      {renderPeopleSection()}
    </div>
  );
}
