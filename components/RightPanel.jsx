'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Calendar, MapPin, Sparkles, Compass, Users } from 'lucide-react';
import { getUserAvatarUrl, getCartoonAvatar } from '../utils/avatar';

export default function RightPanel({ people = [], upcomingEvents = [] }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/messages') || pathname === '/terms' || pathname === '/privacy') return null;

  const topPeople = people.slice(0, 3);

  return (
    <aside className="hidden xl:block w-[320px] fixed right-0 top-0 h-screen overflow-y-auto border-l border-zinc-100 bg-white p-6 space-y-6 select-none z-30">
      
      {/* Header Widget / Search or Greeting */}
      <div className="bg-gradient-to-br from-[#8C3573] to-[#8C3573] rounded-3xl p-5 text-white shadow-lg shadow-[#9e4685]/20">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-yellow-300 fill-current" />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#eac5e0]">Campus Spotlight</span>
        </div>
        <h3 className="text-sm font-black tracking-tight leading-snug">Connect & Explore Campus Events Today</h3>
        <p className="text-[11px] text-[#f5ebf4] mt-1 font-medium leading-relaxed">Book 1-on-1 meets or join group circles with fellow students.</p>
      </div>

      {/* People you might vibe with */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900">People You Might Vibe With</h4>
          <Link href="/discover" className="text-[10px] font-black text-[#8C3573] hover:text-[#74295d]">See all</Link>
        </div>

        <div className="space-y-2.5">
          {topPeople.length === 0 ? (
            <p className="text-[11px] text-zinc-400 font-semibold italic">No users found</p>
          ) : (
            topPeople.map((person) => (
              <Link
                key={person.id || person.uid}
                href={`/users/${person.id || person.uid}`}
                className="flex items-center justify-between p-3 rounded-2xl border border-zinc-100 hover:border-[#eac5e0] hover:bg-[#fcf6fa]/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-[#f5ebf4] flex-shrink-0 relative group-hover:scale-105 transition-transform">
                    <img 
                      src={getUserAvatarUrl(person)} 
                      alt={person.full_name || 'User'} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.target.src = getCartoonAvatar(person.full_name || person.id || 'user');
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-black text-zinc-900 truncate group-hover:text-[#8C3573] transition-colors">{person.full_name || 'Student'}</h5>
                    <p className="text-[10px] font-bold text-zinc-400 truncate">{person.year || '1st'} Year · {person.branch || 'General'}</p>
                  </div>
                </div>
                <div className="text-[10px] font-black px-3 py-1.5 rounded-full bg-[#8C3573] text-white hover:bg-[#74295d] transition-all flex-shrink-0 flex items-center gap-1">
                  Meet {person.spark_charge || 50} <Sparkles size={10} className="fill-current text-yellow-300" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900">Upcoming Events</h4>
          <Link href="/circles" className="text-[10px] font-black text-[#8C3573] hover:text-[#74295d]">Explore</Link>
        </div>

        <div className="space-y-2.5">
          {upcomingEvents.length === 0 ? (
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 text-center">
              <Calendar size={20} className="text-zinc-400 mx-auto mb-1" />
              <p className="text-[11px] text-zinc-500 font-bold">No upcoming events yet</p>
              <p className="text-[9.5px] text-zinc-400">Host your own event to get started!</p>
            </div>
          ) : (
            upcomingEvents.slice(0, 3).map((evt) => (
              <div key={evt.id} className="p-3 rounded-2xl border border-zinc-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#fcf6fa] text-[#74295d]">{evt.category || 'Event'}</span>
                  <span className="text-[10px] font-bold text-zinc-400">{evt.date || 'Soon'}</span>
                </div>
                <h5 className="text-xs font-black text-zinc-900 leading-snug">{evt.title}</h5>
                <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-semibold">
                  <MapPin size={11} />
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
