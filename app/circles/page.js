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
    <div className="w-full max-w-[600px] mx-auto pb-20">
      {/* Sleek App-style Header */}
      <div className="sticky top-0 z-10 bg-[#000000]/80 backdrop-blur-md border-b border-white/[0.08] px-4 py-3 flex items-center justify-between">
        <h1 className="text-[17px] font-bold text-white tracking-tight">
          Find your tribe
        </h1>
        <span className="text-[13px] font-medium text-neutral-500">
          {circles.length} circles
        </span>
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
