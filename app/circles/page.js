// Circles list page — Server Component. Public access.
import { getUserAdmin } from '../../lib/getAdminUser';
import { fetchCirclesAdmin } from '../../lib/firebaseAdminQueries';
import CirclesList from '../../features/circles/CirclesList';

export const metadata = { title: 'Communities — meetify' };

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
    <div className="w-full max-w-[800px] mx-auto pb-24 anim-fade-in">
      {/* Header (Dark Glass) */}
      <div className="relative overflow-hidden mb-6 rounded-b-[2.5rem] border-b border-white/[0.04]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-black z-0" />
        <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] z-0 pointer-events-none" />
        <div className="relative z-10 px-6 pt-10 pb-8">
          <h1 className="text-[32px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400 tracking-tight leading-tight">
            Communities
          </h1>
          <p className="text-[14px] text-neutral-400 mt-2 font-medium">
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
