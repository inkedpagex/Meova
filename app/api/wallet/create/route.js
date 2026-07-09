import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/getAdminUser';
import { getOrCreateWallet } from '../../../../lib/wallet';

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  try {
    const wallet = await getOrCreateWallet(user.uid, user.email);
    return NextResponse.json({ wallet });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
