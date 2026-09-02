const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
env.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) envVars[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: users, error: uErr } = await supabase
    .from('profiles')
    .select('id, full_name, username, gender, rate, is_host');
  
  if (uErr) console.error('Error fetching profiles:', uErr);
  else {
    console.log(`Total profiles in DB: ${users?.length}`);
    users?.forEach(u => {
      console.log(`- ${u.full_name} (@${u.username}) | gender: ${u.gender} | rate: ${u.rate} | is_host: ${u.is_host}`);
    });
  }

  const { data: bookings, error: bErr } = await supabase
    .from('bookings')
    .select('*');

  if (bErr) console.error('Error fetching bookings:', bErr);
  else {
    console.log(`\nTotal Bookings in DB: ${bookings?.length}`);
    bookings?.forEach(b => {
      console.log(`- Booking #${b.id}: Host ${b.host_id} <-> Guest ${b.guest_id} | status: ${b.status} | price: ${b.price}`);
    });
  }
}

check();
