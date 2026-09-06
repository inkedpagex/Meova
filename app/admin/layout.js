import { requireAdmin } from '../../lib/getAdminUser';
import { redirect } from 'next/navigation';
import AdminHeaderClient from './AdminHeaderClient';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }) {
  const admin = await requireAdmin();
  if (!admin) redirect('/login');

  return (
    <div className="space-y-4 md:space-y-6 min-w-0 overflow-x-hidden">
      {/* ── TOP HEADER BAR ────────────────────────── */}
      <div className="bg-white border border-[#E7E5E4]/[0.06] rounded-[24px] p-3.5 md:p-4 shadow-xs min-w-0">
        <AdminHeaderClient admin={admin} />
      </div>

      {/* Main Page Content */}
      <div className="min-w-0">
        {children}
      </div>
    </div>
  );
}
