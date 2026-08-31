import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { creditSparks } from '@/lib/wallet';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('status', 'Confirmed');

    if (error || !bookings || !bookings.length) {
      return NextResponse.json({ message: 'No confirmed bookings found' });
    }

    let refundedCount = 0;
    const now = new Date();

    for (const booking of bookings) {
      if (!booking.date || !booking.time) continue;

      let meetingDateTime;
      try {
        meetingDateTime = new Date(`${booking.date}T${booking.time}`);
        if (isNaN(meetingDateTime.getTime())) {
          meetingDateTime = new Date(booking.scheduled_at || booking.created_at);
        }
      } catch {
        meetingDateTime = new Date(booking.created_at);
      }

      const refundThreshold = new Date(meetingDateTime.getTime() + 24 * 60 * 60 * 1000);

      if (now > refundThreshold) {
        // Update booking status
        await supabaseAdmin
          .from('bookings')
          .update({
            status: 'AutoRefunded',
            auto_refunded_at: now.toISOString(),
          })
          .eq('id', booking.id);

        const price = booking.price || booking.sparks_amount || 0;
        if (price > 0) {
          await creditSparks(
            booking.guest_id,
            price,
            'purchased',
            'dispute_refund',
            `Auto-refund for missed meeting: "${booking.title}"`,
            booking.id
          );
        }

        await supabaseAdmin.from('notifications').insert({
          user_id: booking.guest_id,
          sender_id: booking.host_id,
          title: 'Sparks Auto-Refunded ⚡',
          message: `Your meeting "${booking.title}" wasn't scanned. ${price} Sparks have been refunded.`,
          type: 'auto_refund',
          booking_id: booking.id,
          read: false,
          created_at: now.toISOString(),
        }).catch(() => {});

        refundedCount++;
      }
    }

    return NextResponse.json({ ok: true, message: `Auto-refunded ${refundedCount} expired bookings` });
  } catch (err) {
    console.error('[CRON /api/cron/auto-refund]', err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
