import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function runTests() {
  console.log('--- Starting Mobile PWA Push Pipeline Tests ---');

  // Test 1: Verify public/sw.js contains required push & notification handlers
  console.log('[Test 1] Inspecting public/sw.js handlers...');
  const swPath = path.join(rootDir, 'public', 'sw.js');
  if (!fs.existsSync(swPath)) {
    throw new Error('public/sw.js not found');
  }
  const swCode = fs.readFileSync(swPath, 'utf8');

  const hasPush = swCode.includes("self.addEventListener('push'");
  const hasClick = swCode.includes("self.addEventListener('notificationclick'");
  const hasMessage = swCode.includes("self.addEventListener('message'");
  const hasShowNotif = swCode.includes("self.registration.showNotification");

  if (!hasPush || !hasClick || !hasMessage || !hasShowNotif) {
    throw new Error(
      `sw.js missing critical handlers: push=${hasPush}, click=${hasClick}, message=${hasMessage}, showNotification=${hasShowNotif}`
    );
  }
  console.log('✅ public/sw.js has push, notificationclick, and message handlers');

  // Test 2: Verify VAPID keys and web-push initialization
  console.log('[Test 2] Testing VAPID configuration & web-push initialization...');
  const vapidPublicKey = 'BL0rrb7KcJx_PBDIly5Um7yb3sGHsER-bovujlLSBsy8l31Y4npmYRzW8SIkomaMpKiLNYK7nok04ug0rzW0zgs';
  const vapidPrivateKey = 'EqP13HgPWqp8Ef1AT46zY2H8a0FFvGPph1ITY56IBYc';
  const vapidSubject = 'mailto:support@meova.in';

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  console.log('✅ web-push initialized successfully with VAPID keys');

  // Test 3: Test base64url public key conversion length
  console.log('[Test 3] Testing public key byte conversion...');
  const padding = '='.repeat((4 - (vapidPublicKey.length % 4)) % 4);
  const base64 = (vapidPublicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length !== 65) {
    throw new Error(`Invalid P-256 public key length: ${buffer.length} (expected 65)`);
  }
  console.log('✅ VAPID public key correctly decodes to 65-byte uncompressed elliptic curve point');

  // Test 4: Verify Supabase device_tokens table and upsert capability
  console.log('[Test 4] Testing Supabase device_tokens connectivity...');
  const sb = createClient(
    'https://gruqvztyldlnvzbhyxzx.supabase.co',
    'sb_secret_ZWzJ8TE4OsbAdFXKgTM4UA_18-6Uyou'
  );

  const { data: rows, error: selectErr } = await sb.from('device_tokens').select('*').limit(1);
  if (selectErr) {
    throw new Error(`device_tokens query failed: ${selectErr.message}`);
  }
  console.log('✅ Supabase device_tokens query successful');

  // Test 5: Verify sendPushToUser module export and structure
  console.log('[Test 5] Verifying sendPushNotification.js and pushNotifications.js module loading...');
  const { sendPush } = await import('../lib/sendPushNotification.js');
  const { sendPushToUser } = await import('../lib/pushNotifications.js');

  if (typeof sendPush !== 'function' || typeof sendPushToUser !== 'function') {
    throw new Error('sendPush or sendPushToUser is not an exported function');
  }
  console.log('✅ sendPush and sendPushToUser functions imported successfully');

  console.log('🎉 ALL 5 MOBILE PWA PUSH PIPELINE TESTS PASSED!');
}

runTests().catch((err) => {
  console.error('❌ Test failure:', err);
  process.exit(1);
});
