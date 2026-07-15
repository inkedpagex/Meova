import { requireAdmin } from '../../lib/getAdminUser';
import { redirect } from 'next/navigation';
import AdminClient from './AdminClient';

export const metadata = { title: 'Admin — meetuply' };

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) redirect('/');

  return (
    <div className="anim-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>Admin Dashboard</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Manage verification records, escrow details, and withdraw payouts.</p>
      </div>

      <AdminClient />
    </div>
  );
}
