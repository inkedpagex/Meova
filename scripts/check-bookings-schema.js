const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    value = value.trim().replace(/^['"]|['"]$/g, '');
    env[match[1]] = value;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkBookingsTable() {
  const { data, error } = await supabase.from('bookings').select('*').limit(1);
  if (error) {
    console.error('Bookings query error:', error);
  } else {
    console.log('Bookings table sample row keys:', data.length > 0 ? Object.keys(data[0]) : 'Empty table');
  }
  
  // Try inserting with minimal fields to see schema columns
  const testPayload = {
    guest_id: '00000000-0000-0000-0000-000000000000',
    host_id: '00000000-0000-0000-0000-000000000000',
    status: 'Requested',
  };
  const { error: testErr } = await supabase.from('bookings').insert(testPayload).select();
  console.log('Test insert result:', testErr ? testErr.message : 'Inserted test row');
}

checkBookingsTable();
