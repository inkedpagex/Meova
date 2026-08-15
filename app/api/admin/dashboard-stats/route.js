import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/getAdminUser';
import { adminDb } from '../../../../lib/firebaseAdmin';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    if (!adminDb) {
      return NextResponse.json({
        totalUsers: 0,
        pendingPayments: 0,
        pendingWithdrawals: 0,
        activeEscrow: 0,
      });
    }

    const [usersSnap, paymentsSnap, withdrawalsSnap, bookingsSnap] = await Promise.all([
      adminDb.collection('users').count().get(),
      adminDb.collection('payment_requests').where('status', '==', 'pending').count().get(),
      adminDb.collection('withdrawals').where('status', '==', 'pending').count().get(),
      adminDb.collection('bookings').where('status', 'in', ['Requested', 'Confirmed']).get(),
    ]);

    const totalUsers = usersSnap.data().count;
    const pendingPayments = paymentsSnap.data().count;
    const pendingWithdrawals = withdrawalsSnap.data().count;

    let activeEscrow = 0;
    bookingsSnap.docs.forEach(doc => {
      activeEscrow += (doc.data().price || 0);
    });

    return NextResponse.json({
      totalUsers,
      pendingPayments,
      pendingWithdrawals,
      activeEscrow,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
