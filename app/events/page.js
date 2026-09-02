import { getUserAdmin } from '../../lib/getAdminUser';
import { fetchUpcomingEventsAdmin } from '../../lib/supabaseQueries';
import Link from 'next/link';
import { Calendar, MapPin, Users, Clock, Zap, Music, Code, Trophy, BookOpen, Palette, Mic } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Events — Meova' };

// Category → premium gradient + icon
const CATEGORY_THEMES = {
  tech:        { from: '#F05A00', to: '#F05A00', icon: Code,    label: 'Tech' },
  music:       { from: '#db2777', to: '#ec4899', icon: Music,   label: 'Music' },
  gaming:      { from: '#0ea5e9', to: '#D94F00', icon: Trophy,  label: 'Gaming' },
  study:       { from: '#10b981', to: '#059669', icon: BookOpen, label: 'Study' },
  art:         { from: '#f97316', to: '#ef4444', icon: Palette, label: 'Art' },
  talk:        { from: '#8b5cf6', to: '#D94F00', icon: Mic,     label: 'Talk' },
  default:     { from: '#F05A00', to: '#D94F00', icon: Zap,     label: 'Event' },
};

function getTheme(event) {
  const cat = (event.category || event.circle_name || '').toLowerCase();
  if (cat.includes('tech') || cat.includes('web') || cat.includes('code') || cat.includes('blockchain') || cat.includes('developer')) return CATEGORY_THEMES.tech;
  if (cat.includes('music') || cat.includes('jam') || cat.includes('acoustic')) return CATEGORY_THEMES.music;
  if (cat.includes('game') || cat.includes('gaming') || cat.includes('esport')) return CATEGORY_THEMES.gaming;
  if (cat.includes('study') || cat.includes('learn') || cat.includes('book')) return CATEGORY_THEMES.study;
  if (cat.includes('art') || cat.includes('design') || cat.includes('photo')) return CATEGORY_THEMES.art;
  if (cat.includes('talk') || cat.includes('seminar') || cat.includes('speaker')) return CATEGORY_THEMES.talk;
  return CATEGORY_THEMES.default;
}

function EventCard({ event, userId }) {
  const going = (event.rsvps_list || []).length;
  const date = new Date(event.date);
  const isRsvp = userId && (event.rsvps_list || []).some(r => r.user_id === userId);
  const theme = getTheme(event);
  const ThemeIcon = theme.icon;

  const day   = date.toLocaleDateString('en-US', { day: 'numeric' });
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

  return (
    <div className="group relative flex flex-col bg-white border border-zinc-100 rounded-[2rem] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">

      {/* ── Premium Banner ── */}
      <div className="relative h-44 overflow-hidden shrink-0">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
          />
        ) : (
          // Rich gradient placeholder instead of plain gray
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-3"
            style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}
          >
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <ThemeIcon size={26} className="text-white" strokeWidth={2} />
            </div>
            <span className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em]">
              {theme.label}
            </span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Date badge — top right */}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md text-center rounded-2xl px-3 py-2 shadow-md min-w-[44px]">
          <p className="text-[15px] font-black text-zinc-950 leading-none">{day}</p>
          <p className="text-[9px] font-black uppercase tracking-widest mt-0.5" style={{ color: theme.from }}>{month}</p>
        </div>

        {/* Circle tag — bottom left */}
        <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md text-white text-[9px] font-black px-2.5 py-1.5 rounded-full uppercase tracking-wider border border-white/20">
          {event.circle_name}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col flex-1 p-4">
        {/* Weekday pill */}
        <span
          className="self-start text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-2"
          style={{ background: `${theme.from}15`, color: theme.from }}
        >
          {weekday}
        </span>

        <h3 className="text-[15px] font-black text-zinc-950 leading-snug mb-3 group-hover:text-[#D94F00] transition-colors line-clamp-2">
          {event.title}
        </h3>

        <div className="flex flex-col gap-1.5 mb-4">
          {event.time && (
            <span className="flex items-center gap-2 text-[11px] font-semibold text-zinc-500">
              <Clock className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" /> {event.time}
            </span>
          )}
          {event.location && (
            <span className="flex items-center gap-2 text-[11px] font-semibold text-zinc-500">
              <MapPin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" /> {event.location.split(',')[0]}
            </span>
          )}
          <span className="flex items-center gap-2 text-[11px] font-semibold text-zinc-500">
            <Users className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
            <span className="text-zinc-900 font-black">{going}</span> going
          </span>
        </div>

        {/* Clean Event Tag CTA */}
        <div className="mt-auto">
          <div
            className="w-full py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest text-center text-white transition-all group-hover:opacity-90 active:scale-95"
            style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}
          >
            Explore Event
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function EventsPage() {
  const user = await getUserAdmin();
  const events = await fetchUpcomingEventsAdmin(30);

  return (
    <div className="w-full max-w-[900px] mx-auto pt-[68px] md:pt-6 pb-24 anim-fade-in px-4">

      {/* ── Header ── */}
      <div className="pt-6 pb-5 mb-6 border-b border-zinc-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-zinc-950 tracking-tight">Events</h1>
            <p className="text-[11px] text-zinc-400 font-bold mt-1 uppercase tracking-widest">
              {events.length > 0 ? `${events.length} upcoming on campus` : 'No upcoming events'}
            </p>
          </div>
          {/* Category filter chips — premium look, no ugly button */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {['All', 'Tech', 'Music', 'Gaming'].map((f) => (
              <span
                key={f}
                className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border cursor-pointer transition-all ${
                  f === 'All'
                    ? 'bg-zinc-950 text-white border-zinc-950'
                    : 'bg-white text-zinc-400 border-zinc-200 hover:border-zinc-400 hover:text-zinc-700'
                }`}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      {events.length === 0 ? (
        <div className="rounded-2xl bg-white border border-zinc-100 p-16 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-5">
            <Calendar size={28} className="text-[#F05A00]" />
          </div>
          <p className="text-zinc-900 font-black text-[16px]">No upcoming events</p>
          <p className="text-zinc-400 text-[13px] font-medium mt-2">Check back later or host your own.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map(ev => (
            <EventCard key={ev.id} event={ev} userId={user?.id} />
          ))}
        </div>
      )}
    </div>
  );
}
