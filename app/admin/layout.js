import { requireAdmin } from '../../lib/getAdminUser';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Bell, LogOut } from 'lucide-react';
import AdminHeaderClient from './AdminHeaderClient';

export default async function AdminLayout({ children }) {
  const admin = await requireAdmin();
  if (!admin) redirect('/');

  return (
    <div className="space-y-6">
      {/* ── TOP HEADER BAR (exact screenshot design) ────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl px-5 py-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-extrabold">
            <ShieldCheck size={14} />
            <span>Admin Dashboard</span>
          </div>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            {admin?.email}
          </span>
        </div>

        <AdminHeaderClient admin={admin} />
      </div>

      {/* Main Page Content */}
      {children}
    </div>
  );
}
