'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, 
  Sparkles, 
  MapPin, 
  Calendar, 
  Tag, 
  Briefcase, 
  Check, 
  Zap, 
  ChevronRight, 
  X,
  Users,
  Compass
} from '@/lib/icons';
import { getUserAvatarUrl, getCartoonAvatar } from '@/utils/avatar';
import Skeleton from '@/components/Skeleton';
import BookCoffeeButton from '@/features/users/BookCoffeeButton';
import useSWR from 'swr';
import { useUserContext } from '@/components/providers/UserProvider';
import { useCampusPresence } from '@/lib/useCampusPresence';

const fetcher = (url) => fetch(url).then((res) => res.json());

const FILTERS = ['All', 'Live on Campus', 'CSE', 'BBA', 'BCA', 'ECE', 'MBA', 'Design', 'Coding'];

const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '';
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || '';

function useAlgoliaSearch(query) {
  const [peopleResults, setPeopleResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef(null);

  const search = useCallback((q) => {
    if (!ALGOLIA_APP_ID || !ALGOLIA_SEARCH_KEY) return;
    if (!q || q.trim().length < 2) {
      setPeopleResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const url = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/*/queries`;
        const body = {
          requests: [
            {
              indexName: 'dev_PEOPLE',
              params: `query=${encodeURIComponent(q)}&hitsPerPage=20`,
            },
          ],
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'X-Algolia-Application-Id': ALGOLIA_APP_ID,
            'X-Algolia-API-Key': ALGOLIA_SEARCH_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error('Algolia request failed');
        const data = await res.json();
        const hits = data.results?.[0]?.hits || [];
        setPeopleResults(hits.map((h) => ({ ...h, id: h.objectID })));
      } catch {
        setPeopleResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  useEffect(() => {
    search(query);
    return () => clearTimeout(debounceRef.current);
  }, [query, search]);

  return { peopleResults, isSearching };
}

export default function DiscoverClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const interestParam = searchParams ? searchParams.get('interest') || searchParams.get('category') : null;
  const { user: currentUser, people: contextPeople, isUserOnline } = useUserContext();
  
  const [activeTab, setActiveTab] = useState('people'); // 'people' | 'events'
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState(interestParam || '');

  useEffect(() => {
    if (interestParam) {
      setSearch(interestParam);
      setActiveFilter('All');
    }
  }, [interestParam]);
  
  const [people, setPeople] = useState(contextPeople || []);
  const [visiblePeopleLimit, setVisiblePeopleLimit] = useState(12);

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
  const { peopleResults, isSearching } = useAlgoliaSearch(search);
  const isAlgoliaSearch = search.length >= 2 && !!ALGOLIA_APP_ID;

  // Campus presence hook
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

  const getAvatar = (p) => getUserAvatarUrl(p) || getCartoonAvatar(p.full_name || p.id);

  const chip = (label) => (
    <button key={label} onClick={() => setActiveFilter(label)}
      className="flex-shrink-0 px-4 py-2 rounded-full text-[12px] font-bold uppercase tracking-wide cursor-pointer transition-all active:scale-95 shadow-xs"
      style={activeFilter === label
        ? { background: '#6D28D9', color: '#ffffff', border: '1px solid #6D28D9' }
        : { background: '#ffffff', color: '#1C1917', border: '1px solid #E7E5E4' }}>
      {label}
    </button>
  );

  /* ─── People Section ─── */
  const renderPeopleSection = () => {
    const rawList = isAlgoliaSearch && peopleResults !== null ? peopleResults : people;
    
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
          <h2 className="text-[16px] font-bold text-[#1C1917]">
            Students nearby
          </h2>
          <div className="flex items-center gap-2">
            {liveCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {liveCount} Live on Campus
              </span>
            )}
            <span className="text-[12px] font-medium text-[#78716C] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {fullList.length} online
            </span>
          </div>
        </div>

        {isSearching && (
          <div className="flex items-center gap-2 text-[12px] text-[#78716C] font-medium px-1">
            <div className="w-3 h-3 border-2 border-[#6D28D9] border-t-transparent rounded-full animate-spin" />
            Searching...
          </div>
        )}

        {isPeopleLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-[16px] overflow-hidden border border-[#E7E5E4] flex flex-col relative">
                <Skeleton variant="rectangular" className="w-full h-[180px]" />
                <div className="p-3">
                  <Skeleton variant="text" className="w-24 h-4 mb-1" />
                  <Skeleton variant="text" className="w-16 h-3 mb-2" />
                  <Skeleton variant="rectangular" className="w-full h-9 rounded-2xl" />
                </div>
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-[16px] p-10 text-center font-medium text-[#78716C] bg-white border border-[#E7E5E4] flex flex-col items-center gap-2 shadow-[0_2px_8px_rgba(28,25,23,0.06)]">
            <span>No classmates found matching your query.</span>
            {search && (
              <button onClick={() => setSearch('')} className="px-4 py-2 mt-2 bg-[#FAFAF8] text-[#1C1917] text-[11px] font-bold uppercase tracking-wider rounded-full hover:bg-[#E7E5E4] transition-colors cursor-pointer border border-[#E7E5E4]">
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {list.map(person => (
                <Link
                  key={person.id}
                  href={`/users/${person.id}`}
                  prefetch={true}
                  className="rounded-[16px] p-5 flex flex-col items-center text-center cursor-pointer transition-all bg-white border border-[#E7E5E4] hover:border-[#6D28D9] hover:shadow-[0_4px_16px_rgba(28,25,23,0.08)] active:scale-[0.99] relative overflow-hidden group shadow-[0_2px_8px_rgba(28,25,23,0.06)]"
                >
                  <div className="relative mb-3">
                    <div className="w-16 h-16 rounded-full overflow-hidden p-[2px] border-2 border-[#E4D9F7] group-hover:border-[#6D28D9] transition-all">
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

                    {/* Live on Campus / Live Online indicator */}
                    {person.isLiveOnCampus ? (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Live Near You
                      </span>
                    ) : (
                      isUserOnline(person.id) && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
                      )
                    )}
                  </div>

                  <div className="flex-1 w-full flex flex-col items-center">
                    <span className="text-[15px] sm:text-[16px] font-bold text-[#1C1917] group-hover:text-[#6D28D9] transition-colors leading-tight line-clamp-1">
                      {person.full_name}
                    </span>
                    {person._affinityReason ? (
                      <span className="text-[11px] font-bold text-[#6D28D9] bg-[#F3EEFC] border border-[#E4D9F7] px-2.5 py-0.5 rounded-full mt-1.5 line-clamp-1">
                        {person._affinityReason}
                      </span>
                    ) : (
                      <span className="text-[12px] font-medium text-[#78716C] mt-1 line-clamp-1">
                        {person.year ? (person.year.toLowerCase().includes('year') ? person.year : `${person.year} Year`) : ''} {person.branch ? `· ${person.branch}` : ''}
                      </span>
                    )}

                    {/* ONE Tag Max per Fresh Blueprint (Section 3 & 8) */}
                    <div className="flex flex-wrap gap-1.5 mt-2.5 justify-center" style={{ minHeight: 22 }}>
                      {(person.interests || []).slice(0, 1).map((tag, idx) => (
                        <span
                          key={`${tag}-${idx}`}
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F3EEFC] text-[#6D28D9] border border-[#E4D9F7]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* ONE Primary Button: MEET (Full width 44px pill) */}
                  <div className="mt-4 w-full pt-3 border-t border-[#E7E5E4]">
                    <BookCoffeeButton
                      targetUserId={person.id}
                      targetName={person.full_name}
                      targetPhoto={getAvatar(person)}
                      isLoggedIn={!!currentUser}
                      completedMeets={person.completed_meets_count || 0}
                      renderButton={({ onClick }) => (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onClick();
                          }}
                          className="w-full h-11 rounded-full text-[13px] font-bold bg-[#6D28D9] hover:bg-[#5B21B6] text-white flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap shadow-xs"
                          title={`Meet ${person.full_name}`}
                        >
                          <Calendar size={14} />
                          <span>Meet</span>
                        </button>
                      )}
                    />
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
                  className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white hover:bg-[#F3EEFC] text-[#6D28D9] border border-[#E4D9F7] shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>Load More Classmates</span>
                  <span className="text-[10px] bg-[#F3EEFC] px-2 py-0.5 rounded-full font-bold">
                    +{fullList.length - visiblePeopleLimit}
                  </span>
                </button>
                <span className="text-[11px] font-bold text-[#78716C]">
                  Showing {list.length} of {fullList.length} classmates
                </span>
              </div>
            ) : (
              fullList.length > 0 && (
                <div className="text-center py-6 text-[#78716C] text-[11px] font-bold">
                  Showing all {fullList.length} campus peers
                </div>
              )
            )}
          </>
        )}
        {/* Algolia attribution */}
        {isAlgoliaSearch && ALGOLIA_APP_ID && (
          <p className="text-center text-[9px] text-[#A8A29E] font-bold mt-1">Search powered by Algolia</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5 pt-2 px-4 max-w-[640px] mx-auto pb-32">
      {/* Search Input */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#A8A29E]" />
        <input 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          placeholder="Search students by name, branch, skills..."
          className="w-full pl-11 pr-10 py-3.5 rounded-[12px] text-[13px] font-bold outline-none transition-all bg-white border border-[#E7E5E4] text-[#1C1917] placeholder:text-[#A8A29E] focus:border-[#6D28D9] focus:ring-2 focus:ring-[#6D28D9]/10 shadow-[0_2px_8px_rgba(28,25,23,0.06)]" 
        />
        {search && (
          <button 
            type="button" 
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-[#A8A29E] hover:text-[#1C1917] cursor-pointer"
            title="Clear search"
          >
            <X size={15} />
          </button>
        )}
        {isSearching && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[#6D28D9] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Campus presence banner */}
      {isOnCampus && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-[14px] px-3.5 py-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <p className="text-[11px] font-bold text-emerald-700">You&apos;re Live on Campus! Others can see you nearby.</p>
        </div>
      )}

      {/* 2-Way Toggle: People • Events per Blueprint Section 3 */}
      <div className="flex p-1 bg-white border border-[#E7E5E4] rounded-full shadow-[0_2px_8px_rgba(28,25,23,0.06)]">
        <button
          type="button"
          onClick={() => setActiveTab('people')}
          className={`flex-1 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'people'
              ? 'bg-[#6D28D9] text-white shadow-xs'
              : 'text-[#78716C] hover:text-[#1C1917]'
          }`}
        >
          People
        </button>
        <button
          type="button"
          onClick={() => {
            router.push('/events');
          }}
          className={`flex-1 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'events'
              ? 'bg-[#6D28D9] text-white shadow-xs'
              : 'text-[#78716C] hover:text-[#1C1917]'
          }`}
        >
          Events
        </button>
      </div>

      {/* Filter Chips */}
      {activeTab === 'people' && (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {FILTERS.map(f => chip(f))}
        </div>
      )}

      {/* Content */}
      {renderPeopleSection()}
    </div>
  );
}
