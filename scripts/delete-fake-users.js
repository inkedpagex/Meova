import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load env vars
const envConfig = dotenv.parse(fs.readFileSync(path.resolve('.env.local')));

const rawPrivateKey = envConfig.FIREBASE_PRIVATE_KEY || '';
const privateKey = rawPrivateKey
  .replace(/^['"]|['"]$/g, '')
  .replace(/\\n/g, '\n')
  .trim();

const serviceAccount = {
  projectId: envConfig.FIREBASE_PROJECT_ID,
  clientEmail: envConfig.FIREBASE_CLIENT_EMAIL,
  privateKey: privateKey,
};

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);
const auth = getAuth(app);

const cleanup = async () => {
  console.log('🧹 Starting cleanup of fake users and related mock data...');

  const collectionsToClean = [
    'users', 'usernames', 'wallets', 'circles', 'events', 
    'bookings', 'reviews', 'chats', 'gigs', 'posts', 
    'transactions', 'withdrawals', 'payment_requests'
  ];

  for (const colName of collectionsToClean) {
    console.log(`Processing collection: ${colName}...`);
    let snapshot;
    try {
      snapshot = await db.collection(colName).get();
    } catch (e) {
      console.log(`Collection ${colName} does not exist or cannot be fetched: ${e.message}`);
      continue;
    }

    console.log(`Found ${snapshot.size} docs in ${colName}. Filtering mock docs...`);
    const docsToDelete = [];
    
    for (const doc of snapshot.docs) {
      const id = doc.id;
      const data = doc.data();
      
      let shouldDelete = false;

      // 1. Check ID prefixes or if it is in posts / gigs collection
      if (
        colName === 'posts' ||
        colName === 'gigs' ||
        id.startsWith('user_') || 
        id.startsWith('event_') || 
        id.startsWith('circle_') || 
        id.startsWith('post_') || 
        id.startsWith('gig_')
      ) {
        shouldDelete = true;
      }
      
      // 2. Check user ID fields inside document data
      if (!shouldDelete) {
        const userFields = [
          'userId', 'hostId', 'guestId', 'authorId', 'senderId', 
          'ownerId', 'uid', 'user_id', 'created_by', 'creatorId'
        ];
        for (const field of userFields) {
          if (data[field] && typeof data[field] === 'string' && data[field].startsWith('user_')) {
            shouldDelete = true;
            break;
          }
        }
      }

      // 3. Check array fields
      if (!shouldDelete) {
        if (Array.isArray(data.participants)) {
          if (data.participants.some(p => typeof p === 'string' && p.startsWith('user_'))) {
            shouldDelete = true;
          }
        }
        if (Array.isArray(data.rsvps_list)) {
          if (data.rsvps_list.some(r => r.user_id && r.user_id.startsWith('user_'))) {
            shouldDelete = true;
          }
        }
        if (Array.isArray(data.circle_members)) {
          if (data.circle_members.some(m => m.user_id && m.user_id.startsWith('user_'))) {
            shouldDelete = true;
          }
        }
      }

      if (shouldDelete) {
        docsToDelete.push(doc);
      }
    }

    if (docsToDelete.length > 0) {
      console.log(`Deleting ${docsToDelete.length} documents from ${colName} in parallel...`);
      // Delete in parallel chunks to make it extremely fast
      const promises = docsToDelete.map(async (doc) => {
        if (colName === 'chats') {
          try {
            const messagesSnap = await doc.ref.collection('messages').get();
            const batch = db.batch();
            messagesSnap.docs.forEach(mDoc => batch.delete(mDoc.ref));
            await batch.commit();
          } catch (e) {
            console.log(`Failed to clean messages for chat ${doc.id}: ${e.message}`);
          }
        }
        if (colName === 'users') {
          try {
            const notifsSnap = await doc.ref.collection('notifications').get();
            const batch = db.batch();
            notifsSnap.docs.forEach(nDoc => batch.delete(nDoc.ref));
            await batch.commit();
          } catch (e) {
            console.log(`Failed to clean notifications for user ${doc.id}: ${e.message}`);
          }
        }
        await doc.ref.delete();
      });
      await Promise.all(promises);
      console.log(`🗑️ Successfully deleted ${docsToDelete.length} documents from ${colName}`);
    } else {
      console.log(`No mock documents to delete in ${colName}`);
    }
  }

  // Auth cleanup
  console.log('Checking Firebase Auth for mock users...');
  try {
    const listUsersResult = await auth.listUsers(1000);
    const mockAuthUsers = listUsersResult.users.filter(u => u.uid.startsWith('user_') || (u.email && u.email.includes('@university.edu')));
    if (mockAuthUsers.length > 0) {
      console.log(`Deleting ${mockAuthUsers.length} mock users from Firebase Auth...`);
      const uids = mockAuthUsers.map(u => u.uid);
      await auth.deleteUsers(uids);
      console.log('✅ Deleted mock users from Firebase Auth');
    } else {
      console.log('No mock users found in Firebase Auth');
    }
  } catch (authErr) {
    console.warn('Could not clean Auth users:', authErr.message);
  }

  console.log('🎉 Cleanup complete!');
  process.exit(0);
};

cleanup().catch(err => {
  console.error('Error cleaning database:', err);
  process.exit(1);
});
