import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { creditSparks } from '../../../../lib/wallet';

const CRON_SECRET = process.env.CRON_SECRET || 'Meova-cron-secret-2024';
const EXPIRY_DAYS = 14;

export async function GET(request) {
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - EXPIRY_DAYS);
  const cutoffISO = cutoff.toISOString();

  let expired = 0;

  try {
    const { data: gigs } = await supabaseAdmin
      .from('gigs')
      .select('*')
      .lt('created_at', cutoffISO)
      .or('status.is.null,status.eq.open');

    const eligible = gigs || [];

    for (const gig of eligible) {
      const now = new Date().toISOString();
      await supabaseAdmin
        .from('gigs')
        .update({
          status: 'expired',
          expired_at: now,
        })
        .eq('id', gig.id);

      const reward = gig.reward_sparks || parseInt(gig.budget) || 0;
      const hostId = gig.host_id || gig.author_id;

      if (reward > 0 && hostId) {
        await creditSparks(
          hostId,
          reward,
          'purchased',
          'dispute_refund',
          `Refund for expired gig: "${gig.title}"`,
          gig.id
        ).catch(e => console.error('[expire-gigs refund error]', e.message));

        await supabaseAdmin.from('notifications').insert({
          user_id: hostId,
          sender_id: 'system',
          title: 'Gig Expired & Sparks Refunded',
          message: `Your gig "${gig.title}" has expired without being assigned. ${reward} Sparks have been refunded to your wallet.`,
          type: 'alert',
          read: false,
          created_at: now,
        }).catch(() => {});
      }

      expired++;
    }

    return NextResponse.json({
      ok: true,
      expired,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[expire-gigs cron]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
