import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

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
      await supabaseAdmin
        .from('gigs')
        .update({
          status: 'expired',
          expired_at: new Date().toISOString(),
        })
        .eq('id', gig.id);

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
