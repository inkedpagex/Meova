const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json'); // Adjust path as needed

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function fixWallets() {
  console.log('Starting data correction...');
  try {
    // 1. Reset negative creator balances
    const walletsSnap = await db.collection('wallets').where('creator', '<', 0).get();
    let fixedWallets = 0;
    
    if (!walletsSnap.empty) {
      const batch = db.batch();
      walletsSnap.docs.forEach(doc => {
        console.log(`Fixing wallet for user ${doc.id}, previous balance: ${doc.data().creator}`);
        batch.update(doc.ref, { creator: 0 });
        fixedWallets++;
      });
      await batch.commit();
      console.log(`Successfully fixed ${fixedWallets} wallets with negative balances.`);
    } else {
      console.log('No wallets with negative balances found.');
    }

    // 2. Reject all pending withdrawals (legacy requests where sparks weren't deducted)
    const withdrawalsSnap = await db.collection('withdrawals').where('status', '==', 'pending').get();
    let rejectedCount = 0;
    
    if (!withdrawalsSnap.empty) {
      const batch2 = db.batch();
      withdrawalsSnap.docs.forEach(doc => {
        console.log(`Rejecting legacy pending withdrawal ${doc.id}`);
        batch2.update(doc.ref, { 
          status: 'rejected',
          remarks: 'System upgrade: Please re-request your withdrawal to securely sync with our new Escrow system.',
          reviewed_at: new Date().toISOString()
        });
        rejectedCount++;
      });
      await batch2.commit();
      console.log(`Successfully rejected ${rejectedCount} legacy pending withdrawals.`);
    } else {
      console.log('No pending withdrawals found.');
    }

    console.log('Data correction completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error during data correction:', err);
    process.exit(1);
  }
}

fixWallets();
