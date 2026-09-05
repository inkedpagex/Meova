'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { getUserAvatarUrl, getCartoonAvatar } from '../utils/avatar';


import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { useUserContext } from './providers/UserProvider';

export default function RightPanel({ people = [], upcomingEvents = [] }) {
  const pathname = usePathname();
  const { isUserOnline } = useUserContext();

  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/messages') ||
    pathname === '/terms' ||
    pathname === '/privacy' ||
    pathname === '/offline' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/gla-university' ||
    pathname?.startsWith('/gla-university')
  ) return null;

  const topPeople = people.slice(0, 4);

  return (
    <aside className="hidden xl:block w-[320px] fixed right-0 top-0 h-screen overflow-y-auto border-l border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-6 select-none z-30">
      
      {/* ── Upcoming Events Section ────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[12px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Upcoming Events</h4>
          <Link href="/events" className="text-[11px] font-bold text-[var(--accent)] hover:underline">Explore all</Link>
        </div>

        <div className="space-y-2.5">
          {upcomingEvents.length === 0 ? (
            <div className="p-5 rounded-[16px] bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-center shadow-xs">
              <Calendar size={24} strokeWidth={1.5} className="text-[var(--text-muted)] mx-auto mb-1.5 block" />
              <p className="text-[13px] text-[var(--text-primary)] font-bold">No upcoming events</p>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Check back soon for campus meetups &amp; fests.</p>
            </div>
          ) : (
            upcomingEvents.slice(0, 4).map((evt) => (
              <div key={evt.id} className="p-4 rounded-[16px] bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-2 shadow-xs hover:border-[var(--accent)] transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--accent-tint-10)] text-[var(--accent)] border border-[var(--accent-tint-20)]">
                    {evt.category || 'Event'}
                  </span>
                  <span className="text-[11px] font-medium text-[var(--text-secondary)]">{evt.date || 'Soon'}</span>
                </div>
                <h5 className="text-[13.5px] font-bold text-[var(--text-primary)] leading-snug">{evt.title}</h5>
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] font-medium">
                  <MapPin size={13} strokeWidth={1.5} className="text-[var(--accent)] flex-shrink-0" />
                  <span className="truncate">{evt.location || 'GLA Campus'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Quick Discovery Link ───────────────────────────────────────────── */}
      <Link 
        href="/discover"
        className="block p-4 rounded-[16px] bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--accent)] shadow-xs transition-all group cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div>
            <h5 className="text-[13px] font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
              Find Classmates &amp; Circles
            </h5>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Connect across branches and years</p>
          </div>
          <span className="text-[16px] text-[var(--accent)] group-hover:translate-x-1 transition-transform">→</span>
        </div>
      </Link>

    </aside>
  );
}
