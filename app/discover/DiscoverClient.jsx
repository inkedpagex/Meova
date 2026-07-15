'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search, Users, UserCheck, MessageCircle, Calendar,
  Briefcase, Gamepad2, Compass, Sparkles, MapPin
} from 'lucide-react';
import { CircleAvatar } from '../../components/CircleAvatar';
import CircleJoinButton from '../../features/circles/CircleJoinButton';
import BookCoffeeButton from '../../features/users/BookCoffeeButton';

import { getUserAvatarUrl, getCartoonAvatar } from '../../utils/avatar';

function avatarUrl(userOrSeed) {
  if (userOrSeed && typeof userOrSeed === 'object') return getUserAvatarUrl(userOrSeed);
  return getCartoonAvatar(userOrSeed);
}

export default function DiscoverClient({ people, circles, currentUser }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All'); // 'All' | 'Communities' | 'People'

  const categories = [
    { name: 'All', emoji: '🧭', color: 'text-indigo-400', activeBg: 'bg-indigo-500/10 border-indigo-500/35' },
    { name: 'Communities', emoji: '👥', color: 'text-purple-400', activeBg: 'bg-purple-500/10 border-purple-500/35' },
    { name: 'People', emoji: '🎓', color: 'text-emerald-400', activeBg: 'bg-emerald-500/10 border-emerald-500/35' },
    { name: 'Gigs', emoji: '💼', color: 'text-teal-400', activeBg: 'bg-teal-500/10 border-teal-500/35', href: '/gigs' },
    { name: 'Events', emoji: '📅', color: 'text-orange-400', activeBg: 'bg-orange-500/10 border-orange-500/35', href: '/events' }
  ];

  const popularSearches = ['Startup', 'Design', 'AI/ML', 'Music', 'Coding'];

  const query = searchQuery.toLowerCase();

  // Filters
  const filteredPeople = people.filter(u => 
    (u.full_name || '').toLowerCase().includes(query) || 
    (u.branch || '').toLowerCase().includes(query) ||
    (u.interests || []).some(t => t.toLowerCase().includes(query))
  );

  const filteredCircles = circles.filter(c => 
    (c.name || '').toLowerCase().includes(query) || 
    (c.category || '').toLowerCase().includes(query)
  );

  const showPeople = activeCategory === 'All' || activeCategory === 'People';
  const showCircles = activeCategory === 'All' || activeCategory === 'Communities';

  return (
    <div className="w-full max-w-[640px] mx-auto pb-24 px-4 space-y-8 anim-fade-in">
      
      {/* ── HEADER ────────────────────────── */}
      <div className="pt-6 space-y-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            Discover
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-bold mt-1 uppercase tracking-widest">
            Find students and communities on your campus
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search people, circles, interests..."
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[#6366f1]/40 rounded-2xl pl-12 pr-4 py-3.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-all font-semibold shadow-inner"
          />
        </div>
      </div>

      {/* ── CATEGORY BUTTONS (Premium Pill Capsules) ────────────────────────── */}
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 pt-1 snap-x">
        {categories.map((cat) => {
          const isSelected = activeCategory === cat.name;

          if (cat.href) {
            return (
              <Link
                key={cat.name}
                href={cat.href}
                className="flex items-center gap-2 px-4.5 py-2.5 rounded-2xl border transition-all duration-300 flex-shrink-0 cursor-pointer snap-start bg-[var(--bg-elevated)] border-[var(--border-subtle)] hover:border-neutral-700 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold hover:scale-[1.02] active:scale-95"
              >
                <span className="text-[14px] filter drop-shadow-sm select-none">{cat.emoji}</span>
                <span className="text-[10px] uppercase tracking-wider">{cat.name}</span>
              </Link>
            );
          }

          return (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`flex items-center gap-2 px-4.5 py-2.5 rounded-2xl border transition-all duration-300 flex-shrink-0 cursor-pointer snap-start hover:scale-[1.02] active:scale-95 ${
                isSelected 
                  ? `${cat.activeBg} ${cat.color} font-black border-current shadow-[0_2px_10px_rgba(0,0,0,0.15)]` 
                  : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] hover:border-neutral-700 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold'
              }`}
            >
              <span className="text-[14px] filter drop-shadow-sm select-none">{cat.emoji}</span>
              <span className="text-[10px] uppercase tracking-wider">{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* ── POPULAR SEARCHES ────────────────────────── */}
      <div className="space-y-2.5">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
          Popular Searches
        </h4>
        <div className="flex flex-wrap gap-2">
          {popularSearches.map((term) => (
            <button
              key={term}
              onClick={() => setSearchQuery(term)}
              className="text-[11px] font-bold px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[#818cf8] hover:border-[#6366f1]/30 transition-all active:scale-95"
            >
              #{term}
            </button>
          ))}
        </div>
      </div>

      {/* ── RECOMMENDED MIXED FEED ────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-[var(--text-secondary)]">
          Recommended For You
        </h3>

        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[2rem] overflow-hidden shadow-xl">
          {/* Circles Render */}
          {showCircles && filteredCircles.slice(0, 5).map((circle) => {
            const isJoined = (circle.circle_members || []).some(m => m.user_id === currentUser?.id);
            return (
              <div key={circle.id} className="flex items-center justify-between p-4.5 border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-hover)] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-center flex-shrink-0">
                    <CircleAvatar name={circle.name} size={44} radius={12} />
                  </div>
                  <div>
                    <Link href={`/circles/${circle.id}`}>
                      <h4 className="text-xs font-black text-[var(--text-primary)] hover:text-[#818cf8] transition-colors">
                        {circle.name}
                      </h4>
                    </Link>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 font-bold">
                      {circle.category} • {circle.member_count || 120} members
                    </p>
                  </div>
                </div>
                
                <div className="w-24 flex-shrink-0">
                  <CircleJoinButton
                    circleId={circle.id}
                    userId={currentUser?.id}
                    isInitialMember={isJoined}
                  />
                </div>
              </div>
            );
          })}

          {/* People Render */}
          {showPeople && filteredPeople.slice(0, 12).map((u) => {
            const interest = (u.interests || [])[0];
            return (
              <div key={u.id} className="flex items-center justify-between p-4.5 border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-hover)] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex-shrink-0">
                    <img src={avatarUrl(u.full_name || u.id)} alt={u.full_name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <Link href={`/users/${u.id}`}>
                      <h4 className="text-xs font-black text-[var(--text-primary)] hover:text-[#818cf8] transition-colors">
                        {u.full_name || 'Student'}
                      </h4>
                    </Link>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 font-bold">
                      {u.year} Year {u.branch ? `• ${u.branch.split(' ')[0]}` : ''}
                      {interest && <span className="text-[var(--text-muted)]"> • {interest}</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <BookCoffeeButton 
                    targetUserId={u.id}
                    targetName={u.full_name || 'Student'}
                    isLoggedIn={!!currentUser}
                    accentColor="#6366f1"
                  />
                  <Link href={`/messages?user=${encodeURIComponent(u.full_name || 'Student')}`}>
                    <button className="bg-[var(--bg-overlay)] text-[var(--text-primary)] hover:text-white border border-[var(--border-subtle)] w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#6366f1] hover:border-[#6366f1] transition-all cursor-pointer">
                      <MessageCircle size={14} />
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {filteredPeople.length === 0 && filteredCircles.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xs text-[var(--text-secondary)]">No results match your search query.</p>
          </div>
        )}
      </div>

    </div>
  );
}
