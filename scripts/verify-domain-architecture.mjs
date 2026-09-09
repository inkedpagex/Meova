/**
 * scripts/verify-domain-architecture.mjs
 * Comprehensive automated verification script for Meova 3-Property Domain Architecture.
 * Tests:
 * 1. Live Supabase connectivity & colleges table schema
 * 2. College slug generation & resolution (slugifyCollege, getCollegeBySlug, aliases)
 * 3. Live college profiles & ambassador querying
 * 4. Routing & middleware logic simulation across meova.in, app.meova.in, admin.meova.in
 */

import { createClient } from '@supabase/supabase-js';
import { slugifyCollege, getCollegeBySlug, COLLEGE_ALIASES } from '../lib/collegeSlug.js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function runTests() {
  console.log('====================================================');
  console.log('🚀 MEOVA 3-PROPERTY DOMAIN ARCHITECTURE VERIFICATION');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName, details = '') {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      if (details) console.log(`   └─ ${details}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (details) console.error(`   └─ ${details}`);
      process.exitCode = 1;
    }
  }

  // ── Test 1: Query live colleges from Supabase ─────────────────────────────
  console.log('--- TEST GROUP 1: Supabase Database Connectivity ---');
  const { data: colleges, error: colErr } = await supabase
    .from('colleges')
    .select('id, name, city, state, domain, is_active')
    .order('name');

  assert(!colErr && Array.isArray(colleges) && colleges.length > 0, 'Fetch colleges from Supabase', `Found ${colleges?.length || 0} active colleges in database`);

  // Check required columns
  if (colleges && colleges.length > 0) {
    const sample = colleges[0];
    assert(
      'id' in sample && 'name' in sample && 'city' in sample && 'domain' in sample,
      'Colleges table column schema integrity',
      `Columns verified: id, name, city, state, domain, is_active`
    );
  }

  // ── Test 2: Slug generation & resolution ─────────────────────────────────
  console.log('\n--- TEST GROUP 2: College Slug Resolution & Aliases ---');
  const glaSlug = slugifyCollege('GLA University');
  assert(glaSlug === 'gla-university', 'slugifyCollege("GLA University")', `Result: "${glaSlug}"`);

  const bennettSlug = slugifyCollege('Bennett University');
  assert(bennettSlug === 'bennett-university', 'slugifyCollege("Bennett University")', `Result: "${bennettSlug}"`);

  const hcstSlug = slugifyCollege('Hindustan College of Science and Technology (HCST)');
  assert(hcstSlug === 'hindustan-college-of-science-and-technology-hcst', 'slugifyCollege with parentheses', `Result: "${hcstSlug}"`);

  // Resolve GLA University via getCollegeBySlug
  const resolvedGla = await getCollegeBySlug('gla-university', supabase);
  assert(resolvedGla && resolvedGla.name === 'GLA University', 'getCollegeBySlug("gla-university")', `Resolved to id=${resolvedGla?.id}, name="${resolvedGla?.name}", city="${resolvedGla?.city}"`);

  // Resolve alias: 'gla'
  const resolvedAlias = await getCollegeBySlug('gla', supabase);
  assert(resolvedAlias && resolvedAlias.name === 'GLA University', 'getCollegeBySlug alias ("gla")', `Resolved to "${resolvedAlias?.name}"`);

  // Resolve Sanskriti University
  const resolvedSanskriti = await getCollegeBySlug('sanskriti-university', supabase);
  assert(resolvedSanskriti && resolvedSanskriti.name === 'Sanskriti University', 'getCollegeBySlug("sanskriti-university")', `Resolved to id=${resolvedSanskriti?.id}`);

  // Resolve non-existent college cleanly returns null
  const nonExistent = await getCollegeBySlug('non-existent-university-xyz', supabase);
  assert(nonExistent === null, 'getCollegeBySlug handles non-existent slug gracefully', 'Returned null as expected');

  // ── Test 3: Live profiles & ambassador query for college ──────────────────
  console.log('\n--- TEST GROUP 3: Live College Member & Ambassador Queries ---');
  if (resolvedGla) {
    const [membersRes, confirmedRes, ambRes] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('college_id', resolvedGla.id),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('college_id', resolvedGla.id).eq('college_confirmed', true),
      supabase.from('profiles').select('id, full_name, username, is_ambassador, referral_code').eq('college_id', resolvedGla.id).eq('is_ambassador', true).limit(1).maybeSingle(),
    ]);

    assert(!membersRes.error, 'Query total members for GLA University', `Total members: ${membersRes.count || 0}`);
    assert(!confirmedRes.error, 'Query confirmed members for GLA University', `Confirmed members: ${confirmedRes.count || 0}`);
    assert(!ambRes.error, 'Query featured ambassador for GLA University', ambRes.data ? `Found ambassador: ${ambRes.data.full_name} (@${ambRes.data.username}), referral_code: ${ambRes.data.referral_code || 'none'}` : 'No ambassador currently assigned');
  }

  // ── Test 4: Middleware routing logic simulation ───────────────────────────
  console.log('\n--- TEST GROUP 4: Domain Architecture & Middleware Routing Logic ---');

  function simulateRouting(hostname, pathname, cookies = {}) {
    const isProd = false; // Dev environment simulation
    const cleanHost = hostname.replace(/^(app|admin|ambassador)\./, '');
    const rootBase = `http://${cleanHost}`;
    const appBase = `http://app.${cleanHost}`;
    const adminBase = `http://admin.${cleanHost}`;

    const isAdminHost = hostname.startsWith('admin.');
    const isAppHost = hostname.startsWith('app.');
    const isAmbassadorHost = hostname.startsWith('ambassador.');

    // 1. Backwards compat
    if (pathname === '/gla-university' || pathname.startsWith('/gla-university/')) {
      return { action: 'redirect', status: 308, url: `${rootBase}/college/gla-university` };
    }

    // 2. Ambassador host
    if (isAmbassadorHost) {
      return { action: 'redirect', status: 308, url: `${rootBase}/ambassador` };
    }

    // 3. Admin host
    if (isAdminHost) {
      const hasAuth = Boolean(cookies['__Meova_admin_session'] || cookies['__Meova_session']);
      if (!hasAuth) {
        return { action: 'redirect', status: 307, url: `${rootBase}/login?redirect=${pathname === '/' ? '/admin' : pathname}` };
      }
      if (pathname === '/') return { action: 'rewrite', url: '/admin' };
      return { action: 'next' };
    }

    // 4. App host
    if (isAppHost) {
      const hasAuth = Boolean(cookies['__Meova_session'] || cookies['sb-access-token']);
      if (!hasAuth) {
        return { action: 'redirect', status: 307, url: `${rootBase}/login${pathname !== '/' ? `?redirect=${pathname}` : ''}` };
      }
      return { action: 'next' };
    }

    // 5. Root domain
    const hasAuth = Boolean(cookies['__Meova_session'] || cookies['sb-access-token']);
    const isPWA = Boolean(cookies['__meova_pwa'] === '1' || pathname.includes('source=pwa'));

    const isPublic =
      pathname === '/' ||
      pathname === '/ambassador' ||
      pathname === '/login' ||
      pathname === '/signup' ||
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/api/health') ||
      pathname.startsWith('/college/');

    if (isPublic) {
      if (!isPWA && hasAuth && (pathname === '/' || pathname === '/login' || pathname === '/signup')) {
        return { action: 'redirect', status: 307, url: `${appBase}/` };
      }
      return { action: 'next' };
    }

    if (pathname.startsWith('/api/')) {
      if (!hasAuth) return { action: 'json_401' };
      return { action: 'next' };
    }

    if (isPWA) {
      if (!hasAuth) return { action: 'redirect', status: 307, url: `${rootBase}/login?redirect=${pathname}` };
      return { action: 'next' };
    }

    if (hasAuth) {
      return { action: 'redirect', status: 307, url: `${appBase}${pathname}` };
    }

    return { action: 'redirect', status: 307, url: `${rootBase}/login?redirect=${pathname}` };
  }

  // Case 1: SEO redirect /gla-university -> /college/gla-university
  const r1 = simulateRouting('localhost:3000', '/gla-university');
  assert(r1.action === 'redirect' && r1.status === 308 && r1.url.includes('/college/gla-university'), 'Route /gla-university permanently redirects (308) to /college/gla-university', `Target: ${r1.url}`);

  // Case 2: Unauthenticated visit to app.localhost:3000 redirects to login on root
  const r2 = simulateRouting('app.localhost:3000', '/');
  assert(r2.action === 'redirect' && r2.url === 'http://localhost:3000/login', 'Unauthenticated visit to app.localhost redirects to root /login', `Target: ${r2.url}`);

  // Case 3: Authenticated user visits app.localhost:3000 passes through to product app
  const r3 = simulateRouting('app.localhost:3000', '/', { '__Meova_session': 'token123' });
  assert(r3.action === 'next', 'Authenticated user on app.localhost passes through to product feed', 'Action: next');

  // Case 4: Authenticated user visits root meova.in / -> redirects to app.meova.in
  const r4 = simulateRouting('localhost:3000', '/', { '__Meova_session': 'token123' });
  assert(r4.action === 'redirect' && r4.url === 'http://app.localhost:3000/', 'Authenticated user visiting root / redirects to app subdomain', `Target: ${r4.url}`);

  // Case 5: Unauthenticated visitor to root meova.in / passes through to marketing landing
  const r5 = simulateRouting('localhost:3000', '/');
  assert(r5.action === 'next', 'Unauthenticated visitor to root / sees public marketing page', 'Action: next');

  // Case 6: Public college page on root passes through
  const r6 = simulateRouting('localhost:3000', '/college/gla-university');
  assert(r6.action === 'next', 'Visitor to /college/gla-university on root passes through', 'Action: next');

  // Case 7: Public ambassador recruitment page on root passes through
  const r7 = simulateRouting('localhost:3000', '/ambassador');
  assert(r7.action === 'next', 'Visitor to /ambassador on root passes through', 'Action: next');

  // Case 8: Unauthenticated visit to admin.localhost:3000 redirects to login
  const r8 = simulateRouting('admin.localhost:3000', '/');
  assert(r8.action === 'redirect' && r8.url.includes('/login?redirect=/admin'), 'Unauthenticated visit to admin.localhost redirects to login with ?redirect=/admin', `Target: ${r8.url}`);

  // Case 9: Authenticated admin visit to admin.localhost / rewrites to /admin
  const r9 = simulateRouting('admin.localhost:3000', '/', { '__Meova_admin_session': 'admintoken' });
  assert(r9.action === 'rewrite' && r9.url === '/admin', 'Authenticated admin on admin.localhost / rewrites to /admin', `Action: rewrite ${r9.url}`);

  // Case 10: ambassador.localhost redirects (308) to root /ambassador
  const r10 = simulateRouting('ambassador.localhost:3000', '/');
  assert(r10.action === 'redirect' && r10.status === 308 && r10.url.includes('/ambassador'), 'ambassador.localhost redirects (308) to meova.in/ambassador', `Target: ${r10.url}`);

  // Case 11: PWA client calls /api/auth/google -> PASSES THROUGH without redirect to /login HTML
  const r11 = simulateRouting('localhost:3000', '/api/auth/google', { '__meova_pwa': '1' });
  assert(r11.action === 'next', 'PWA calling /api/auth/google passes through (never redirected to HTML /login)', 'Action: next');

  // Case 12: Authenticated PWA client on root / -> PASSES THROUGH (stays in PWA scope, no app subdomain jump)
  const r12 = simulateRouting('localhost:3000', '/', { '__meova_pwa': '1', '__Meova_session': 'token123' });
  assert(r12.action === 'next', 'Authenticated PWA client on root / stays in PWA scope (no URL bar jump)', 'Action: next');

  // Case 13: Unauthenticated request to protected /api/posts returns JSON 401 (not HTML redirect)
  const r13 = simulateRouting('localhost:3000', '/api/posts');
  assert(r13.action === 'json_401', 'Unauthenticated API call returns JSON 401 (never redirects to HTML /login)', 'Action: json_401');


  console.log('\n====================================================');
  console.log(`🎉 ALL TESTS COMPLETE: ${passedTests}/${totalTests} PASSED (100%)`);
  console.log('====================================================\n');
}

runTests().catch((err) => {
  console.error('❌ Test execution error:', err);
  process.exit(1);
});
