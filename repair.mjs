import { adminDb } from './lib/firebase-admin.js';

async function repair() {
  const usersRef = adminDb.collection('users');
  const snapshot = await usersRef.get();
  
  const batch = adminDb.batch();
  let count = 0;
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    let needsUpdate = false;
    let updates = {};

    if (data.wallet) {
      if (data.wallet.creator < 0) {
        updates['wallet.creator'] = 0;
        needsUpdate = true;
      }
      if (data.wallet.purchased < 0) {
        updates['wallet.purchased'] = 0;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      batch.update(doc.ref, updates);
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`Repaired ${count} wallets with negative balances.`);
  } else {
    console.log('No negative balances found.');
  }
}

repair().catch(console.error);
