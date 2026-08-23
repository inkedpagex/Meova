/**
 * GET /api/cron/expire-gigs
 *
 * Called daily by Vercel Cron.
 * Finds all open gigs older than 14 days with no accepted applicant and closes them.
 * Protected by Authorization: Bearer <CRON_SECRET>
 */
import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebaseAdmin';

const CRON_SECRET = process.env.CRON_SECRET || 'meetuply-cron-secret-2024';
const EXPIRY_DAYS = 14;

export async function GET(request) {
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - EXPIRY_DAYS);
  const cutoffISO = cutoff.toISOString();

  let expired = 0;
  const errors = [];

  try {
    // Find open gigs older than 14 days
    const snap = await adminDb
      .collection('gigs')
      .where('createdAt', '<', cutoffISO)
      .get();

    // Filter to only those still open (not completed, rejected, expired, in_progress)
    const eligible = snap.docs.filter(doc => {
      const s = doc.data().status;
      return !s || s === 'open'; // no status or explicitly 'open'
    });

    for (const doc of eligible) {
      try {
        await adminDb.runTransaction(async (tx) => {
          const fresh = await tx.get(doc.ref);
          const freshStatus = fresh.data().status;
          // Double-check it's still open
          if (freshStatus && freshStatus !== 'open') return;
          tx.update(doc.ref, { status: 'expired', expiredAt: new Date().toISOString() });
        });
        expired++;
      } catch (err) {
        errors.push({ gigId: doc.id, error: err.message });
      }
    }

    return NextResponse.json({
      ok: true,
      expired,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[expire-gigs cron]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
