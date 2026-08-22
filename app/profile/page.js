// Profile page — Server Component. Requires login (protected by proxy).
import { getUserAdmin } from '../../lib/getUserAdmin';
import { fetchProfileAdmin } from '../../lib/firebaseAdminQueries';
import { getOrCreateWallet } from '../../lib/wallet';
import ProfileClient from './ProfileClient';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export const metadata = { title: 'Profile — meetifyy' };

export default async function ProfilePage() {
  const user = await getUserAdmin();
  if (!user) {
    redirect('/login');
  }

  const [fetchedProfile, wallet] = await Promise.all([
    fetchProfileAdmin(user.id),
    getOrCreateWallet(user.id, user.email).catch(() => null),
  ]);

  let overrides = {};
  try {
    const cookieStore = await cookies();
    const ovStr = cookieStore.get('__meetify_profile_overrides')?.value;
    if (ovStr) overrides = JSON.parse(ovStr);
  } catch (err) {}

  const profile = fetchedProfile
    ? {
        ...fetchedProfile,
        full_name: overrides.full_name || fetchedProfile.full_name,
        branch: overrides.branch || fetchedProfile.branch,
        year: overrides.year || fetchedProfile.year,
        bio: overrides.bio || fetchedProfile.bio,
        interests: overrides.interests || fetchedProfile.interests,
        university: overrides.university || fetchedProfile.university,
        photo_url: overrides.photo_url || fetchedProfile.photo_url,
      }
    : {
        id: user.id,
        uid: user.uid || user.id,
        full_name: overrides.full_name || user.full_name || user.email?.split('@')[0] || 'User',
        email: user.email,
        branch: overrides.branch || user.branch || '',
        year: overrides.year || user.year || '',
        bio: overrides.bio || user.bio || '',
        interests: overrides.interests || user.interests || [],
        university: overrides.university || user.university || '',
        role: user.role || 'user',
        isHost: user.role === 'host',
        photo_url: overrides.photo_url || user.photo_url || user.photoURL || user.picture || '',
      };

  const initialSparks =
    wallet ? (wallet.purchased || 0) + (wallet.bonus || 0) + (wallet.creator || 0) : 0;

  return <ProfileClient initialProfile={profile} initialSparks={initialSparks} />;
}

export const dynamic = 'force-dynamic';
