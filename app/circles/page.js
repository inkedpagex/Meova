// Circles list page — Server Component. Public access.
import { getUserAdmin } from '../../lib/getAdminUser';
import { fetchCirclesAdmin } from '../../lib/supabaseQueries';
import CirclesList from '../../features/circles/CirclesList';

export const metadata = {
  title: 'Student Circles & Campus Communities | Meova — GLA University',
  description: 'Join student circles and campus communities at GLA University on Meova. Tech, design, sports, cultural — find your tribe, collaborate, and grow together.',
  keywords: [
    'GLA University communities', 'student circles GLA', 'college clubs Mathura',
    'campus community app', 'student groups GLA University', 'college networking circles',
    'meetify alternative GLA', 'meetifyy alternative GLA', 'campus clubs GLA'
  ],
  alternates: { canonical: 'https://meova.in/circles' },
  openGraph: {
    title: 'Student Circles & Communities | Meova',
    description: 'Join GLA University student circles — tech, sports, design and more on Meova.',
    url: 'https://meova.in/circles',
    siteName: 'Meova',
    images: [{ url: '/icon-512.png', width: 512, height: 512 }],
  },
};

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
