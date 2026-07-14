'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Users, UserCheck } from 'lucide-react';
import { CircleAvatar } from '../../components/CircleAvatar';
import CircleJoinButton from '../../features/circles/CircleJoinButton';

function avatarUrl(seed) {
  return `https://i.pravatar.cc/150?u=${encodeURIComponent(seed || 'u')}`;
}

function PersonRow({ user: u }) {
  // Extract interests for easy display
  const interests = Array.from(new Set(u.interests || [])).slice(0, 2).join(' • ');

  return (
    <div className="flex items-center gap-4 px-2 py-3 border-b border-white/[0.08] hover:bg-white/[0.02] transition-colors duration-200">
      <Link href={`/users/${u.id}`} className="flex-shrink-0">
        <div className="w-11 h-11 rounded-full overflow-hidden border border-white/10">
          <img src={avatarUrl(u.full_name || u.id)} alt={u.full_name} className="w-full h-full object-cover" loading="lazy" />
        </div>
      </Link>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <Link href={`/users/${u.id}`} className="truncate">
          <p className="text-[15px] font-bold text-white hover:underline underline-offset-2 truncate">
            {u.full_name}
          </p>
        </Link>
        <p className="text-[13px] text-neutral-400 truncate mt-0.5">
          {u.year} Year • {u.branch}
          {interests && <span className="ml-1.5 hidden sm:inline">• {interests}</span>}
        </p>
      </div>
      <div className="flex-shrink-0 ml-2">
        <Link href={`/messages?user=${encodeURIComponent(u.full_name)}`}>
          <button className="bg-white text-black text-[13px] font-bold py-1.5 px-4 rounded-full hover:bg-neutral-200 transition-colors active:scale-95">
            Connect
          </button>
        </Link>
      </div>
    </div>
  );
}

function CircleRow({ circle, currentUserId }) {
  const isJoined = (circle.circle_members || []).some((m) => m.user_id === currentUserId);
  return (
    <div className="flex items-center gap-4 px-2 py-3 border-b border-white/[0.08] hover:bg-white/[0.02] transition-colors duration-200">
      <Link href={`/circles/${circle.id}`} className="flex-shrink-0">
        <div className="w-11 h-11 rounded-full overflow-hidden border border-white/10">
          <CircleAvatar name={circle.name} size={44} radius={50} />
        </div>
      </Link>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <Link href={`/circles/${circle.id}`} className="truncate">
          <p className="text-[15px] font-bold text-white hover:underline underline-offset-2 truncate">
            {circle.name}
          </p>
        </Link>
        <p className="text-[13px] text-neutral-400 truncate mt-0.5">
          {circle.category} • {circle.member_count || 0} members
        </p>
      </div>
      <div className="flex-shrink-0 ml-2 w-24">
        {/* Reusing our beautiful CircleJoinButton from the Circles feature */}
        <CircleJoinButton
          circleId={circle.id}
          userId={currentUserId}
          isInitialMember={isJoined}
          accentColor="#ffffff"
        />
      </div>
    </div>
  );
}

export default function DiscoverClient({ people, circles, currentUser }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const FILTERS = ['All', 'Coding', 'Music', 'Sports', 'Gaming', 'Art', 'Entrepreneurship'];

  // Filter Logic
  const query = searchQuery.toLowerCase();

  const filteredPeople = people.filter((u) => {
    // Check search query
    const matchesSearch =
      (u.full_name || '').toLowerCase().includes(query) ||
      (u.branch || '').toLowerCase().includes(query);

    // Check tag filter
    let matchesFilter = true;
    if (activeFilter !== 'All') {
      const tags = (u.interests || []).map((t) => t.toLowerCase());
      // basic mapping
      if (activeFilter === 'Coding') matchesFilter = tags.some((t) => t.includes('coding') || t.includes('tech'));
      else if (activeFilter === 'Music') matchesFilter = tags.some((t) => t.includes('music'));
      else if (activeFilter === 'Sports') matchesFilter = tags.some((t) => t.includes('sport') || t.includes('fitness'));
      else if (activeFilter === 'Gaming') matchesFilter = tags.some((t) => t.includes('game') || t.includes('esports'));
      else if (activeFilter === 'Art') matchesFilter = tags.some((t) => t.includes('art') || t.includes('sketch'));
      else if (activeFilter === 'Entrepreneurship') matchesFilter = tags.some((t) => t.includes('entrepreneur'));
    }

    return matchesSearch && matchesFilter;
  });

  const filteredCircles = circles.filter((c) => {
    const matchesSearch =
      (c.name || '').toLowerCase().includes(query) ||
      (c.category || '').toLowerCase().includes(query);

    let matchesFilter = true;
    if (activeFilter !== 'All') {
      const cat = (c.category || '').toLowerCase();
      if (activeFilter === 'Coding') matchesFilter = cat.includes('coding') || cat.includes('tech');
      else if (activeFilter === 'Music') matchesFilter = cat.includes('music');
      else if (activeFilter === 'Sports') matchesFilter = cat.includes('sport') || cat.includes('fitness');
      else if (activeFilter === 'Gaming') matchesFilter = cat.includes('game') || cat.includes('esports');
      else if (activeFilter === 'Art') matchesFilter = cat.includes('art') || cat.includes('sketch');
      else if (activeFilter === 'Entrepreneurship') matchesFilter = cat.includes('entrepreneur');
    }

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="w-full max-w-[600px] mx-auto pb-20 anim-fade-in">
      {/* Header */}
      <div className="mb-6 pt-2">
        <h1 className="text-[26px] font-extrabold text-white tracking-tight">Discover</h1>
        <p className="text-[13px] text-neutral-400 mt-1">
          Find students and communities on your campus
        </p>
      </div>

      {/* Interactive Search bar */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search people, circles, events…"
          className="w-full bg-white/5 border border-white/10 rounded-full pl-11 pr-4 py-3 text-[14px] text-white placeholder-neutral-500 focus:outline-none focus:border-white/20 transition-all font-medium"
        />
      </div>

      {/* Interactive Filter chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`flex-shrink-0 text-[13px] font-bold px-4 py-2 rounded-full transition-all active:scale-95 ${
              activeFilter === f
                ? 'bg-white text-black'
                : 'bg-white/5 text-neutral-300 border border-white/5 hover:bg-white/10'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* People section */}
      {filteredPeople.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-2 px-2">
            <UserCheck size={16} className="text-neutral-500" />
            <h2 className="text-[15px] font-bold text-neutral-200">
              Students ({filteredPeople.length})
            </h2>
          </div>
          <div className="flex flex-col">
            {filteredPeople.slice(0, 50).map((u) => (
              <PersonRow key={u.id} user={u} />
            ))}
          </div>
        </section>
      )}

      {/* Circles section */}
      {filteredCircles.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2 px-2">
            <Users size={16} className="text-neutral-500" />
            <h2 className="text-[15px] font-bold text-neutral-200">
              Communities ({filteredCircles.length})
            </h2>
          </div>
          <div className="flex flex-col">
            {filteredCircles.map((c) => (
              <CircleRow key={c.id} circle={c} currentUserId={currentUser?.id} />
            ))}
          </div>
        </section>
      )}
      
      {filteredPeople.length === 0 && filteredCircles.length === 0 && (
        <div className="text-center py-16">
          <p className="text-neutral-500 text-[14px]">No results found for your search.</p>
        </div>
      )}
    </div>
  );
}
