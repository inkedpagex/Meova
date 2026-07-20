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
    <div className="group relative flex flex-col bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[2rem] p-4 hover:bg-[var(--bg-hover)] transition-all duration-300 overflow-hidden cursor-pointer h-full shadow-md">
      {/* Cover image */}
      <div className="relative h-40 rounded-2xl overflow-hidden bg-[var(--bg-base)] border border-[var(--border-subtle)] mb-4 shrink-0">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--accent-dim)] to-[var(--bg-elevated)] group-hover:scale-110 transition-transform duration-700">
            <Calendar size={36} className="text-[var(--accent)]/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Date badge */}
        <div className="absolute top-3 right-3 bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] text-center rounded-[0.8rem] px-3 py-1.5 shadow-sm">
          <p className="text-[13px] font-black text-[var(--text-primary)] leading-none tracking-tight">
            {date.toLocaleDateString('en-US', { day:'numeric' })}
          </p>
          <p className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest mt-0.5">
            {date.toLocaleDateString('en-US', { month:'short' })}
          </p>
        </div>

        {/* Circle tag */}
        <div className="absolute bottom-3 left-3 bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] text-[var(--text-primary)] text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
          {event.circle_name}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 px-1">
        <h3 className="text-[15px] font-black text-[var(--text-primary)] leading-snug mb-3 group-hover:text-[var(--accent)] transition-colors line-clamp-2">
          {event.title}
        </h3>

        <div className="flex flex-col gap-2 mb-5 mt-auto">
          {event.location && (
            <span className="flex items-center gap-2 text-[12px] font-semibold text-[var(--text-secondary)]">
              <MapPin className="w-[14px] h-[14px] text-[var(--text-muted)]" /> {event.location.split(',')[0]}
            </span>
          )}
          {event.time && (
            <span className="flex items-center gap-2 text-[12px] font-semibold text-[var(--text-secondary)]">
              <Clock className="w-[14px] h-[14px] text-[var(--text-muted)]" /> {event.time}
            </span>
          )}
          <span className="flex items-center gap-2 text-[12px] font-semibold text-[var(--text-secondary)] mt-0.5">
            <Users className="w-[14px] h-[14px] text-[var(--text-muted)]" /> <span className="text-[var(--text-primary)]">{going}</span> going
          </span>
        </div>

        <button className={`w-full font-black text-[11px] py-3.5 rounded-xl uppercase tracking-widest flex items-center justify-center transition-all ${
          isRsvp 
            ? 'bg-[var(--accent-dim)] text-[var(--accent)] border border-[var(--accent-glow)]' 
            : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] hover:scale-[1.02] active:scale-95'
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
    <div className="w-full max-w-[900px] mx-auto pb-24 anim-fade-in px-4">
      {/* Header */}
      <div className="relative overflow-hidden mb-8 border-b border-[var(--border-subtle)] pt-6 pb-4 flex items-end justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            Events
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-bold mt-1 uppercase tracking-widest">
            {events.length} upcoming events on campus.
          </p>
        </div>
        <button className="hidden sm:flex items-center gap-2 bg-[var(--bg-overlay)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-[12px] font-bold px-4 py-2.5 rounded-xl transition-all">
          <Filter size={15} /> Filter
        </button>
      </div>

      <div>
        <div className="sm:hidden mb-6 flex justify-end">
          <button className="flex items-center gap-2 bg-[var(--bg-overlay)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-[12px] font-bold px-4 py-2.5 rounded-xl transition-all">
            <Filter size={15} /> Filter
          </button>
        </div>

        {events.length === 0 ? (
          <div className="rounded-[2rem] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-16 text-center shadow-lg">
            <Calendar size={48} className="mx-auto mb-5 text-[var(--text-muted)]" />
            <p className="text-[var(--text-primary)] font-bold text-[16px]">No upcoming events</p>
            <p className="text-[var(--text-secondary)] text-[14px] mt-2">Check back later or host your own event.</p>
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
