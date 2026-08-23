import { requireAdmin } from '../../lib/getAdminUser';
import { redirect } from 'next/navigation';
import AdminHeaderClient from './AdminHeaderClient';

export default async function AdminLayout({ children }) {
  const admin = await requireAdmin();
  if (!admin) redirect('/');

  return (
    <div className="space-y-4 md:space-y-6 min-w-0 overflow-x-hidden">
      {/* ── TOP HEADER BAR ────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 md:p-4 shadow-2xs space-y-3 min-w-0">
        <AdminHeaderClient admin={admin} />
      </div>

      {/* Main Page Content */}
      <div className="min-w-0">
        {children}
      </div>
    </div>
  );
}
