// Profile page — Server Component. Requires login (protected by proxy).
import { getUserAdmin } from '../../lib/getUserAdmin';
import { getOrCreateWallet } from '../../lib/wallet';
import { supabaseAdmin } from '../../lib/supabase/admin';
import ProfileClient from './ProfileClient';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export const metadata = { title: 'Profile — Meova' };

export default async function ProfilePage() {
  const user = await getUserAdmin();
  if (!user) {
    redirect('/login');
  }

  // Fast parallel execution: wallet & moments fetched in a single Promise.all
  const [wallet, postsRes] = await Promise.all([
    getOrCreateWallet(user.id, user.email).catch(() => null),
    supabaseAdmin
      .from('posts')
      .select('id, content, media_urls, likes_count, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  let overrides = {};
  try {
    const cookieStore = await cookies();
    const ovStr = cookieStore.get('__Meova_profile_overrides')?.value;
    if (ovStr) overrides = JSON.parse(ovStr);
  } catch (err) {}

  const profile = {
    ...user,
    full_name: overrides.full_name || user.full_name,
    branch: overrides.branch || user.branch,
    year: overrides.year || user.year,
    bio: overrides.bio || user.bio,
    interests: overrides.interests || user.interests,
    university: overrides.university || user.university,
    photo_url: overrides.photo_url || user.photo_url,
  };

  const initialSparks =
    wallet ? (wallet.purchased || 0) + (wallet.bonus || 0) + (wallet.creator || 0) : 0;

  return (
    <ProfileClient
      initialProfile={profile}
      initialSparks={initialSparks}
      initialPosts={postsRes?.data || []}
    />
  );
}

export const dynamic = 'force-dynamic';
