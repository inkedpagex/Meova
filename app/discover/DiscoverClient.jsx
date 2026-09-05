'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  Compass,
  MessageSquare
} from '@/lib/icons';
import { getUserAvatarUrl, getCartoonAvatar } from '@/utils/avatar';
import Skeleton from '@/components/Skeleton';
import BookCoffeeButton from '@/features/users/BookCoffeeButton';
import CirclesList from '@/features/circles/CirclesList';
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
  const tabParam = searchParams ? searchParams.get('tab') : null;
  const { user: currentUser, people: contextPeople, isUserOnline } = useUserContext();
  
  const [activeTab, setActiveTab] = useState(tabParam === 'circles' ? 'circles' : 'people');
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState(interestParam || '');

  useEffect(() => {
    if (tabParam === 'circles') setActiveTab('circles');
    else if (tabParam === 'people') setActiveTab('people');
  }, [tabParam]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (tab === 'circles') {
        url.searchParams.set('tab', 'circles');
      } else {
        url.searchParams.delete('tab');
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

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
  const { data: usersData } = useSWR('/api/users', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
  const isPeopleLoading = usersData === undefined;
  
  // SWR Hook for campus circles (cached with 5-minute deduping for super fast switching)
  const { data: circlesData } = useSWR('/api/circles', fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    dedupingInterval: 300000,
  });
  const circles = circlesData?.circles || [];
  
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

  const chip = (label) => {
    const isSelected = activeFilter === label;
    return (
      <button
        key={label}
        onClick={() => setActiveFilter(label)}
        className={`flex-shrink-0 px-4 py-2 rounded-full text-[12px] font-bold uppercase tracking-wide cursor-pointer transition-all active:scale-95 shadow-xs border ${
          isSelected
            ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs'
            : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-hairline)] hover:border-[var(--border-mid)] hover:text-[var(--text-primary)]'
        }`}
      >
        {label}
      </button>
    );
  };

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
          <h2 className="text-[16px] font-bold text-[var(--text-primary)]">
            Students nearby
          </h2>
          {liveCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {liveCount} Live on Campus
              </span>
            </div>
          )}
        </div>

        {isSearching && (
          <div className="flex items-center gap-2 text-[12px] text-[var(--text-secondary)] font-medium px-1">
            <div className="w-3 h-3 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            Searching...
          </div>
        )}

        {isPeopleLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-[var(--bg-surface)] rounded-[26px] p-4 border border-[var(--border-hairline)] flex flex-col justify-between shadow-xs">
                <div className="flex justify-between items-center mb-3">
                  <Skeleton variant="text" className="w-20 h-5 rounded-full" />
                  <Skeleton variant="text" className="w-16 h-5 rounded-full" />
                </div>
                <div className="flex flex-col items-center my-2">
                  <Skeleton variant="rectangular" className="w-28 h-28 sm:w-32 sm:h-32 rounded-[26px] mb-3" />
                  <Skeleton variant="text" className="w-32 h-5 mb-1.5" />
                  <Skeleton variant="text" className="w-24 h-3 mb-2.5" />
                  <Skeleton variant="text" className="w-40 h-6 rounded-xl mb-2" />
                  <div className="flex gap-1.5">
                    <Skeleton variant="text" className="w-14 h-4 rounded-full" />
                    <Skeleton variant="text" className="w-14 h-4 rounded-full" />
                  </div>
                </div>
                <div className="pt-3 border-t border-[var(--border-hairline)] flex gap-2">
                  <Skeleton variant="rectangular" className="flex-1 h-10 rounded-full" />
                  <Skeleton variant="circular" className="w-10 h-10 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-[26px] p-10 text-center font-medium text-[var(--text-secondary)] bg-[var(--bg-surface)] border border-[var(--border-hairline)] flex flex-col items-center gap-2 shadow-xs">
            <Users size={28} className="text-[var(--text-muted)] mb-1" />
            <span className="text-[14px] font-bold text-[var(--text-primary)]">No classmates found matching your query.</span>
            <span className="text-[12px] text-[var(--text-secondary)]">Try exploring different branches or clearing your search.</span>
            {search && (
              <button onClick={() => setSearch('')} className="px-5 py-2 mt-2 bg-[var(--accent-tint-10)] text-[var(--accent)] hover:bg-[var(--accent-tint-20)] text-[11px] font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer border border-[var(--accent-tint-20)]">
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {list.map(person => {
                const isOnline = isUserOnline(person.id);
                const mutualText = person._affinityReason ? person._affinityReason.replace(/^Both into /i, 'Shared: ') : null;

                return (
                  <div
                    key={person.id}
                    onClick={() => router.push(`/users/${person.id}`)}
                    className="rounded-[26px] bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--accent)] hover:shadow-md active:scale-[0.99] transition-all duration-300 cursor-pointer p-4 flex flex-col justify-between group shadow-xs relative select-none"
                  >
                    {/* Top Header Floating Badges */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      {person.isLiveOnCampus ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-xs tracking-wider uppercase flex-shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          Live On Campus
                        </span>
                      ) : isOnline ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 shadow-xs flex-shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-medium bg-[var(--bg-base)] text-[var(--text-secondary)] border border-[var(--border-hairline)] flex-shrink-0">
                          <MapPin size={10} className="text-[var(--accent)]" /> GLA Campus
                        </span>
                      )}

                      {person.completed_meets_count > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[var(--accent)] bg-[var(--accent-tint-10)] border border-[var(--accent-tint-20)] px-2.5 py-1 rounded-full shadow-xs flex-shrink-0">
                          <Zap size={10} className="fill-[var(--accent)]" />
                          {person.completed_meets_count} Meets
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-[var(--text-muted)] tracking-wider uppercase px-2.5 py-1 rounded-full bg-[var(--bg-base)] border border-[var(--border-hairline)] flex-shrink-0">
                          Classmate
                        </span>
                      )}
                    </div>

                    {/* Center Big Portrait Photo (100% Uncropped Face Visibility) */}
                    <div className="flex flex-col items-center text-center my-1.5 flex-1">
                      <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[26px] overflow-hidden p-[3px] bg-gradient-to-tr from-[var(--accent-tint-20)] via-[var(--border-hairline)] to-[var(--accent)] group-hover:scale-105 transition-all duration-300 shadow-md mb-3 flex-shrink-0">
                        <div className="w-full h-full rounded-[23px] overflow-hidden bg-[var(--bg-surface)]">
                          <img
                            src={getAvatar(person)}
                            alt={person.full_name || 'User'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = getCartoonAvatar(person.full_name || person.id || 'user');
                            }}
                          />
                        </div>
                        {isOnline && (
                          <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-[var(--bg-surface)] shadow-md" />
                        )}
                      </div>

                      {/* Name & Academic Info */}
                      <h3 className="text-[16px] sm:text-[17px] font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors leading-tight line-clamp-1">
                        {person.full_name}
                      </h3>
                      <p className="text-[12px] font-semibold text-[var(--text-secondary)] mt-0.5 line-clamp-1">
                        {person.branch || 'GLA Student'}{person.year ? ` • Year ${person.year.replace(/[^0-9]/g, '') || person.year}` : ''}
                      </p>

                      {/* Mutual Vibe / Bio */}
                      {mutualText ? (
                        <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-[var(--accent-tint-10)] border border-[var(--accent-tint-20)] text-[var(--accent)] text-[11px] font-bold flex items-center justify-center gap-1.5 max-w-full">
                          <Sparkles size={11} className="text-[var(--accent)] flex-shrink-0" />
                          <span className="truncate">{mutualText}</span>
                        </div>
                      ) : person.bio ? (
                        <p className="mt-2 text-[11.5px] text-[var(--text-secondary)] italic line-clamp-2 leading-relaxed px-1">
                          &ldquo;{person.bio}&rdquo;
                        </p>
                      ) : (
                        <div className="mt-2 text-[11px] text-[var(--text-muted)] font-medium flex items-center gap-1">
                          <Users size={11} className="text-[var(--accent)] flex-shrink-0" />
                          <span>Open to connect &amp; meet</span>
                        </div>
                      )}

                      {/* Interest Tags */}
                      <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2.5 min-h-[22px]">
                        {(person.interests || []).slice(0, 3).map((tag, idx) => (
                          <span
                            key={`${tag}-${idx}`}
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--bg-base)] text-[var(--text-secondary)] border border-[var(--border-hairline)] group-hover:border-[var(--accent-tint-20)] transition-colors"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Dual Action Bar */}
                    <div className="mt-3 pt-3 flex items-center gap-2 border-t border-[var(--border-hairline)] w-full">
                      {/* Primary Action: Meet */}
                      <div className="flex-1">
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
                              className="w-full h-10 rounded-full text-[12.5px] font-bold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap shadow-xs"
                              title={`Meet ${person.full_name}`}
                            >
                              <Zap size={13} className="fill-white" />
                              <span>Meet</span>
                            </button>
                          )}
                        />
                      </div>

                      {/* Secondary Action: Direct Message */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!currentUser) {
                            router.push('/login');
                          } else {
                            router.push(`/messages?userId=${person.id}`);
                          }
                        }}
                        className="h-10 w-10 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--accent-tint-10)] text-[var(--text-secondary)] hover:text-[var(--accent)] border border-[var(--border-hairline)] hover:border-[var(--accent-tint-20)] flex items-center justify-center flex-shrink-0 transition-all active:scale-95 cursor-pointer shadow-xs"
                        title="Send Direct Message"
                      >
                        <MessageSquare size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Classmates Button & Status */}
            {hasMore ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <button
                  type="button"
                  onClick={() => setVisiblePeopleLimit(prev => prev + 12)}
                  className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--bg-surface)] hover:bg-[var(--accent-tint-10)] text-[var(--accent)] border border-[var(--accent-tint-20)] shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>Load More Classmates</span>
                  <span className="text-[10px] bg-[var(--accent-tint-10)] px-2 py-0.5 rounded-full font-bold">
                    +{fullList.length - visiblePeopleLimit}
                  </span>
                </button>
                <span className="text-[11px] font-bold text-[var(--text-secondary)]">
                  Showing {list.length} of {fullList.length} classmates
                </span>
              </div>
            ) : (
              fullList.length > 0 && (
                <div className="text-center py-6 text-[var(--text-secondary)] text-[11px] font-bold">
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
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]" />
        <input 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          placeholder={activeTab === 'people' ? "Search students by name, branch, skills..." : "Search communities, channels, tags..."}
          className="w-full pl-11 pr-10 py-3.5 rounded-[16px] text-[13px] font-medium outline-none transition-all bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 shadow-xs" 
        />
        {search && (
          <button 
            type="button" 
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            title="Clear search"
          >
            <X size={15} />
          </button>
        )}
        {isSearching && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Campus presence banner */}
      {isOnCampus && (
        <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-[14px] px-3.5 py-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <p className="text-[11px] font-bold text-emerald-400">You&apos;re Live on Campus! Others can see you nearby.</p>
        </div>
      )}

      {/* 2-Way Animated Sliding Toggle: People • Circles */}
      <div className="relative flex p-1 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-full shadow-xs">
        <button
          type="button"
          onClick={() => handleTabChange('people')}
          className={`relative z-10 flex-1 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer select-none ${
            activeTab === 'people'
              ? 'text-white'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          {activeTab === 'people' && (
            <motion.div
              layoutId="discoverTabGlider"
              className="absolute inset-0 rounded-full bg-[var(--accent)] shadow-xs"
              transition={{ type: 'spring', stiffness: 500, damping: 38 }}
            />
          )}
          <span className="relative z-10">People</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('circles')}
          className={`relative z-10 flex-1 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer select-none ${
            activeTab === 'circles'
              ? 'text-white'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          {activeTab === 'circles' && (
            <motion.div
              layoutId="discoverTabGlider"
              className="absolute inset-0 rounded-full bg-[var(--accent)] shadow-xs"
              transition={{ type: 'spring', stiffness: 500, damping: 38 }}
            />
          )}
          <span className="relative z-10">Circles</span>
        </button>
      </div>

      {/* Smooth Tab Content Transition */}
      <AnimatePresence mode="wait">
        {activeTab === 'people' ? (
          <motion.div
            key="people"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="space-y-5"
          >
            {/* Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {FILTERS.map(f => chip(f))}
            </div>

            {renderPeopleSection()}
          </motion.div>
        ) : (
          <motion.div
            key="circles"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="pt-1"
          >
            <CirclesList
              circles={circles}
              userId={currentUser?.uid || currentUser?.id}
              externalSearch={search}
              hideSearch={true}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
