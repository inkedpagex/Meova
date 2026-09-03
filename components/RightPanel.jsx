'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { getUserAvatarUrl, getCartoonAvatar } from '../utils/avatar';


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
    <aside className="hidden xl:block w-[320px] fixed right-0 top-0 h-screen overflow-y-auto border-l border-[#E7E5E4] bg-[#FAFAF8] p-5 space-y-6 select-none z-30">
      
      {/* ── Upcoming Events Section ────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#78716C]">Upcoming Events</h4>
          <Link href="/events" className="text-[11px] font-bold text-[#6D28D9] hover:text-[#5B21B6]">Explore all</Link>
        </div>

        <div className="space-y-2.5">
          {upcomingEvents.length === 0 ? (
            <div className="p-5 rounded-[16px] bg-white border border-[#E7E5E4] text-center shadow-[0_2px_8px_rgba(28,25,23,0.06)]">
              <i className="ri-calendar-event-line text-[#A8A29E] mx-auto mb-1.5 block" style={{ fontSize: 24 }} />
              <p className="text-[13px] text-[#1C1917] font-bold">No upcoming events</p>
              <p className="text-[11px] text-[#78716C] mt-0.5">Check back soon for campus meetups &amp; fests.</p>
            </div>
          ) : (
            upcomingEvents.slice(0, 4).map((evt) => (
              <div key={evt.id} className="p-4 rounded-[16px] bg-white border border-[#E7E5E4] space-y-2 shadow-[0_2px_8px_rgba(28,25,23,0.06)] hover:border-[#6D28D9] transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F3EEFC] text-[#6D28D9] border border-[#E4D9F7]">
                    {evt.category || 'Event'}
                  </span>
                  <span className="text-[11px] font-medium text-[#78716C]">{evt.date || 'Soon'}</span>
                </div>
                <h5 className="text-[13.5px] font-bold text-[#1C1917] leading-snug">{evt.title}</h5>
                <div className="flex items-center gap-1.5 text-[11px] text-[#78716C] font-medium">
                  <i className="ri-map-pin-2-fill text-[#6D28D9]" style={{ fontSize: 12 }} />
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
        className="block p-4 rounded-[16px] bg-white border border-[#E7E5E4] hover:border-[#6D28D9] shadow-[0_2px_8px_rgba(28,25,23,0.06)] transition-all group cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div>
            <h5 className="text-[13px] font-bold text-[#1C1917] group-hover:text-[#6D28D9] transition-colors">
              Find Classmates &amp; Circles
            </h5>
            <p className="text-[11px] text-[#78716C] mt-0.5">Connect across branches and years</p>
          </div>
          <span className="text-[16px] text-[#6D28D9] group-hover:translate-x-1 transition-transform">→</span>
        </div>
      </Link>

    </aside>
  );
}
