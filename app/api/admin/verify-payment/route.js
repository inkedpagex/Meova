import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/getAdminUser';
import {
  approvePaymentReservation,
  rejectPaymentReservation
} from '../../../../lib/paymentReservations';

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  let id, action, reason;
  try {
    const body = await request.json();
    id = body.id || body.reservationId;
    action = body.action; // 'approve' | 'reject'
    reason = body.reason || 'Payment not matching or verified';
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!id || !action) {
    return NextResponse.json({ error: 'id and action required' }, { status: 400 });
  }

  try {
    if (action === 'approve') {
      const result = await approvePaymentReservation({
        reservationId: id,
        adminId: admin.uid
      });

      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        message: 'Payment approved successfully — Sparks credited to wallet ledger!',
        result
      });
    }

    if (action === 'reject') {
      const result = await rejectPaymentReservation({
        reservationId: id,
        adminId: admin.uid,
        reason
      });

      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        message: 'Payment rejected successfully — User notified.',
        result
      });
    }

    return NextResponse.json({ error: 'Invalid action. Use approve or reject.' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
