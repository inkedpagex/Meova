import { POST } from '../app/api/contact/route.js';
import { supabaseAdmin } from '../lib/supabase/admin.js';

async function runTest() {
  console.log('--- Starting Contact API Test ---');

  const mockPayload = {
    name: 'Harsh Vardhan',
    email: 'harsh.test@gla.ac.in',
    college: 'GLA University, Mathura',
    category: 'Sparks Wallet & Payments',
    message: 'Hello Meova Team, I had a question regarding recharge decimal matching for UPI transactions.',
  };

  const req = new Request('http://localhost:3000/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
    },
    body: JSON.stringify(mockPayload),
  });

  const response = await POST(req);
  const status = response.status;
  const data = await response.json();

  console.log('Response status:', status);
  console.log('Response body:', data);

  if (status !== 200 || !data.success) {
    console.error('TEST FAILED: Non-200 or unsuccess status');
    process.exit(1);
  }

  // Verify in live Supabase audit_logs
  const { data: logs, error: logErr } = await supabaseAdmin
    .from('audit_logs')
    .select('*')
    .eq('action', 'CONTACT_INQUIRY')
    .order('created_at', { ascending: false })
    .limit(1);

  if (logErr || !logs || logs.length === 0) {
    console.error('TEST FAILED: Could not find CONTACT_INQUIRY log in Supabase', logErr);
    process.exit(1);
  }

  const latest = logs[0];
  console.log('Live Supabase audit_log verified! ID:', latest.id);
  console.log('Details recorded:', latest.details);

  if (latest.details?.email !== mockPayload.email) {
    console.error('TEST FAILED: Email mismatch in database');
    process.exit(1);
  }

  // Cleanup test entry to keep database clean
  await supabaseAdmin.from('audit_logs').delete().eq('id', latest.id);
  console.log('Cleaned up test entry from Supabase.');

  console.log('--- ALL CONTACT API TESTS PASSED WITH EXIT CODE 0 ---');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('Unhandled test exception:', err);
  process.exit(1);
});
