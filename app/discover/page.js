import { getUserAdmin } from '../../lib/getUserAdmin';
import { fetchUsersAdmin, fetchCirclesAdmin } from '../../lib/firebaseAdminQueries';
import DiscoverClient from './DiscoverClient';

export const metadata = { title: 'Discover — meetuply' };

export default async function DiscoverPage() {
  const currentUser = await getUserAdmin();
  const [users, circles] = await Promise.all([
    fetchUsersAdmin(50),
    fetchCirclesAdmin(),
  ]);

  const people = currentUser ? users.filter(u => u.id !== currentUser.id) : users;

  return <DiscoverClient people={people} circles={circles} currentUser={currentUser} />;
}
