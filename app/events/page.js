import { getUserAdmin } from '../../lib/getUserAdmin';
import { fetchUpcomingEventsAdmin } from '../../lib/firebaseAdminQueries';
import Link from 'next/link';
import { Calendar, MapPin, Users, Filter } from 'lucide-react';

export const metadata = { title: 'Events — meetuply' };

function EventCard({ event, userId }) {
  const going = (event.rsvps_list || []).length;
  const date = new Date(event.date);
  const isRsvp = userId && (event.rsvps_list || []).some(r => r.user_id === userId);

  return (
    <div className="card overflow-hidden group cursor-pointer"
      style={{ background:'var(--bg-surface)', borderRadius:16, border:'1px solid var(--border-subtle)' }}>
      {/* Cover image */}
      <div style={{ height:140, background:'var(--bg-overlay)', position:'relative', overflow:'hidden' }}>
        {event.image_url ? (
          <img src={event.image_url} alt={event.title}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
            loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar size={32} style={{ color:'var(--text-faint)' }} />
          </div>
        )}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />

        {/* Date badge */}
        <div className="glass absolute top-3 right-3 text-center" style={{ borderRadius:10, padding:'6px 10px', minWidth:44 }}>
          <p style={{ fontSize:11, fontWeight:800, color:'var(--text-primary)', lineHeight:1 }}>
            {date.toLocaleDateString('en-US', { day:'numeric' })}
          </p>
          <p style={{ fontSize:9, fontWeight:600, color:'var(--text-secondary)', lineHeight:1, marginTop:2 }}>
            {date.toLocaleDateString('en-US', { month:'short' })}
          </p>
        </div>

        {/* Circle name */}
        <div className="absolute bottom-3 left-3">
          <span className="tag tag-neutral" style={{ fontSize:10 }}>{event.circle_name}</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:'14px 16px 16px' }}>
        <h3 style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)', lineHeight:1.35, marginBottom:8 }} className="line-clamp-2">
          {event.title}
        </h3>

        <div className="flex items-center gap-4" style={{ marginBottom:12 }}>
          {event.location && (
            <span className="flex items-center gap-1.5" style={{ fontSize:11.5, color:'var(--text-muted)' }}>
              <MapPin size={11} /> {event.location.split(',')[0]}
            </span>
          )}
          <span className="flex items-center gap-1.5" style={{ fontSize:11.5, color:'var(--text-muted)' }}>
            <Users size={11} /> {going} going
          </span>
        </div>

        <button className={`btn w-full justify-center ${isRsvp ? 'btn-ghost' : 'btn-outline'}`}
          style={{ fontSize:12, padding:'9px 16px' }}>
          {isRsvp ? 'Going ✓' : 'RSVP'}
        </button>
      </div>
    </div>
  );
}

export default async function EventsPage() {
  const user = await getUserAdmin();
  const events = await fetchUpcomingEventsAdmin(30);

  return (
    <div style={{ maxWidth: 860 }} className="anim-fade-in">
      <div className="flex items-end justify-between" style={{ marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.04em', color:'var(--text-primary)' }}>Events</h1>
          <p style={{ fontSize:13, color:'var(--text-secondary)', marginTop:4 }}>
            {events.length} upcoming events on campus
          </p>
        </div>
        <button className="btn btn-ghost flex items-center gap-2" style={{ fontSize:12 }}>
          <Filter size={13} /> Filter
        </button>
      </div>

      {events.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Calendar size={40} className="mx-auto mb-4" style={{ color:'var(--text-faint)' }} />
          <p style={{ color:'var(--text-muted)', fontWeight:500 }}>No upcoming events</p>
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
