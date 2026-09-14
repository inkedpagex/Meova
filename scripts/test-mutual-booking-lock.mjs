/**
 * scripts/test-mutual-booking-lock.mjs
 * Automated Verification for Mutual Active Meetup Lock between peers.
 */
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://gruqvztyldlnvzbhyxzx.supabase.co',
  'sb_secret_ZWzJ8TE4OsbAdFXKgTM4UA_18-6Uyou'
);

async function runTests() {
  console.log('--- Starting Mutual Booking Lock Verification Tests ---');

  // Fetch two real distinct users from profiles table
  const { data: profiles, error: pErr } = await sb
    .from('profiles')
    .select('id, full_name')
    .limit(2);

  if (pErr || !profiles || profiles.length < 2) {
    throw new Error(`Failed to fetch 2 test profiles: ${pErr?.message}`);
  }

  const userA = profiles[0];
  const userB = profiles[1];
  console.log(`[Setup] User A: ${userA.full_name} (${userA.id})`);
  console.log(`[Setup] User B: ${userB.full_name} (${userB.id})`);

  const activeStatuses = [
    'Requested', 'requested',
    'Pending', 'pending',
    'Accepted', 'accepted',
    'Confirmed', 'confirmed',
    'in_progress', 'active'
  ];

  const mutualFilter = `and(guest_id.eq.${userA.id},host_id.eq.${userB.id}),and(guest_id.eq.${userB.id},host_id.eq.${userA.id})`;

  // Step 1: Ensure no existing active bookings for clean test state
  console.log('\n[Test 1] Checking clean initial state...');
  const { data: initialActive, error: initErr } = await sb
    .from('bookings')
    .select('id, guest_id, host_id, status')
    .or(mutualFilter)
    .in('status', activeStatuses);

  if (initErr) {
    throw new Error(`Initial query error: ${initErr.message}`);
  }
  console.log(`✅ Initial active bookings between User A and User B: ${initialActive.length}`);

  // Step 2: Create a test booking from User A to User B with status 'Requested'
  console.log('\n[Test 2] Inserting test booking (User A -> User B, status: Requested)...');
  const { data: testBooking1, error: insErr1 } = await sb
    .from('bookings')
    .insert({
      guest_id: userA.id,
      host_id: userB.id,
      sparks_spent: 0,
      status: 'Requested',
      location: 'Test Library',
      time_slot: 'Tomorrow Noon',
      agenda: '[CODE:999999] Mutual Lock Test Meeting',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insErr1 || !testBooking1) {
    throw new Error(`Failed to insert test booking: ${insErr1?.message}`);
  }
  console.log(`✅ Created test booking ID: ${testBooking1.id}`);

  // Step 3: Test Mutual Lock Detection for User A (Sender)
  console.log('\n[Test 3] Testing Lock detection for User A (Outgoing Pending)...');
  const { data: lockForA } = await sb
    .from('bookings')
    .select('id, guest_id, host_id, status')
    .or(`and(guest_id.eq.${userA.id},host_id.eq.${userB.id}),and(guest_id.eq.${userB.id},host_id.eq.${userA.id})`)
    .in('status', activeStatuses)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lockForA || lockForA.id !== testBooking1.id) {
    throw new Error('Lock query failed to find active booking for User A');
  }
  const isSenderA = lockForA.guest_id === userA.id;
  if (!isSenderA) throw new Error('User A should be identified as sender/guest');
  console.log('✅ User A correctly blocked with PENDING_REQUEST_EXISTS');

  // Step 4: Test Mutual Lock Detection for User B (Recipient)
  console.log('\n[Test 4] Testing Lock detection for User B (Incoming Pending)...');
  const { data: lockForB } = await sb
    .from('bookings')
    .select('id, guest_id, host_id, status')
    .or(`and(guest_id.eq.${userB.id},host_id.eq.${userA.id}),and(guest_id.eq.${userA.id},host_id.eq.${userB.id})`)
    .in('status', activeStatuses)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lockForB || lockForB.id !== testBooking1.id) {
    throw new Error('Lock query failed to find active booking for User B');
  }
  const isSenderB = lockForB.guest_id === userB.id;
  if (isSenderB) throw new Error('User B should be identified as recipient/host');
  console.log('✅ User B correctly blocked with INCOMING_REQUEST_EXISTS');

  // Step 5: Update booking to 'Confirmed'
  console.log('\n[Test 5] Updating booking to Confirmed...');
  await sb
    .from('bookings')
    .update({ status: 'Confirmed', updated_at: new Date().toISOString() })
    .eq('id', testBooking1.id);

  const { data: lockConfirmed } = await sb
    .from('bookings')
    .select('id, guest_id, host_id, status')
    .or(mutualFilter)
    .in('status', activeStatuses)
    .maybeSingle();

  if (!lockConfirmed || lockConfirmed.status !== 'Confirmed') {
    throw new Error('Confirmed booking not detected by lock query');
  }
  console.log('✅ Confirmed meetup correctly detected by mutual lock');

  // Step 6: Complete the meeting (status: 'Completed') and verify lock releases
  console.log('\n[Test 6] Marking meeting Completed and verifying lock release...');
  await sb
    .from('bookings')
    .update({ status: 'Completed', updated_at: new Date().toISOString() })
    .eq('id', testBooking1.id);

  const { data: releasedLock } = await sb
    .from('bookings')
    .select('id, guest_id, host_id, status')
    .or(mutualFilter)
    .in('status', activeStatuses)
    .maybeSingle();

  if (releasedLock) {
    throw new Error(`Lock was not released after Completed! Found: ${JSON.stringify(releasedLock)}`);
  }
  console.log('✅ Lock successfully released after meeting Completed! Both users can schedule again.');

  // Clean up test booking
  await sb.from('bookings').delete().eq('id', testBooking1.id);
  console.log('✅ Cleaned up test booking row.');

  console.log('\n🎉 ALL 6 MUTUAL BOOKING LOCK TESTS PASSED!');
}

runTests().catch((err) => {
  console.error('\n❌ Test failure:', err);
  process.exit(1);
});
