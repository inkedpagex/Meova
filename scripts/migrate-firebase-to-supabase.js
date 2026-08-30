/**
 * scripts/migrate-firebase-to-supabase.js
 * Automated data migration script: Firestore -> Supabase PostgreSQL.
 *
 * Usage:
 *   node scripts/migrate-firebase-to-supabase.js
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      let value = trimmed.substring(idx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value.replace(/\\n/g, '\n');
    }
  });
}

const { adminDb } = require('../lib/firebaseAdmin');
const { supabaseAdmin } = require('../lib/supabase/admin');

async function migrate() {
  console.log('🚀 Starting Firebase Firestore -> Supabase PostgreSQL Migration...\n');

  if (!adminDb) {
    console.error('❌ Firebase Admin SDK is not initialized. Please check .env.local.');
    process.exit(1);
  }

  // 1. Users / Profiles
  console.log('📦 Migrating users -> public.profiles...');
  try {
    const usersSnap = await adminDb.collection('users').get();
    let profilesCount = 0;
    for (const doc of usersSnap.docs) {
      const d = doc.data();
      const uid = doc.id;

      const profilePayload = {
        id: uid,
        email: d.email || null,
        full_name: d.full_name || d.name || d.displayName || null,
        username: d.username || null,
        photo_url: d.photo_url || d.photoURL || d.avatar || null,
        gender: d.gender || null,
        role: d.role || 'user',
        is_blocked: d.is_blocked || d.blocked || false,
        status: d.status || 'active',
        year: d.year || null,
        branch: d.branch || null,
        bio: d.bio || null,
        interests: Array.isArray(d.interests) ? d.interests : [],
        instagram: d.instagram || null,
        upi_id: d.upi_id || d.upiId || null,
        profile_complete: d.profile_complete ?? true,
        is_live_on_campus: d.is_live_on_campus || d.isLiveOnCampus || false,
        live_location: d.live_location || d.liveLocation || null,
        created_at: d.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        updated_at: d.updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
      };

      const { error } = await supabaseAdmin
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' });

      if (error) {
        console.warn(`   ⚠️ Warning profiles [${uid}]: ${error.message}`);
      } else {
        profilesCount++;
      }

      if (d.username) {
        await supabaseAdmin
          .from('usernames')
          .upsert({ username: d.username, user_id: uid }, { onConflict: 'username' });
      }

      // Subcollection: notifications
      const notifsSnap = await doc.ref.collection('notifications').get();
      for (const nDoc of notifsSnap.docs) {
        const nData = nDoc.data();
        await supabaseAdmin.from('notifications').upsert({
          id: nDoc.id,
          user_id: uid,
          sender_id: nData.sender_id || nData.senderId || null,
          title: nData.title || 'Notification',
          message: nData.message || nData.body || '',
          type: nData.type || 'system',
          read: nData.read || false,
          created_at: nData.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        }, { onConflict: 'id' });
      }

      // Subcollection: fcmTokens
      const tokensSnap = await doc.ref.collection('fcmTokens').get();
      for (const tDoc of tokensSnap.docs) {
        const tData = tDoc.data();
        if (tData.token) {
          await supabaseAdmin.from('fcm_tokens').upsert({
            user_id: uid,
            token: tData.token,
          }, { onConflict: 'token' });
        }
      }

      // Subcollection: blocks
      const blocksSnap = await doc.ref.collection('blocks').get();
      for (const bDoc of blocksSnap.docs) {
        const bData = bDoc.data();
        const blockedId = bData.blocked_id || bData.blocked || bDoc.id;
        await supabaseAdmin.from('blocks').upsert({
          blocker_id: uid,
          blocked_id: blockedId,
        }, { onConflict: 'blocker_id,blocked_id' });
      }
    }
    console.log(`   ✅ Migrated ${profilesCount} profiles.`);
  } catch (err) {
    console.error(`   ❌ Error migrating profiles: ${err.message}`);
  }

  // 2. Wallets
  console.log('\n📦 Migrating wallets -> public.wallets...');
  try {
    const walletsSnap = await adminDb.collection('wallets').get();
    let walletsCount = 0;
    for (const doc of walletsSnap.docs) {
      const d = doc.data();
      const uid = doc.id;
      const { error } = await supabaseAdmin.from('wallets').upsert({
        user_id: uid,
        purchased: d.purchased || 0,
        bonus: d.bonus || 0,
        creator: d.creator || 0,
        lifetime_purchased: d.lifetime_purchased || d.lifetimePurchased || 0,
        lifetime_earned: d.lifetime_earned || d.lifetimeEarned || 0,
        lifetime_withdrawn: d.lifetime_withdrawn || d.lifetimeWithdrawn || 0,
        updated_at: d.updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (!error) walletsCount++;
    }
    console.log(`   ✅ Migrated ${walletsCount} wallets.`);
  } catch (err) {
    console.error(`   ❌ Error migrating wallets: ${err.message}`);
  }

  // 3. Transactions
  console.log('\n📦 Migrating transactions -> public.transactions...');
  try {
    const txSnap = await adminDb.collection('transactions').get();
    let txCount = 0;
    for (const doc of txSnap.docs) {
      const d = doc.data();
      const { error } = await supabaseAdmin.from('transactions').upsert({
        id: doc.id,
        user_id: d.user_id || d.userId,
        type: d.type || 'system',
        amount: d.amount || 0,
        description: d.description || '',
        status: d.status || 'COMPLETED',
        reference_id: d.reference_id || d.referenceId || null,
        created_at: d.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
      }, { onConflict: 'id' });

      if (!error) txCount++;
    }
    console.log(`   ✅ Migrated ${txCount} transactions.`);
  } catch (err) {
    console.error(`   ❌ Error migrating transactions: ${err.message}`);
  }

  // 4. Gigs & Applications
  console.log('\n📦 Migrating gigs & applications -> public.gigs...');
  try {
    const gigsSnap = await adminDb.collection('gigs').get();
    let gigsCount = 0;
    for (const doc of gigsSnap.docs) {
      const d = doc.data();
      const gigId = doc.id;
      const { error } = await supabaseAdmin.from('gigs').upsert({
        id: gigId,
        title: d.title || 'Untitled Gig',
        description: d.description || '',
        category: d.category || 'General',
        reward_sparks: d.reward_sparks || d.rewardSparks || 10,
        status: d.status || 'open',
        host_id: d.host_id || d.hostId,
        host_name: d.host_name || d.hostName || '',
        host_photo: d.host_photo || d.hostPhoto || '',
        selected_applicant_id: d.selected_applicant?.id || d.selectedApplicantId || null,
        applications_count: d.applications_count || d.applicationsCount || 0,
        created_at: d.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        expires_at: d.expires_at?.toDate?.()?.toISOString() || null,
      }, { onConflict: 'id' });

      if (!error) gigsCount++;

      // Subcollection: applications
      const appsSnap = await doc.ref.collection('applications').get();
      for (const aDoc of appsSnap.docs) {
        const aData = aDoc.data();
        await supabaseAdmin.from('gig_applications').upsert({
          id: aDoc.id,
          gig_id: gigId,
          applicant_id: aData.applicant_id || aData.applicantId || aDoc.id,
          applicant_name: aData.applicant_name || aData.applicantName || '',
          applicant_photo: aData.applicant_photo || aData.applicantPhoto || '',
          pitch: aData.pitch || '',
          status: aData.status || 'pending',
          created_at: aData.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        }, { onConflict: 'id' });
      }
    }
    console.log(`   ✅ Migrated ${gigsCount} gigs.`);
  } catch (err) {
    console.error(`   ❌ Error migrating gigs: ${err.message}`);
  }

  // 5. Bookings
  console.log('\n📦 Migrating bookings -> public.bookings...');
  try {
    const bookingsSnap = await adminDb.collection('bookings').get();
    let bookingsCount = 0;
    for (const doc of bookingsSnap.docs) {
      const d = doc.data();
      const { error } = await supabaseAdmin.from('bookings').upsert({
        id: doc.id,
        guest_id: d.guest_id || d.guestId,
        host_id: d.host_id || d.hostId,
        sparks_spent: d.sparks_spent || d.sparksSpent || 0,
        status: d.status || 'Requested',
        location: d.location || '',
        time_slot: d.time_slot || d.timeSlot || '',
        agenda: d.agenda || '',
        created_at: d.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        updated_at: d.updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
      }, { onConflict: 'id' });

      if (!error) bookingsCount++;
    }
    console.log(`   ✅ Migrated ${bookingsCount} bookings.`);
  } catch (err) {
    console.error(`   ❌ Error migrating bookings: ${err.message}`);
  }

  // 6. Chats & Messages
  console.log('\n📦 Migrating chats & messages -> public.chats...');
  try {
    const chatsSnap = await adminDb.collection('chats').get();
    let chatsCount = 0;
    for (const doc of chatsSnap.docs) {
      const d = doc.data();
      const chatId = doc.id;
      const { error } = await supabaseAdmin.from('chats').upsert({
        id: chatId,
        participants: Array.isArray(d.participants) ? d.participants : [],
        participant_names: d.participant_names || d.participantNames || {},
        participant_photos: d.participant_photos || d.participantPhotos || {},
        unread_count: d.unread_count || d.unreadCount || {},
        last_message: d.last_message || d.lastMessage || '',
        last_sender_id: d.last_sender_id || d.lastSenderId || '',
        last_message_at: d.last_message_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        created_at: d.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
      }, { onConflict: 'id' });

      if (!error) chatsCount++;

      // Subcollection: messages
      const msgsSnap = await doc.ref.collection('messages').get();
      for (const mDoc of msgsSnap.docs) {
        const mData = mDoc.data();
        await supabaseAdmin.from('chat_messages').upsert({
          id: mDoc.id,
          chat_id: chatId,
          sender_id: mData.sender_id || mData.senderId || '',
          text: mData.text || '',
          status: mData.status || 'sent',
          created_at: mData.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        }, { onConflict: 'id' });
      }
    }
    console.log(`   ✅ Migrated ${chatsCount} chats.`);
  } catch (err) {
    console.error(`   ❌ Error migrating chats: ${err.message}`);
  }

  console.log('\n🎉 Firebase -> Supabase Migration Finished Successfully!\n');
}

migrate().catch(console.error);
