const fs = require('fs');
const path = require('path');

// Auto-load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  console.log('=== PUSH & CHAT DIAGNOSTIC ===\n');

  // 1. Device tokens
  const { data: tokens, error: tokErr } = await supabase
    .from('device_tokens')
    .select('id, user_id, platform, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (tokErr) console.error('device_tokens error:', tokErr.message);
  console.log('Device tokens:', tokens?.length || 0);
  (tokens || []).forEach(t =>
    console.log(`  ${t.user_id?.substring(0,8)}... platform=${t.platform} ${t.created_at}`)
  );

  // 2. Recent notifications
  const { data: notifs, error: notifErr } = await supabase
    .from('notifications')
    .select('id, user_id, title, type, read, created_at')
    .order('created_at', { ascending: false })
    .limit(15);

  if (notifErr) console.error('notifications error:', notifErr.message);
  console.log('\nRecent notifications:', notifs?.length || 0);
  const msgNotifs = (notifs || []).filter(n => n.type === 'message');
  console.log(`  Message type: ${msgNotifs.length}`);
  (notifs || []).slice(0, 10).forEach(n =>
    console.log(`  [${n.type}] "${n.title}" -> ${n.user_id?.substring(0,8)}... read=${n.read} ${n.created_at}`)
  );

  // 3. Recent chats + messages
  const { data: chats } = await supabase
    .from('chats')
    .select('id, participants, last_message, last_sender_id, last_message_at')
    .order('last_message_at', { ascending: false })
    .limit(3);

  console.log('\nRecent chats:');
  for (const c of (chats || [])) {
    console.log(`\n  Chat: ${c.id}`);
    console.log(`    Participants: ${JSON.stringify(c.participants)}`);
    console.log(`    Last: "${(c.last_message||'').substring(0,40)}" by ${c.last_sender_id?.substring(0,8)}...`);

    const { data: msgs } = await supabase
      .from('chat_messages')
      .select('id, sender_id, text, created_at')
      .eq('chat_id', c.id)
      .order('created_at', { ascending: false })
      .limit(5);

    console.log(`    Messages in DB: ${msgs?.length || 0}`);
    (msgs || []).forEach(m =>
      console.log(`      [${m.sender_id?.substring(0,8)}] "${(m.text||'').substring(0,40)}" | ${m.created_at}`)
    );
  }

  console.log('\n=== DONE ===');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
