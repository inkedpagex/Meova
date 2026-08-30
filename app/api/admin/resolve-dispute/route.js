import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { creditSparks } from '@/lib/wallet';

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { bookingId, action } = await request.json();
    if (!bookingId || !action) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    const { data: booking, error: fetchErr } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle();

    if (fetchErr || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status !== 'Disputed') {
      return NextResponse.json({ error: 'Booking is not in disputed status' }, { status: 400 });
    }

    const amount = booking.price || booking.sparks_amount || 50;

    if (action === 'refund') {
      await supabaseAdmin
        .from('bookings')
        .update({ status: 'Refunded' })
        .eq('id', bookingId);

      await creditSparks(
        booking.guest_id,
        amount,
        'purchased',
        'dispute_refund',
        `Dispute resolved: refunded for ${booking.title || 'booking'}`,
        bookingId
      );

      await supabaseAdmin.from('notifications').insert({
        user_id: booking.guest_id,
        sender_id: admin.uid,
        title: 'Dispute Resolved (Refunded)',
        message: `Your dispute for booking with ${booking.host_name || 'Host'} was resolved in your favor. ${amount} Sparks have been refunded.`,
        type: 'alert',
        read: false,
        created_at: new Date().toISOString(),
      });
    } else if (action === 'pay') {
      await supabaseAdmin
        .from('bookings')
        .update({ status: 'Completed' })
        .eq('id', bookingId);

      await creditSparks(
        booking.host_id,
        amount,
        'creator',
        'booking_payout',
        `Dispute resolved: payout for ${booking.title || 'booking'}`,
        bookingId
      );

      await supabaseAdmin.from('notifications').insert({
        user_id: booking.host_id,
        sender_id: admin.uid,
        title: 'Dispute Resolved (Paid)',
        message: `The dispute for a booking by ${booking.guest_name || 'Guest'} was resolved in your favor. ${amount} Sparks have been credited.`,
        type: 'alert',
        read: false,
        created_at: new Date().toISOString(),
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Resolve dispute error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
