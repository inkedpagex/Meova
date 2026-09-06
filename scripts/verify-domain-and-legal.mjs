import { createClient } from '@supabase/supabase-js';
import { slugifyCollege, getCollegeBySlug } from '../lib/collegeSlug.js';
import { createProfileAdmin } from '../features/auth/auth.actions.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('FAIL: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runVerification() {
  console.log('─── Starting Domain Architecture & Legal Compliance Verification ───\n');

  // 1. Verify Supabase Connectivity & Colleges Table
  console.log('[1/4] Checking live Supabase connection & colleges...');
  const { data: colleges, error: colErr } = await supabase
    .from('colleges')
    .select('id, name, city, state, is_active')
    .eq('is_active', true);

  if (colErr) {
    console.error('FAIL: Error fetching colleges from Supabase:', colErr.message);
    process.exit(1);
  }
  console.log(`PASS: Fetched ${colleges.length} active colleges from live Supabase.`);

  // 2. Verify Slug Generator and Lookup
  console.log('\n[2/4] Verifying slugify and college lookup logic...');
  const glaSlug = slugifyCollege('GLA University');
  if (glaSlug !== 'gla-university') {
    console.error(`FAIL: Slugify mismatch: expected 'gla-university', got '${glaSlug}'`);
    process.exit(1);
  }
  const match = await getCollegeBySlug('gla-university', supabase);
  if (!match) {
    console.error("FAIL: getCollegeBySlug('gla-university') returned null");
    process.exit(1);
  }
  console.log(`PASS: College slug lookup verified for: "${match.name}" (ID: ${match.id})`);

  // 3. Verify createProfileAdmin with terms consent handling
  console.log('\n[3/4] Verifying createProfileAdmin handling with terms consent...');
  const testUserId = `test_compliance_verify_${Date.now()}`;
  const profileRes = await createProfileAdmin({
    id: testUserId,
    email: `${testUserId}@test.meova.in`,
    full_name: 'Compliance Verification User',
    photo_url: '',
    year: '1st',
    branch: 'Computer Science',
    interests: ['coding', 'legal-verification'],
    termsAccepted: true,
    termsVersion: '2026.1',
  });

  if (!profileRes.success) {
    console.error('FAIL: createProfileAdmin failed:', profileRes.error);
    process.exit(1);
  }
  console.log(`PASS: createProfileAdmin succeeded with terms consent (isNewUser: ${profileRes.isNewUser})`);

  // Check the created profile
  const { data: testProfile, error: getProfErr } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('id', testUserId)
    .single();

  if (getProfErr || !testProfile) {
    console.error('FAIL: Could not retrieve test profile:', getProfErr?.message);
    process.exit(1);
  }
  console.log(`PASS: Test profile confirmed in database: ${testProfile.email}`);

  // Cleanup test user
  const { error: delErr } = await supabase.from('profiles').delete().eq('id', testUserId);
  if (delErr) {
    console.warn('Notice: Could not delete test user:', delErr.message);
  } else {
    console.log('PASS: Cleaned up test profile.');
  }

  // 4. Verify Legal & Marketing Route Files
  console.log('\n[4/4] Verifying all legal & marketing route entrypoints...');
  const requiredRoutes = [
    'app/about/page.jsx',
    'app/contact/page.jsx',
    'app/terms/page.js',
    'app/privacy/page.js',
    'app/refund-policy/page.jsx',
    'app/community-guidelines/page.jsx',
    'app/grievance/page.jsx',
    'app/help/page.jsx',
    'app/blog/page.jsx',
    'app/college/[slug]/page.jsx',
    'app/ambassador/page.jsx',
    'components/LegalFooter.jsx',
  ];

  const fs = await import('fs');
  for (const route of requiredRoutes) {
    if (!fs.existsSync(route)) {
      console.error(`FAIL: Missing required route file: ${route}`);
      process.exit(1);
    }
  }
  console.log(`PASS: All ${requiredRoutes.length} route and component files exist.`);

  console.log('\n======================================================');
  console.log('ALL TESTS PASSED WITH EXIT CODE 0!');
  console.log('Live backend connectivity and compliance verified.');
  console.log('======================================================');
}

runVerification().catch((err) => {
  console.error('UNCAUGHT TEST EXCEPTION:', err);
  process.exit(1);
});
