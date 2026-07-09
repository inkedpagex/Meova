import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/getAdminUser';
import { getAllPendingPayments } from '../../../../lib/wallet';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const payments = await getAllPendingPayments();
    return NextResponse.json({ payments });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
