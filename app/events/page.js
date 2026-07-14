import { getUserAdmin } from '../../lib/getAdminUser';
import { fetchUpcomingEventsAdmin } from '../../lib/firebaseAdminQueries';
import Link from 'next/link';
import { Calendar, MapPin, Users, Filter, Clock } from 'lucide-react';

export const metadata = { title: 'Events — meetuply' };

function EventCard({ event, userId }) {
  const going = (event.rsvps_list || []).length;
  const date = new Date(event.date);
  const isRsvp = userId && (event.rsvps_list || []).some(r => r.user_id === userId);

  return (
    <div className="group relative flex flex-col bg-white/[0.02] border border-white/[0.06] rounded-[1.5rem] p-4 hover:bg-white/[0.04] transition-all duration-300 overflow-hidden cursor-pointer h-full">
      {/* Cover image */}
      <div className="relative h-40 rounded-2xl overflow-hidden bg-neutral-900 border border-white/5 mb-4 shrink-0">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-900/40 to-black group-hover:scale-110 transition-transform duration-700">
            <Calendar size={36} className="text-emerald-500/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Date badge */}
        <div className="absolute top-3 right-3 bg-white/10 backdrop-blur-md border border-white/20 text-center rounded-[0.8rem] px-3 py-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <p className="text-[13px] font-black text-white leading-none tracking-tight">
            {date.toLocaleDateString('en-US', { day:'numeric' })}
          </p>
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-0.5">
            {date.toLocaleDateString('en-US', { month:'short' })}
          </p>
        </div>

        {/* Circle tag */}
        <div className="absolute bottom-3 left-3 bg-white/10 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold px-2.5 py-1 rounded-md">
          {event.circle_name}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 px-1">
        <h3 className="text-[16px] font-extrabold text-white leading-snug mb-3 group-hover:text-emerald-400 transition-colors line-clamp-2">
          {event.title}
        </h3>

        <div className="flex flex-col gap-2 mb-5 mt-auto">
          {event.location && (
            <span className="flex items-center gap-2 text-[12px] font-medium text-neutral-400">
              <MapPin className="w-[14px] h-[14px] text-neutral-500" /> {event.location.split(',')[0]}
            </span>
          )}
          {event.time && (
            <span className="flex items-center gap-2 text-[12px] font-medium text-neutral-400">
              <Clock className="w-[14px] h-[14px] text-neutral-500" /> {event.time}
            </span>
          )}
          <span className="flex items-center gap-2 text-[12px] font-medium text-neutral-400 mt-0.5">
            <Users className="w-[14px] h-[14px] text-neutral-500" /> <span className="text-white">{going}</span> going
          </span>
        </div>

        <button className={`w-full font-bold text-[13px] py-3 rounded-xl flex items-center justify-center transition-all ${
          isRsvp 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
            : 'bg-white text-black hover:bg-neutral-200 hover:scale-[1.02] active:scale-95'
        }`}>
          {isRsvp ? 'Going ✓' : 'RSVP Now'}
        </button>
      </div>
    </div>
  );
}

export default async function EventsPage() {
  const user = await getUserAdmin();
  const events = await fetchUpcomingEventsAdmin(30);

  return (
    <div className="w-full max-w-[900px] mx-auto pb-24 anim-fade-in">
      {/* Header (Dark Glass) */}
      <div className="relative overflow-hidden mb-8 rounded-b-[2.5rem] border-b border-white/[0.04]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-black z-0" />
        <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] z-0 pointer-events-none" />
        <div className="relative z-10 px-6 pt-10 pb-8 flex items-end justify-between">
          <div>
            <h1 className="text-[32px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400 tracking-tight leading-tight">
              Events
            </h1>
            <p className="text-[14px] text-neutral-400 mt-2 font-medium">
              {events.length} upcoming events on campus.
            </p>
          </div>
          <button className="hidden sm:flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white text-[13px] font-bold px-4 py-2.5 rounded-full transition-all">
            <Filter size={15} /> Filter
          </button>
        </div>
      </div>

      <div className="px-4">
        <div className="sm:hidden mb-6 flex justify-end">
          <button className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white text-[13px] font-bold px-4 py-2.5 rounded-full transition-all">
            <Filter size={15} /> Filter
          </button>
        </div>

        {events.length === 0 ? (
          <div className="rounded-[1.5rem] bg-white/[0.02] border border-white/[0.04] p-16 text-center">
            <Calendar size={48} className="mx-auto mb-5 text-neutral-700" />
            <p className="text-white font-bold text-[16px]">No upcoming events</p>
            <p className="text-neutral-500 text-[14px] mt-2">Check back later or host your own event.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map(ev => (
              <EventCard key={ev.id} event={ev} userId={user?.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
