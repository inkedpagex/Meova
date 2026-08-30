import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    // Parallel count queries using head: true (no rows returned, just count)
    const [
      { count: totalUsers },
      { count: totalBookings },
      { count: pendingPayments },
      { count: allPaymentsCount },
      { count: pendingWithdrawals },
      { count: allWithdrawalsCount },
      { data: activeBookings },
      { data: wallets },
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('payment_requests').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('withdrawals').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('bookings').select('sparks_spent').in('status', ['Requested', 'Confirmed', 'requested', 'confirmed']),
      supabaseAdmin.from('wallets').select('purchased, bonus, creator'),
    ]);

    const activeEscrow = (activeBookings || []).reduce((sum, b) => sum + (b.sparks_spent || 0), 0);
    const totalUserSparks = (wallets || []).reduce((sum, w) =>
      sum + (w.purchased || 0) + (w.bonus || 0) + (w.creator || 0), 0);

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalBookings: totalBookings || 0,
      pendingPayments: pendingPayments || 0,
      allPaymentsCount: allPaymentsCount || 0,
      pendingWithdrawals: pendingWithdrawals || 0,
      allWithdrawalsCount: allWithdrawalsCount || 0,
      activeEscrow,
      totalUserSparks,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
