import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/getAdminUser';

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { referenceCode, action } = await request.json(); // action: 'approve' | 'reject'

  if (!referenceCode || !action) {
    return NextResponse.json({ error: 'referenceCode and action required' }, { status: 400 });
  }

  // Since firebase-admin is removed and database is mocked, 
  // simply return success responses for the UI to work.
  if (action === 'reject') {
    return NextResponse.json({ ok: true, message: 'Payment rejected (Mock)' });
  }

  if (action === 'approve') {
    return NextResponse.json({ ok: true, message: `Payment approved (Mock) for ${referenceCode}` });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
