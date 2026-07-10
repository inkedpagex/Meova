require('dotenv').config({ path: '.env.local' });
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY
      ?.replace(/^['"]|['"]$/g, '')
      ?.replace(/\\n/g, '\n')
      ?.trim(),
  }),
});

const db = getFirestore(app);

async function test() {
  console.log('Fetching users...');
  try {
    const snap = await db.collection('users').limit(1).get();
    console.log('Success! Users found:', snap.size);
  } catch (err) {
    console.error('Error fetching users:', err.message);
  }
  process.exit(0);
}

test();
