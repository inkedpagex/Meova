const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
env.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) envVars[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function cancelOldBookings() {
  console.log('Fetching active/pending/requested bookings to cancel...');
  const { data: bookings, error: bErr } = await supabase
    .from('bookings')
    .select('*')
    .in('status', ['Requested', 'Accepted', 'Confirmed']);

  if (bErr) {
    console.error('Error fetching bookings:', bErr);
    return;
  }

  console.log(`Found ${bookings?.length || 0} active bookings to cancel.`);
  for (const b of (bookings || [])) {
    console.log(`Cancelling Booking #${b.id} (${b.status})...`);
    
    // Update booking status to Canceled
    await supabase
      .from('bookings')
      .update({
        status: 'Canceled',
        cancel_reason: 'Admin reset old meetings & synced standard campus pricing'
      })
      .eq('id', b.id);

    // If there was an escrow payment or guest spent sparks, refund to guest wallet
    const refundAmount = Number(b.price || b.total_price || 0);
    if (refundAmount > 0 && b.guest_id) {
      console.log(`Refunding ${refundAmount} Sparks to guest ${b.guest_id}...`);
      // Update wallet
      const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', b.guest_id)
        .maybeSingle();

      if (wallet) {
        await supabase
          .from('wallets')
          .update({
            purchased: (wallet.purchased || 0) + refundAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', b.guest_id);
      }
    }
  }

  console.log('[SUCCESS] All active/old meetings have been cancelled cleanly.');
}

cancelOldBookings();
