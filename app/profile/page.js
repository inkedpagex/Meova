// Profile page — Server Component. Requires login (protected by middleware).
import { getUserAdmin } from '../../lib/getUserAdmin';
import { fetchProfileAdmin, fetchJoinedCirclesAdmin } from '../../lib/firebaseAdminQueries';
import ProfileEditForm from '../../features/profile/ProfileEditForm';
import LogoutButton from '../../features/auth/LogoutButton';
import CirclesList from '../../features/circles/CirclesList';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Profile — meetify' };

export default async function ProfilePage() {
  const user = await getUserAdmin();
  if (!user) {
    redirect('/login');
  }

  const [profile, joinedCircles] = await Promise.all([
    fetchProfileAdmin(user.id),
    fetchJoinedCirclesAdmin(user.id),
  ]);

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <p className="text-[#888888] mb-4 font-medium">Profile not found. Please log in again.</p>
        <LogoutButton />
      </div>
    );
  }

  // Create a Set of joined circle IDs to pass to CirclesList
  const joinedCircleIds = new Set(joinedCircles.map(c => c.id));

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#222222] pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Profile</h1>
          <p className="text-[10px] text-[#666666] mt-2 font-bold uppercase tracking-widest">Manage your personal information</p>
        </div>
        <LogoutButton />
      </div>

      <div className="bg-[#0a0a0a] rounded-[2rem] border border-[#222222] p-6 md:p-10">
        <ProfileEditForm initialProfile={profile} />
      </div>

      <section>
        <div className="flex items-center justify-between mb-6 border-b border-[#222222] pb-4">
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            My Circles
          </h2>
          <span className="text-[10px] font-bold text-black bg-white px-3 py-1 rounded-full">
            {joinedCircles.length} joined
          </span>
        </div>

        {joinedCircles.length === 0 ? (
          <div className="bg-[#111111] rounded-3xl border border-[#222222] p-12 text-center text-[#555555] font-medium">
            You haven't joined any circles yet.
          </div>
        ) : (
          <CirclesList circles={joinedCircles} joinedCircleIds={joinedCircleIds} userId={user.id} />
        )}
      </section>
    </div>
  );
}
