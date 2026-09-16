const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) return;
    const key = line.substring(0, eqIdx).trim();
    let val = line.substring(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  });
}

const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  // Check device_tokens table schema
  const { data, error } = await s.from('device_tokens').select('*').limit(1);
  if (error) {
    console.log('device_tokens ERROR:', error.message);
  } else {
    console.log('device_tokens rows:', data?.length);
    if (data?.[0]) {
      console.log('Columns:', Object.keys(data[0]).join(', '));
    } else {
      console.log('Table is empty');
    }
  }

  // Try insert and see what happens
  const { data: ins, error: insErr } = await s.from('device_tokens').insert({
    user_id: 'test_probe_user',
    fcm_token: 'test_probe_token_12345',
    platform: 'web',
    updated_at: new Date().toISOString(),
  }).select();

  if (insErr) {
    console.log('Insert test error:', insErr.message);
    console.log('Insert test details:', insErr.details);
  } else {
    console.log('Insert OK, columns:', ins?.[0] ? Object.keys(ins[0]).join(', ') : 'none');
    // Clean up
    await s.from('device_tokens').delete().eq('user_id', 'test_probe_user');
    console.log('Cleaned up test row');
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
