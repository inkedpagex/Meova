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
    <div className="w-full max-w-4xl mx-auto">
      {/* Back */}
      <Link
        href="/circles"
        className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[#888888] hover:text-white transition-colors mb-8 bg-[#111111] border border-[#222222] px-4 py-2 rounded-full"
      >
        <ArrowLeft size={14} /> Back to Circles
      </Link>

      {/* Circle Header */}
      <div className="bg-[#0a0a0a] border border-[#222222] rounded-[2rem] p-8 md:p-12 mb-10">
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-3xl overflow-hidden border border-[#333333] mb-6">
            <CircleAvatar name={circle.name} size={96} radius="1.5rem" />
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2 tracking-tight">{circle.name}</h1>
          <span className="text-[10px] text-black font-extrabold uppercase tracking-widest bg-white px-4 py-1.5 rounded-full mb-6 inline-block">
            {circle.category}
          </span>
          <p className="text-sm md:text-base text-[#888888] max-w-lg mb-8 leading-relaxed font-medium">{circle.description}</p>

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
                className="bg-transparent border border-[#333333] hover:border-white hover:bg-[#111111] text-white font-extrabold py-3 px-6 rounded-xl text-xs flex items-center justify-center gap-2 transition-all uppercase tracking-widest"
              >
                <Send size={16} /> WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Members */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Users size={18} className="text-[#888888]" /> Members
            </h2>
            <span className="text-[10px] font-bold text-black bg-white px-3 py-1 rounded-full">{members.length}</span>
          </div>
          
          {members.length === 0 ? (
            <div className="bg-[#111111] rounded-3xl border border-[#222222] p-8 text-center text-[#555555] text-sm font-medium">
              No members yet. Be the first!
            </div>
          ) : (
            <div className="bg-[#0a0a0a] border border-[#222222] rounded-3xl p-5 grid grid-cols-1 gap-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 bg-[#111111] p-3 rounded-2xl border border-[#222222] hover:border-[#333333] transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-black border border-[#333333] text-white text-sm font-black flex items-center justify-center flex-shrink-0">
                    {getInitials(member.full_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-white truncate">{member.full_name}</p>
                    <span className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block mt-0.5">{member.year} · {member.branch}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Events */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Calendar size={18} className="text-[#888888]" /> Events
            </h2>
            <span className="text-[10px] font-bold text-black bg-white px-3 py-1 rounded-full">{events.length}</span>
          </div>

          {events.length === 0 ? (
            <div className="bg-[#111111] rounded-3xl border border-[#222222] p-8 text-center text-[#555555] text-sm font-medium">
              No events for this circle yet.
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const isRsvp = user
                  ? (event.rsvps_list || []).some((r) => r.user_id === user.id)
                  : false;
                return (
                  <div key={event.id} className="bg-[#0a0a0a] border border-[#222222] rounded-3xl p-5 hover:border-[#444444] transition-colors group">
                    <div className="mb-4">
                      <h3 className="text-base font-extrabold text-white mb-2 leading-snug group-hover:text-gray-300 transition-colors">{event.title}</h3>
                      <p className="text-xs text-[#888888] mb-4 line-clamp-2 leading-relaxed">{event.description}</p>
                      <div className="space-y-1.5 text-[11px] text-[#666666] font-semibold border-l-2 border-[#222222] pl-3">
                        <div className="flex items-center gap-2"><Calendar size={12} className="text-[#444444]" /> {formatEventDate(event.date)}</div>
                        {event.location && <div className="flex items-center gap-2"><MapPin size={12} className="text-[#444444]" /> {event.location}</div>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#222222] pt-4">
                      <span className="text-[10px] text-black bg-white px-2 py-0.5 rounded-full font-bold">
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
