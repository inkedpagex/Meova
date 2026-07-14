// Profile page — Server Component. Requires login (protected by middleware).
import { getUserAdmin } from '../../lib/getUserAdmin';
import { fetchProfileAdmin, fetchJoinedCirclesAdmin } from '../../lib/firebaseAdminQueries';
import ProfileEditForm from '../../features/profile/ProfileEditForm';
import LogoutButton from '../../features/auth/LogoutButton';
import CirclesList from '../../features/circles/CirclesList';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
export const metadata = { title: 'Profile — meetify' };

export default async function ProfilePage() {
  const user = await getUserAdmin();
  if (!user) {
    redirect('/login');
  }

  const [fetchedProfile, joinedCircles] = await Promise.all([
    fetchProfileAdmin(user.id),
    fetchJoinedCirclesAdmin(user.id),
  ]);

  let overrides = {};
  try {
    const cookieStore = await cookies();
    const ovStr = cookieStore.get('__meetify_profile_overrides')?.value;
    if (ovStr) {
      overrides = JSON.parse(ovStr);
    }
  } catch (err) {}

  // Fallback to the session user data and apply any locally saved overrides
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
    role: user.role || 'user'
  };

  // Create a Set of joined circle IDs to pass to CirclesList
  const joinedCircleIds = new Set(joinedCircles.map(c => c.id));

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12 px-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] tracking-tight">Profile</h1>
          <p className="text-[10px] text-[var(--text-secondary)] mt-2 font-bold uppercase tracking-widest">Manage your personal information</p>
        </div>
        <LogoutButton />
      </div>

      <div className="bg-[var(--bg-elevated)] rounded-[2rem] border border-[var(--border-subtle)] p-6 md:p-10 shadow-lg">
        <ProfileEditForm initialProfile={profile} />
      </div>

      <section>
        <div className="flex items-center justify-between mb-6 border-b border-[var(--border-subtle)] pb-4">
          <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">
            My Circles
          </h2>
          <span className="text-[10px] font-black text-white bg-[var(--accent)] px-3 py-1 rounded-full">
            {joinedCircles.length} joined
          </span>
        </div>

        {joinedCircles.length === 0 ? (
          <div className="bg-[var(--bg-elevated)] rounded-3xl border border-[var(--border-subtle)] p-12 text-center text-[var(--text-muted)] font-bold">
            You haven't joined any circles yet.
          </div>
        ) : (
          <CirclesList circles={joinedCircles} joinedCircleIds={joinedCircleIds} userId={user.id} />
        )}
      </section>
    </div>
  );
}
