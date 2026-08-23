import { getUserAdmin } from '../../lib/getUserAdmin';
import { getOrCreateWallet } from '../../lib/wallet';
import ExperiencesClient from './ExperiencesClient';

export const metadata = { title: 'Discover Experiences — meetuply.in' };

export default async function ExperiencesPage() {
  const currentUser = await getUserAdmin();
  let totalSparks = 0;
  if (currentUser) {
    const wallet = await getOrCreateWallet(currentUser.id, currentUser.email);
    totalSparks = (wallet?.purchased || 0) + (wallet?.bonus || 0) + (wallet?.creator || 0);
  }

  return (
    <ExperiencesClient 
      currentUser={currentUser} 
      initialSparks={totalSparks} 
    />
  );
}

export const dynamic = 'force-dynamic';
