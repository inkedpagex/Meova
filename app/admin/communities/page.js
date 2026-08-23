import { requireAdmin } from '../../../lib/getAdminUser';
import { redirect } from 'next/navigation';
import PendingCommunitiesClient from './PendingCommunitiesClient';

export const metadata = { title: 'Pending Communities — Admin' };

export default async function AdminCommunitiesPage() {
  const admin = await requireAdmin();
  if (!admin) redirect('/');

  return <PendingCommunitiesClient />;
}
