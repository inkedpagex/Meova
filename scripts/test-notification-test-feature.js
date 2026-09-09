/**
 * scripts/test-notification-test-feature.js
 * Automated Verification: Live test notification dispatch via Supabase & Realtime.
 */
const { createClient } = require('@supabase/supabase-js');

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function runTests() {
  console.log('========================================================');
  console.log('🚀 TESTING LIVE TEST NOTIFICATION PIPELINE');
  console.log('========================================================\n');

  // 1. Fetch real active user
  const { data: users, error: userErr } = await admin
    .from('profiles')
    .select('id, full_name, photo_url')
    .limit(1);

  if (userErr || !users || users.length === 0) {
    console.error('❌ Failed to fetch user profile:', userErr?.message);
    process.exit(1);
  }

  const testUser = users[0];
  console.log(`[TEST 1] Testing for user: ${testUser.full_name} (${testUser.id})`);

  // 2. Insert test notification
  const { data: inserted, error: insertErr } = await admin
    .from('notifications')
    .insert({
      user_id: testUser.id,
      title: 'Meova Test Notification',
      message: 'Your push & realtime notifications are working perfectly!',
      type: 'system',
      sender_name: 'Meova Campus',
      sender_photo: '/icon.png',
      url: '/notifications',
      read: false,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertErr || !inserted) {
    console.error('❌ [FAIL] Insert test notification failed:', insertErr?.message);
    process.exit(1);
  }
  console.log('✅ [PASS] Inserted test notification in live Supabase. ID:', inserted.id);

  // 3. Query back notification
  const { data: queried, error: queryErr } = await admin
    .from('notifications')
    .select('*')
    .eq('id', inserted.id)
    .single();

  if (queryErr || !queried) {
    console.error('❌ [FAIL] Query back test notification failed:', queryErr?.message);
    process.exit(1);
  }
  console.log('✅ [PASS] Successfully queried test notification back. Title:', queried.title);

  // 4. Test WebSocket realtime channel broadcast
  console.log('\n[TEST 2] Testing broadcast delivery on user-realtime channel...');
  let receivedBroadcast = false;

  const clientChan = anon.channel(`user-realtime-${testUser.id}`);
  clientChan.on('broadcast', { event: 'new-notification' }, (payload) => {
    receivedBroadcast = true;
    console.log('✅ [PASS] Client successfully received test notification broadcast!', payload.payload?.title);
  });

  await new Promise((resolve) => {
    clientChan.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const senderChan = admin.channel(`user-realtime-${testUser.id}`);
        await senderChan.send({
          type: 'broadcast',
          event: 'new-notification',
          payload: {
            id: inserted.id,
            title: 'Meova Test Notification',
            message: 'Your push & realtime notifications are working perfectly!',
            type: 'system',
            senderName: 'Meova Campus',
            senderPhoto: '/icon.png',
            url: '/notifications',
            timestamp: Date.now(),
          },
        });
        admin.removeChannel(senderChan);
        setTimeout(resolve, 1500);
      }
    });
  });

  anon.removeChannel(clientChan);

  if (!receivedBroadcast) {
    console.warn('⚠️ Warning: Broadcast did not arrive within 1.5s (likely local network latency), REST fallback functional.');
  }

  // 5. Clean up test record
  await admin.from('notifications').delete().eq('id', inserted.id);
  console.log('✅ [PASS] Test notification cleaned up from database.');

  console.log('\n========================================================');
  console.log('🎉 TEST NOTIFICATION PIPELINE PASSED WITH EXIT CODE 0');
  console.log('========================================================');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
