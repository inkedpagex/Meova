import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/getAdminUser';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    if (!adminDb) {
      return NextResponse.json({
        totalUsers: 0,
        totalBookings: 0,
        pendingPayments: 0,
        allPaymentsCount: 0,
        pendingWithdrawals: 0,
        allWithdrawalsCount: 0,
        activeEscrow: 0,
        totalUserSparks: 0,
      });
    }

    const [
      usersSnap,
      bookingsCountSnap,
      pendingPaymentsSnap,
      allPaymentsSnap,
      pendingWithdrawalsSnap,
      allWithdrawalsSnap,
      activeBookingsSnap,
      walletsSnap
    ] = await Promise.all([
      adminDb.collection('users').count().get(),
      adminDb.collection('bookings').count().get(),
      adminDb.collection('payment_requests').where('status', '==', 'pending').count().get(),
      adminDb.collection('payment_requests').count().get(),
      adminDb.collection('withdrawals').where('status', '==', 'pending').count().get(),
      adminDb.collection('withdrawals').count().get(),
      adminDb.collection('bookings').where('status', 'in', ['Requested', 'Confirmed', 'requested', 'confirmed']).get(),
      adminDb.collection('wallets').get(),
    ]);

    const totalUsers = usersSnap.data().count || 0;
    const totalBookings = bookingsCountSnap.data().count || 0;
    const pendingPayments = pendingPaymentsSnap.data().count || 0;
    const allPaymentsCount = allPaymentsSnap.data().count || 0;
    const pendingWithdrawals = pendingWithdrawalsSnap.data().count || 0;
    const allWithdrawalsCount = allWithdrawalsSnap.data().count || 0;

    let activeEscrow = 0;
    activeBookingsSnap.docs.forEach(doc => {
      activeEscrow += (doc.data().price || doc.data().amount || 0);
    });

    let totalUserSparks = 0;
    walletsSnap.docs.forEach(doc => {
      const data = doc.data() || {};
      if (typeof data.sparks === 'number') {
        totalUserSparks += data.sparks;
      } else {
        const sum = (data.purchased || 0) + (data.bonus || 0) + (data.creator || 0);
        totalUserSparks += sum;
      }
    });

    return NextResponse.json({
      totalUsers,
      totalBookings,
      pendingPayments,
      allPaymentsCount,
      pendingWithdrawals,
      allWithdrawalsCount,
      activeEscrow,
      totalUserSparks,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
