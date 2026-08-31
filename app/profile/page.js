// Profile page — Server Component. Requires login (protected by proxy).
import { getUserAdmin } from '../../lib/getUserAdmin';
import { fetchProfileAdmin } from '../../lib/supabaseQueries';
import { getOrCreateWallet } from '../../lib/wallet';
import ProfileClient from './ProfileClient';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export const metadata = { title: 'Profile — Meova' };

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
    const ovStr = cookieStore.get('__Meova_profile_overrides')?.value;
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

  let userGigs = [];
  try {
    const { supabaseAdmin } = await import('../../lib/supabase/admin');

    const [{ data: hostedGigs }, { data: appliedApps }, { data: postsData }] = await Promise.all([
      // Gigs hosted by this user
      supabaseAdmin
        .from('gigs')
        .select('id, title, status, created_at, host_id, author_id')
        .or(`host_id.eq.${user.id},author_id.eq.${user.id}`)
        .limit(5),
      // Gigs applied to by this user (via gig_applications)
      supabaseAdmin
        .from('gig_applications')
        .select('gig_id, created_at, gigs(id, title, status, created_at)')
        .eq('applicant_id', user.id)
        .limit(5),
      // User's own campus moments/posts
      supabaseAdmin
        .from('posts')
        .select('id, content, media_urls, likes_count, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    const hostedMapped = (hostedGigs || []).map(g => ({
      id: g.id,
      title: g.title || '',
      status: g.status || 'open',
      role: 'host',
      createdAt: g.created_at || new Date().toISOString(),
    }));

    const appliedMapped = (appliedApps || [])
      .filter(a => a.gigs)
      .map(a => ({
        id: a.gigs.id,
        title: a.gigs.title || '',
        status: a.gigs.status || 'open',
        role: 'applicant',
        createdAt: a.gigs.created_at || new Date().toISOString(),
      }));

    userGigs = Array.from(
      new Map([...hostedMapped, ...appliedMapped].map(g => [g.id, g])).values()
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

    var userPosts = postsData || [];
  } catch (err) {
    console.error('Error fetching gigs/posts for profile:', err);
  }

  return (
    <ProfileClient
      initialProfile={profile}
      initialSparks={initialSparks}
      initialGigs={userGigs}
      initialPosts={userPosts || []}
    />
  );
}

export const dynamic = 'force-dynamic';
