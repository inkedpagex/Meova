// Circles list page — Server Component. Public access.
import { getUserAdmin } from '../../lib/getUserAdmin';
import { fetchCirclesAdmin } from '../../lib/firebaseAdminQueries';
import CirclesList from '../../features/circles/CirclesList';

export const metadata = { title: 'Circles — meetify' };

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
    <div className="w-full max-w-3xl mx-auto">
      {/* Editorial Header */}
      <div className="mb-10">
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-[11px] font-black text-neutral-500 tracking-[0.18em] uppercase">
            Campus
          </span>
          <div className="h-px flex-1 bg-white/[0.05]" />
          <span className="text-[11px] font-bold text-neutral-600">
            {circles.length} circles
          </span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">
          Find your tribe.
        </h1>
        <p className="text-sm text-neutral-500 mt-2 font-medium">
          Join communities that match your vibe and make campus life count.
        </p>
      </div>

      {circles.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.04] p-14 text-center text-neutral-600 font-medium text-sm">
          No circles yet. Check back soon!
        </div>
      ) : (
        <CirclesList circles={circles} joinedCircleIds={joinedCircleIds} userId={user?.id} />
      )}
    </div>
  );
}
