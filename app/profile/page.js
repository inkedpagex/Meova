// Profile page — Server Component. Requires login (protected by middleware).
import { getUserAdmin } from '../../lib/getUserAdmin';
import { fetchProfileAdmin, fetchJoinedCirclesAdmin } from '../../lib/firebaseAdminQueries';
import ProfileClient from './ProfileClient';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export const metadata = { title: 'Profile — meetifyy' };

export default async function ProfilePage() {
  const user = await getUserAdmin();
  if (!user) {
    redirect('/login');
  }

  const [fetchedProfile] = await Promise.all([
    fetchProfileAdmin(user.id)
  ]);

  let overrides = {};
  try {
    const cookieStore = await cookies();
    const ovStr = cookieStore.get('__meetify_profile_overrides')?.value;
    if (ovStr) {
      overrides = JSON.parse(ovStr);
    }
  } catch (err) {}

  const profile = fetchedProfile || {
    id: user.id,
    uid: user.uid || user.id,
    name: overrides.full_name || user.full_name || user.email?.split('@')[0] || 'User',
    full_name: overrides.full_name || user.full_name || user.email?.split('@')[0] || 'User',
    email: user.email,
    branch: overrides.branch || user.branch || 'General',
    year: overrides.year || user.year || '1st',
    bio: overrides.bio || user.bio || '',
    interests: overrides.interests || user.interests || [],
    role: user.role || 'user',
    isHost: user.role === 'host'
  };

  return (
    <ProfileClient initialProfile={profile} />
  );
}
