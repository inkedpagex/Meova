import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebaseAdmin';

export async function GET() {
  try {
    let fixedWallets = 0;
    let rejectedCount = 0;

    // 1. Reset negative creator balances
    const walletsSnap = await adminDb.collection('wallets').where('creator', '<', 0).get();
    
    if (!walletsSnap.empty) {
      const batch = adminDb.batch();
      walletsSnap.docs.forEach(doc => {
        batch.update(doc.ref, { creator: 0 });
        fixedWallets++;
      });
      await batch.commit();
    }

    // 2. Reject all pending withdrawals
    const withdrawalsSnap = await adminDb.collection('withdrawals').where('status', '==', 'pending').get();
    
    if (!withdrawalsSnap.empty) {
      const batch2 = adminDb.batch();
      withdrawalsSnap.docs.forEach(doc => {
        batch2.update(doc.ref, { 
          status: 'rejected',
          remarks: 'System upgrade: Please re-request your withdrawal to securely sync with our new Escrow system.',
          reviewed_at: new Date().toISOString()
        });
        rejectedCount++;
      });
      await batch2.commit();
    }

    return NextResponse.json({ 
      ok: true, 
      fixedWallets, 
      rejectedCount,
      message: 'Data correction completed successfully.' 
    });
  } catch (err) {
    console.error('Error during data correction:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
