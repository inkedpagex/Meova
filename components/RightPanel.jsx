'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { getUserAvatarUrl, getCartoonAvatar } from '../utils/avatar';


export default function RightPanel({ people = [], upcomingEvents = [] }) {
  const pathname = usePathname();
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

  const topPeople = people.slice(0, 3);

  return (
    <aside className="hidden xl:block w-[320px] fixed right-0 top-0 h-screen overflow-y-auto border-l border-neutral-100 bg-white p-6 space-y-6 select-none z-30">
      
      {/* Header Widget */}
      <div className="bg-[#F05A00] rounded-2xl p-4 text-white">
        <div className="flex items-center gap-2 mb-2">
          <i className="ri-sparkling-2-fill" style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)' }} />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/80 whitespace-nowrap">Campus Spotlight</span>
        </div>
        <h3 className="text-sm font-black tracking-tight leading-snug whitespace-nowrap truncate">Explore Campus Events</h3>
        <p className="text-[11px] text-white/70 mt-1 font-medium whitespace-nowrap truncate">Book meets or join circles.</p>
      </div>

      {/* People to Vibe With */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 whitespace-nowrap">Classmates</h4>
          <Link href="/discover" className="text-[10px] font-black text-[#F05A00] hover:text-[#D94F00] whitespace-nowrap">See all</Link>
        </div>

        <div className="space-y-2.5">
          {topPeople.length === 0 ? (
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 text-center space-y-2">
              <p className="text-xs font-bold text-neutral-500">No peers found yet</p>
              <Link 
                href="/discover" 
                className="inline-flex items-center gap-1 text-[11px] font-black text-[#F05A00] hover:text-[#D94F00]"
              >
                <span>Find Classmates</span>
                <span>→</span>
              </Link>
            </div>
          ) : (
            topPeople.map((person) => {
              const yr = (person.year || '1st').toString().replace(/\s*year\s*/i, '').trim();
              const br = (person.branch || 'General').replace('COMPUTER SCIENCE', 'CSE').replace('BUSINESS ADMIN', 'BBA');
              return (
                <Link
                  key={person.id || person.uid}
                  href={`/users/${person.id || person.uid}`}
                  className="flex items-center justify-between p-2.5 rounded-2xl border border-neutral-100 hover:border-orange-200 hover:bg-orange-50/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-orange-100 flex-shrink-0 relative group-hover:scale-105 transition-transform">
                      <img 
                        src={getUserAvatarUrl(person)} 
                        alt={person.full_name || 'User'} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = getCartoonAvatar(person.full_name || person.id || 'user');
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="text-[12px] font-black text-neutral-900 truncate group-hover:text-[#F05A00] transition-colors">{person.full_name || 'Student'}</h5>
                      <p className="text-[10px] font-semibold text-neutral-400 truncate">{yr} Yr · {br}</p>
                    </div>
                  </div>
                  <div className="text-[10px] font-black px-2.5 py-1.5 rounded-xl bg-orange-50 text-[#F05A00] border border-orange-100 group-hover:bg-[#F05A00] group-hover:text-white transition-all flex-shrink-0 flex items-center gap-1 whitespace-nowrap">
                    Meet {person.spark_charge || 50} <i className="ri-sparkling-2-fill" style={{ fontSize: 9 }} />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 whitespace-nowrap">Upcoming Events</h4>
          <Link href="/events" className="text-[10px] font-black text-[#F05A00] hover:text-[#D94F00] whitespace-nowrap">Explore</Link>
        </div>

        <div className="space-y-2.5">
          {upcomingEvents.length === 0 ? (
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 text-center">
              <i className="ri-calendar-event-line text-neutral-400 mx-auto mb-1 block" style={{ fontSize: 20 }} />
              <p className="text-[11px] text-neutral-500 font-bold whitespace-nowrap truncate">No upcoming events</p>
              <p className="text-[10px] text-neutral-400 whitespace-nowrap truncate">Host an event to start.</p>
            </div>
          ) : (
            upcomingEvents.slice(0, 3).map((evt) => (
              <div key={evt.id} className="p-3 rounded-2xl border border-neutral-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-orange-50 text-[#F05A00]">{evt.category || 'Event'}</span>
                  <span className="text-[10px] font-bold text-neutral-400">{evt.date || 'Soon'}</span>
                </div>
                <h5 className="text-xs font-black text-neutral-900 leading-snug">{evt.title}</h5>
                <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-semibold">
                  <i className="ri-map-pin-2-fill" style={{ fontSize: 11 }} />
                  <span className="truncate">{evt.location || 'Campus'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </aside>
  );
}
