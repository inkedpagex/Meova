// Circles list page — Server Component. Public access.
import { getUserAdmin } from '../../lib/getAdminUser';
import { fetchCirclesAdmin } from '../../lib/firebaseAdminQueries';
import CirclesList from '../../features/circles/CirclesList';

export const metadata = { title: 'Communities — meetifyy.in' };

export default async function CirclesPage() {
  const user = await getUserAdmin();
  const circles = await fetchCirclesAdmin();

  // Build the set of circles the current user has joined
  let joinedCircleIds = new Set();
  if (user) {
    circles.forEach((c) => {
      const isMember = (c.circle_members || []).some((m) => m.user_id === user.id);
      if (isMember) joinedCircleIds.add(c.id);
    });
  }

  return (
    <div className="w-full max-w-[800px] mx-auto pb-24 anim-fade-in px-4">
      {/* Header */}
      <div className="relative overflow-hidden mb-6 border-b border-[var(--border-subtle)] pt-6 pb-4">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            Communities
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-bold mt-1 uppercase tracking-widest">
            Find your tribe. {circles.length} communities on campus.
          </p>
        </div>
      </div>

      {circles.length === 0 ? (
        <div className="rounded-[1.5rem] bg-white/[0.02] border border-white/[0.04] p-14 text-center text-neutral-500 font-bold mx-4">
          No circles yet. Check back soon!
        </div>
      ) : (
        <CirclesList circles={circles} joinedCircleIds={joinedCircleIds} userId={user?.id} />
      )}
    </div>
  );
}
