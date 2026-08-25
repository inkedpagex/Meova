import { requireAdmin } from '../../lib/getAdminUser';
import { redirect } from 'next/navigation';
import AdminClient from './AdminClient';

export const metadata = { title: 'Admin Dashboard — Meova' };

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) redirect('/');

  return <AdminClient />;
}
