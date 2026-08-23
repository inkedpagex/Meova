// Circles list page — Server Component. Public access.
import { getUserAdmin } from '../../lib/getAdminUser';
import { fetchCirclesAdmin } from '../../lib/firebaseAdminQueries';
import CirclesList from '../../features/circles/CirclesList';

export const metadata = { title: 'Communities — meetuply.in' };

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
    <div className="w-full max-w-[640px] mx-auto pb-24 anim-fade-in px-0">
      {circles.length === 0 ? (
        <div className="rounded-3xl p-14 text-center font-bold mt-4"
          style={{ background: '#ffffff', border: '1px solid #f0f0f0', color: '#71717a' }}>
          No communities yet. Check back soon!
        </div>
      ) : (
        <CirclesList circles={circles} joinedCircleIds={joinedCircleIds} userId={user?.id} />
      )}
    </div>
  );
}
