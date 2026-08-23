import { getUserAdmin } from '../../../lib/getUserAdmin';
import { getOrCreateWallet } from '../../../lib/wallet';
import ExperienceDetailClient from './ExperienceDetailClient';

export const metadata = { title: 'Experience Details — meetuply.in' };

export default async function ExperienceDetailPage({ params }) {
  // Extract id from params
  const { id } = await params;
  const currentUser = await getUserAdmin();

  let totalSparks = 0;
  if (currentUser) {
    const wallet = await getOrCreateWallet(currentUser.id, currentUser.email);
    totalSparks = (wallet?.purchased || 0) + (wallet?.bonus || 0) + (wallet?.creator || 0);
  }

  return (
    <ExperienceDetailClient 
      experienceId={id} 
      currentUser={currentUser} 
      initialSparks={totalSparks} 
    />
  );
}

export const dynamic = 'force-dynamic';
