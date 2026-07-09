/**
 * seed-admin.js
 * One-time bootstrap: sets role="admin" on the Firestore user doc
 * for chirag2006chak@gmail.com and creates their wallet.
 *
 * Run: node scripts/seed-admin.js
 *
 * The EMAIL is only in this script — app code reads role from Firestore.
 * To add more admins later: node scripts/seed-admin.js --email=other@gmail.com
 */
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync(path.resolve('.env.local')));
const serviceAccount = {
  projectId:   envConfig.FIREBASE_PROJECT_ID,
  clientEmail: envConfig.FIREBASE_CLIENT_EMAIL,
  privateKey:  envConfig.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

const app = initializeApp({ credential: cert(serviceAccount) });
const db  = getFirestore(app);
const auth = getAuth(app);

// Read email from CLI arg or default to bootstrap email
const emailArg = process.argv.find(a => a.startsWith('--email='));
const TARGET_EMAIL = emailArg ? emailArg.split('=')[1] : 'chirag2006chak@gmail.com';

async function run() {
  console.log(`🔐 Setting admin role for: ${TARGET_EMAIL}`);

  let uid;
  try {
    const userRecord = await auth.getUserByEmail(TARGET_EMAIL);
    uid = userRecord.uid;
    console.log(`✅ Found Auth user: ${uid}`);
  } catch (err) {
    console.error(`❌ No Firebase Auth user found for ${TARGET_EMAIL}`);
    console.error('   Make sure this user has signed up via the app first.');
    process.exit(1);
  }

  // Set role in users collection
  await db.collection('users').doc(uid).set({
    email:     TARGET_EMAIL,
    role:      'admin',
    updatedAt: new Date().toISOString(),
  }, { merge: true });
  console.log(`✅ users/${uid}.role = "admin"`);

  // Create wallet if not exists
  const walletRef = db.collection('wallets').doc(uid);
  const walletSnap = await walletRef.get();
  if (!walletSnap.exists) {
    await walletRef.set({
      userId:              uid,
      purchased:           0,
      bonus:               500,   // 500 bonus sparks welcome gift for admin
      creator:             0,
      lifetime_purchased:  0,
      lifetime_earned:     0,
      lifetime_withdrawn:  0,
      updated_at:          new Date().toISOString(),
    });
    console.log(`✅ Wallet created for ${uid} (500 bonus Sparks welcome gift)`);

    // Log the bonus transaction
    await db.collection('transactions').add({
      userId:    uid,
      type:      'bonus',
      amount:    500,
      spark_type:'bonus',
      status:    'completed',
      metadata:  { reason: 'Admin welcome gift' },
      created_at: new Date().toISOString(),
    });
  } else {
    console.log(`ℹ️  Wallet already exists — skipping creation`);
  }

  // Write an audit log entry
  await db.collection('audit_logs').add({
    admin_id:   'system_bootstrap',
    action:     'SET_ADMIN_ROLE',
    target_uid: uid,
    old_value:  null,
    new_value:  'admin',
    timestamp:  new Date().toISOString(),
  });

  console.log('\n🎉 Done! You can now log in and visit /admin');
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
