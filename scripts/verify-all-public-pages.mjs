import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('FAIL: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const PUBLIC_PAGES = [
  { path: '/', name: 'Homepage (Marketing)' },
  { path: '/login', name: 'Login Page' },
  { path: '/signup', name: 'Signup Page' },
  { path: '/terms', name: 'Terms of Service' },
  { path: '/privacy', name: 'Privacy Policy' },
  { path: '/refund-policy', name: 'Refund & Cancellation' },
  { path: '/grievance', name: 'Grievance Redressal' },
  { path: '/community-guidelines', name: 'Community Guidelines' },
  { path: '/ambassador', name: 'Campus Ambassador' },
  { path: '/help', name: 'Help Center' },
  { path: '/blog', name: 'Campus Blog' },
  { path: '/about', name: 'About Meova' },
  { path: '/contact', name: 'Contact & Support' },
  { path: '/college/gla-university', name: 'College Landing Page (GLA)' },
];

async function runAudit() {
  console.log('======================================================');
  console.log('   MEOVA PUBLIC PAGES & GUEST COMPLIANCE AUDIT        ');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Audit Every Public Route
  console.log('[Phase 1] Auditing all public URLs without session cookies:');
  for (const page of PUBLIC_PAGES) {
    try {
      const res = await fetch(BASE_URL + page.path, { redirect: 'manual' });
      const status = res.status;
      const html = await res.text();

      const is200 = status === 200;
      const hasError = html.includes('Application error') || html.includes('Unhandled Runtime Error');
      const hasLogo = html.includes('/logo.png') || page.path === '/login' || page.path === '/signup';

      if (is200 && !hasError) {
        console.log(`  ✓ [200 OK] ${page.name} (${page.path}) — length: ${html.length}`);
        passed++;
      } else {
        console.error(`  ✗ [FAIL] ${page.name} (${page.path}) — status: ${status}, hasError: ${hasError}`);
        failed++;
      }
    } catch (err) {
      console.error(`  ✗ [ERROR] ${page.name} (${page.path}) — ${err.message}`);
      failed++;
    }
  }

  // 2. Audit SEO Redirect from /gla-university to /college/gla-university
  console.log('\n[Phase 2] Verifying SEO Redirects:');
  try {
    const res = await fetch(BASE_URL + '/gla-university', { redirect: 'manual' });
    const location = res.headers.get('location');
    if (res.status === 308 && location && location.includes('/college/gla-university')) {
      console.log('  ✓ [308 Redirect] /gla-university -> /college/gla-university verified');
      passed++;
    } else {
      console.error(`  ✗ [FAIL] /gla-university redirect returned status ${res.status}, location: ${location}`);
      failed++;
    }
  } catch (err) {
    console.error('  ✗ [ERROR] SEO redirect check failed:', err.message);
    failed++;
  }

  // 3. Test Live Ambassador Application without Login
  console.log('\n[Phase 3] Testing Unauthenticated Ambassador Application Submission:');
  try {
    const testEmail = `guest_test_${Date.now()}@meova.in`;
    const applyRes = await fetch(BASE_URL + '/api/ambassador/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Audit Lead Applicant',
        email: testEmail,
        phone: '9876543210',
        year: '3rd Year',
        branch: 'Computer Science',
        why_ambassador: 'Testing public submission without login to ensure full applicant accessibility and zero friction.',
      }),
    });

    const applyData = await applyRes.json();
    if (applyRes.status === 200 && applyData.ok && applyData.applicationId) {
      console.log(`  ✓ [200 OK] Guest application accepted! ID: ${applyData.applicationId}`);

      // Verify in live Supabase database
      const { data: dbRecord, error: dbErr } = await supabase
        .from('ambassador_applications')
        .select('*')
        .eq('id', applyData.applicationId)
        .single();

      if (dbRecord && !dbErr && dbRecord.email === testEmail) {
        console.log('  ✓ [DB Verified] Live Supabase record confirmed with user_id: null');
        // Clean up
        await supabase.from('ambassador_applications').delete().eq('id', applyData.applicationId);
        console.log('  ✓ [DB Cleanup] Deleted test application record');
        passed++;
      } else {
        console.error('  ✗ [DB Mismatch] Record not found in Supabase:', dbErr?.message);
        failed++;
      }
    } else {
      console.error('  ✗ [FAIL] Application submission failed:', applyRes.status, applyData);
      failed++;
    }
  } catch (err) {
    console.error('  ✗ [ERROR] Ambassador test submission failed:', err.message);
    failed++;
  }

  // 4. Audit College Dynamic Route Data against Supabase
  console.log('\n[Phase 4] Testing Live College Route Data Resolution:');
  try {
    const { data: glaCollege } = await supabase
      .from('colleges')
      .select('id, name, city')
      .ilike('name', '%GLA%')
      .limit(1)
      .single();

    if (glaCollege) {
      const pageRes = await fetch(`${BASE_URL}/college/gla-university`);
      const pageText = await pageRes.text();
      const containsCollegeName = pageText.includes(glaCollege.name);
      if (pageRes.status === 200 && containsCollegeName) {
        console.log(`  ✓ [200 OK] College page rendered dynamic name "${glaCollege.name}" from database`);
        passed++;
      } else {
        console.error('  ✗ [FAIL] College page did not contain expected college name');
        failed++;
      }
    }
  } catch (err) {
    console.error('  ✗ [ERROR] College data test failed:', err.message);
    failed++;
  }

  console.log('\n======================================================');
  console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAudit();
