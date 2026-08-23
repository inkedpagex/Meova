import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/getAdminUser';
import { adminDb } from '../../../../lib/firebaseAdmin';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    // Parallel fetch users and wallets
    const [usersSnap, walletsSnap] = await Promise.all([
      adminDb.collection('users').get(),
      adminDb.collection('wallets').get()
    ]);

    const walletsMap = {};
    walletsSnap.docs.forEach(doc => {
      const data = doc.data();
      // Total spendable/withdrawable balance = purchased + bonus + creator
      walletsMap[doc.id] = (data.purchased || 0) + (data.bonus || 0) + (data.creator || 0);
    });

    const users = usersSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      sparksBalance: walletsMap[doc.id] || 0
    }));

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
