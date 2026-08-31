// Circles list page — Server Component. Public access.
import { getUserAdmin } from '../../lib/getAdminUser';
import { fetchCirclesAdmin } from '../../lib/supabaseQueries';
import CirclesList from '../../features/circles/CirclesList';

export const metadata = { title: 'Communities — Meova.in' };

export default async function CirclesPage() {
  const [user, circles] = await Promise.all([
    getUserAdmin(),
    fetchCirclesAdmin()
  ]);

  // Build the set of circles the current user has joined
  let joinedCircleIds = new Set();
  if (user) {
    circles.forEach((c) => {
      const isMember = (c.circle_members || []).some((m) => m.user_id === user.id);
      if (isMember) joinedCircleIds.add(c.id);
    });
  }

  return (
    <div className="w-full max-w-[640px] mx-auto pt-[68px] md:pt-6 pb-24 anim-fade-in px-0">
      <CirclesList circles={circles} joinedCircleIds={joinedCircleIds} userId={user?.id} />
    </div>
  );
}
