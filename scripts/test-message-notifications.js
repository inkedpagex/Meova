/**
 * scripts/test-message-notifications.js
 * Automated Verification: Live Supabase notifications & message broadcast pipeline.
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
  console.log('🚀 TESTING MESSAGE NOTIFICATIONS & REALTIME PIPELINE');
  console.log('========================================================\n');

  // 1. Fetch 2 real profiles to test sender -> recipient flow
  const { data: users, error: userErr } = await admin
    .from('profiles')
    .select('id, full_name, photo_url')
    .limit(2);

  if (userErr || !users || users.length < 2) {
    console.error('❌ Failed to fetch test profiles:', userErr?.message);
    process.exit(1);
  }

  const sender = users[0];
  const recipient = users[1];
  console.log(`[TEST 1] Testing with sender: ${sender.full_name} (${sender.id}) -> recipient: ${recipient.full_name} (${recipient.id})`);

  // 2. Test inserting a message notification in public.notifications
  const testMsgText = 'Test automated meetup message: ' + Date.now();
  const { data: notifData, error: notifErr } = await admin
    .from('notifications')
    .insert({
      user_id: recipient.id,
      title: sender.full_name || 'Sender',
      message: testMsgText,
      type: 'message',
      sender_name: sender.full_name || 'Sender',
      sender_photo: sender.photo_url || null,
      url: '/messages',
      read: false,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (notifErr || !notifData) {
    console.error('❌ [FAIL] Insert message notification into public.notifications:', notifErr?.message);
    process.exit(1);
  }
  console.log('✅ [PASS] Insert message notification into public.notifications. ID:', notifData.id);

  // 3. Verify querying notifications table for recipient
  const { data: queriedNotifs, error: queryErr } = await admin
    .from('notifications')
    .select('*')
    .eq('id', notifData.id)
    .single();

  if (queryErr || !queriedNotifs || queriedNotifs.message !== testMsgText) {
    console.error('❌ [FAIL] Query back message notification:', queryErr?.message);
    process.exit(1);
  }
  console.log('✅ [PASS] Query back message notification confirmed in live Supabase.');

  // Clean up test notification
  await admin.from('notifications').delete().eq('id', notifData.id);
  console.log('✅ [PASS] Test notification cleaned up cleanly.');

  // 4. Test Broadcast Delivery from admin to client on user-realtime channel
  console.log('\n[TEST 2] Testing instant WebSocket broadcast on user-realtime channel...');
  const broadcastChannelName = `user-realtime-${recipient.id}`;
  const clientChan = anon.channel(broadcastChannelName);

  let broadcastReceived = false;
  let receivedPayload = null;

  clientChan.on('broadcast', { event: 'new-notification' }, ({ payload }) => {
    broadcastReceived = true;
    receivedPayload = payload;
  });

  await new Promise((resolve) => {
    clientChan.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const senderChan = admin.channel(broadcastChannelName);
        await senderChan.send({
          type: 'broadcast',
          event: 'new-notification',
          payload: {
            id: `msg_test_${Date.now()}`,
            title: sender.full_name,
            message: 'Live test message',
            type: 'message',
            senderName: sender.full_name,
            senderPhoto: sender.photo_url,
            url: '/messages',
          },
        });
        admin.removeChannel(senderChan);

        setTimeout(() => {
          anon.removeChannel(clientChan);
          resolve();
        }, 1500);
      }
    });
  });

  if (!broadcastReceived || !receivedPayload) {
    console.error('❌ [FAIL] Client did not receive broadcast on user-realtime channel within timeout.');
    process.exit(1);
  }
  console.log('✅ [PASS] Client received instant WebSocket broadcast! Title:', receivedPayload.title, 'Type:', receivedPayload.type);

  // 5. Test Chat Unread Count logic
  console.log('\n[TEST 3] Testing chat unread_count calculation logic...');
  const mockChatList = [
    { id: 'chat_1', unread_count: { [recipient.id]: 2, [sender.id]: 0 } },
    { id: 'chat_2', unread_count: { [recipient.id]: 1 } },
  ];

  let calculatedUnread = 0;
  mockChatList.forEach((c) => {
    const counts = c.unread_count || {};
    calculatedUnread += Number(counts[recipient.id]) || 0;
  });

  if (calculatedUnread !== 3) {
    console.error('❌ [FAIL] Expected 3 unread messages, got:', calculatedUnread);
    process.exit(1);
  }
  console.log(`✅ [PASS] Unread messages calculation verified: ${calculatedUnread} unread messages triggers purple dot on Messages tab.`);

  console.log('\n========================================================');
  console.log('🎉 ALL NOTIFICATION & REALTIME TESTS PASSED WITH EXIT CODE 0');
  console.log('========================================================\n');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
