// Circle detail page — Server Component. Public access.
import { getUserAdmin } from '../../../lib/getUserAdmin';
import {
  fetchCircleDetailAdmin,
  fetchCircleMembersAdmin,
  fetchCircleEventsAdmin,
} from '../../../lib/firebaseAdminQueries';
import CircleJoinButton from '../../../features/circles/CircleJoinButton';
import RsvpButton from '../../../features/events/RsvpButton';
import { ArrowLeft, Users, Send, Calendar, MapPin } from 'lucide-react';
import Link from 'next/link';
import { formatEventDate } from '../../../utils/dateFormatter';
import { CircleAvatar } from '../../../components/CircleAvatar';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const circle = await fetchCircleDetailAdmin(id).catch(() => null);
  return { title: circle ? `${circle.name} — meetify` : 'Circle — meetify' };
}

export default async function CircleDetailPage({ params }) {
  const { id } = await params;
  const user = await getUserAdmin();

  const [circle, members, events] = await Promise.all([
    fetchCircleDetailAdmin(id),
    fetchCircleMembersAdmin(id),
    fetchCircleEventsAdmin(id),
  ]);

  const isJoined = user
    ? (circle.circle_members || []).some((m) => m.user_id === user.id)
    : false;

  const getInitials = (name) =>
    name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Back */}
      <Link
        href="/circles"
        className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-8 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-4 py-2 rounded-full shadow-sm"
      >
        <ArrowLeft size={14} /> Back to Circles
      </Link>

      {/* Circle Header */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[2rem] p-8 md:p-12 mb-10 shadow-lg relative overflow-hidden">
        {/* Decorative backdrop glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#6366f1]/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="flex flex-col items-center text-center relative z-10">
          <div className="w-24 h-24 rounded-3xl overflow-hidden border border-[var(--border-subtle)] mb-6 shadow-md">
            <CircleAvatar name={circle.name} size={96} radius="1.5rem" />
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] mb-2 tracking-tight">{circle.name}</h1>
          <span className="text-[9px] text-white font-black uppercase tracking-wider bg-[var(--accent)] px-3 py-1 rounded-full mb-6 inline-block">
            {circle.category}
          </span>
          <p className="text-xs md:text-sm text-[var(--text-secondary)] max-w-lg mb-8 leading-relaxed font-bold uppercase tracking-wide">{circle.description}</p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-sm">
            <div className="flex-1">
              <CircleJoinButton
                circleId={circle.id}
                userId={user?.id}
                isInitialMember={isJoined}
              />
            </div>
            {circle.whatsapp_link && (
              <a
                href={circle.whatsapp_link}
                target="_blank"
                rel="noreferrer"
                className="bg-transparent border border-[var(--border-mid)] hover:border-[var(--text-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-black py-3 px-6 rounded-xl text-xs flex items-center justify-center gap-2 transition-all uppercase tracking-widest"
              >
                <Send size={14} /> WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Members */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
              <Users size={18} className="text-[var(--text-secondary)]" /> Members
            </h2>
            <span className="text-[10px] font-black text-white bg-[var(--accent)] px-3 py-1 rounded-full">{members.length}</span>
          </div>
          
          {members.length === 0 ? (
            <div className="bg-[var(--bg-elevated)] rounded-3xl border border-[var(--border-subtle)] p-8 text-center text-[var(--text-muted)] text-sm font-bold">
              No members yet. Be the first!
            </div>
          ) : (
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-3xl p-5 grid grid-cols-1 gap-3 shadow-md">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 bg-[var(--bg-base)] p-3 rounded-2xl border border-[var(--border-subtle)] hover:border-[var(--border-mid)] transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6366f1] to-[#c084fc] text-white text-xs font-black flex items-center justify-center flex-shrink-0 shadow-md">
                    {getInitials(member.full_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-[var(--text-primary)] truncate">{member.full_name}</p>
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest block mt-0.5">{member.year} · {member.branch}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Events */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
              <Calendar size={18} className="text-[var(--text-secondary)]" /> Events
            </h2>
            <span className="text-[10px] font-black text-white bg-[var(--accent)] px-3 py-1 rounded-full">{events.length}</span>
          </div>

          {events.length === 0 ? (
            <div className="bg-[var(--bg-elevated)] rounded-3xl border border-[var(--border-subtle)] p-8 text-center text-[var(--text-muted)] text-sm font-bold">
              No events for this circle yet.
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const isRsvp = user
                  ? (event.rsvps_list || []).some((r) => r.user_id === user.id)
                  : false;
                return (
                  <div key={event.id} className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-3xl p-5 hover:border-[var(--accent)]/30 transition-colors group shadow-md">
                    <div className="mb-4">
                      <h3 className="text-base font-black text-[var(--text-primary)] mb-2 leading-snug group-hover:text-[#818cf8] transition-colors">{event.title}</h3>
                      <p className="text-xs text-[var(--text-secondary)] mb-4 line-clamp-2 leading-relaxed">{event.description}</p>
                      <div className="space-y-1.5 text-[10px] text-[var(--text-muted)] font-bold border-l-2 border-[var(--border-mid)] pl-3 uppercase tracking-wider">
                        <div className="flex items-center gap-2"><Calendar size={11} className="text-[#818cf8]" /> {formatEventDate(event.date)}</div>
                        {event.location && <div className="flex items-center gap-2"><MapPin size={11} className="text-[#818cf8]" /> {event.location}</div>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
                      <span className="text-[9px] text-[var(--accent)] bg-[var(--accent-glow)] border border-[var(--accent-dim)] px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                        {(event.rsvps_list || []).length} going
                      </span>
                      <RsvpButton eventId={event.id} userId={user?.id} isInitialRsvp={isRsvp} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
