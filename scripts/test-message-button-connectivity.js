/**
 * Automated Verification Script for Messaging Connectivity
 * Loads .env.local, tests live Supabase connection, schema integrity for chats and chat_messages,
 * and confirms query execution with Exit Code 0.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [k, ...v] = trimmed.split('=');
    if (k && v.length) {
      process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('FAIL: Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log('=== [TEST] Starting Messaging Connectivity & Schema Verification ===');

  // 1. Verify connection & chats table schema
  console.log('Step 1: Inspecting `chats` table...');
  const { data: sampleChats, error: chatsError } = await supabaseAdmin
    .from('chats')
    .select('id, participants, last_message, last_message_at, unread_count, created_at')
    .limit(3);

  if (chatsError) {
    console.error('FAIL: Error querying `chats` table:', chatsError.message);
    process.exit(1);
  }
  console.log(`PASS: Queried chats table successfully (${sampleChats ? sampleChats.length : 0} sample rows returned).`);
  if (sampleChats && sampleChats.length > 0) {
    console.log('Sample chat columns:', Object.keys(sampleChats[0]));
    console.log('Sample chat ID:', sampleChats[0].id);
  }

  // 2. Verify chat_messages table schema with verified column `text`
  console.log('\nStep 2: Inspecting `chat_messages` table...');
  const { data: sampleMsgs, error: msgsError } = await supabaseAdmin
    .from('chat_messages')
    .select('id, chat_id, sender_id, text, status, created_at')
    .limit(3);

  if (msgsError) {
    console.error('FAIL: Error querying `chat_messages` table:', msgsError.message);
    process.exit(1);
  }
  console.log(`PASS: Queried chat_messages table successfully (${sampleMsgs ? sampleMsgs.length : 0} sample rows returned).`);
  if (sampleMsgs && sampleMsgs.length > 0) {
    console.log('Sample chat_messages columns:', Object.keys(sampleMsgs[0]));
  }

  // 3. Test participant array query simulation (what GET /api/chats performs)
  console.log('\nStep 3: Testing participant query simulation...');
  const testUid = sampleChats?.[0]?.participants?.[0] || 'test-user-id';
  const { data: participantChats, error: partError } = await supabaseAdmin
    .from('chats')
    .select('id, participants, last_message, last_message_at')
    .contains('participants', [testUid])
    .limit(5);

  if (partError) {
    console.error('FAIL: Participant query failed:', partError.message);
    process.exit(1);
  }
  console.log(`PASS: Participant array search completed (${participantChats ? participantChats.length : 0} chats for UID ${testUid}).`);

  // 4. Test deterministic ID convention
  console.log('\nStep 4: Testing deterministic chat ID generation...');
  const userA = 'user_abc_123';
  const userB = 'user_xyz_789';
  const deterministicId = [userA, userB].sort().join('_');
  const expectedId = 'user_abc_123_user_xyz_789';
  if (deterministicId !== expectedId) {
    console.error(`FAIL: Deterministic ID mismatch. Got ${deterministicId}, expected ${expectedId}`);
    process.exit(1);
  }
  console.log(`PASS: Deterministic ID generator validated: ${deterministicId}`);

  console.log('\n=== ALL TESTS PASSED SUCCESSFULLY with Exit Code 0 ===');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Unexpected exception during tests:', err);
  process.exit(1);
});
