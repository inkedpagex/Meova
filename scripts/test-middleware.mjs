// Automated test for middleware subdomain routing logic
import fs from 'fs';
import path from 'path';

// Read middleware.js and create a testable module in memory
const middlewarePath = path.resolve('middleware.js');
let code = fs.readFileSync(middlewarePath, 'utf8');
code = code.replace("from 'next/server'", "from 'next/server.js'");

const tempTestPath = path.resolve('scripts', '_temp_middleware_test.mjs');
fs.writeFileSync(tempTestPath, code, 'utf8');

const { middleware } = await import('./_temp_middleware_test.mjs');

function createMockRequest(urlStr, cookies = {}) {
  const url = new URL(urlStr);
  const cookieList = Object.entries(cookies).map(([name, value]) => ({ name, value }));

  return {
    nextUrl: url,
    url: urlStr,
    headers: {
      get(headerName) {
        if (headerName.toLowerCase() === 'host') return url.host;
        return null;
      }
    },
    cookies: {
      getAll() {
        return cookieList;
      },
      get(name) {
        const found = cookieList.find(c => c.name === name);
        return found ? found : undefined;
      }
    }
  };
}

const tests = [
  {
    name: '1. app.localhost:3000/login with NO cookie -> should NOT redirect (200/next)',
    req: createMockRequest('http://app.localhost:3000/login'),
    verify: (res) => {
      const loc = res?.headers?.get('location');
      if (loc) throw new Error(`Expected next() but got redirect to: ${loc}`);
      return 'OK: Allowed on /login without redirect loop';
    }
  },
  {
    name: '2. app.localhost:3000/login?redirect=/login with NO cookie -> should NOT redirect',
    req: createMockRequest('http://app.localhost:3000/login?redirect=%2Flogin'),
    verify: (res) => {
      const loc = res?.headers?.get('location');
      if (loc) throw new Error(`Expected next() but got redirect to: ${loc}`);
      return 'OK: Did not loop on /login?redirect=/login';
    }
  },
  {
    name: '3. app.localhost:3000/ with NO cookie -> should redirect to /login',
    req: createMockRequest('http://app.localhost:3000/'),
    verify: (res) => {
      const loc = res?.headers?.get('location');
      if (!loc || !loc.includes('/login')) throw new Error(`Expected redirect to /login, got: ${loc}`);
      if (loc.includes('redirect')) throw new Error(`Should not attach redirect for root /, got: ${loc}`);
      return `OK: Redirected to ${loc}`;
    }
  },
  {
    name: '4. app.localhost:3000/feed with NO cookie -> should redirect to /login?redirect=/feed',
    req: createMockRequest('http://app.localhost:3000/feed'),
    verify: (res) => {
      const loc = res?.headers?.get('location');
      if (!loc || !loc.includes('redirect=%2Ffeed')) throw new Error(`Expected redirect with ?redirect=/feed, got: ${loc}`);
      return `OK: Redirected to ${loc}`;
    }
  },
  {
    name: '5. app.localhost:3000/ with valid cookie -> should allow through (next)',
    req: createMockRequest('http://app.localhost:3000/', { '__Meova_session': 'valid-session-jwt-token-12345' }),
    verify: (res) => {
      const loc = res?.headers?.get('location');
      if (loc) throw new Error(`Expected next() for authenticated user on app root, got redirect: ${loc}`);
      return 'OK: Allowed authenticated user onto app root';
    }
  },
  {
    name: '6. localhost:3000/ (root marketing) with NO cookie -> should allow through (next)',
    req: createMockRequest('http://localhost:3000/'),
    verify: (res) => {
      const loc = res?.headers?.get('location');
      if (loc) throw new Error(`Expected next() for public marketing home, got redirect: ${loc}`);
      return 'OK: Marketing home loads without auth';
    }
  },
  {
    name: '7. localhost:3000/login with NO cookie -> should allow through (next)',
    req: createMockRequest('http://localhost:3000/login'),
    verify: (res) => {
      const loc = res?.headers?.get('location');
      if (loc) throw new Error(`Expected next() for public login page, got redirect: ${loc}`);
      return 'OK: Public login loads';
    }
  },
  {
    name: '8. admin.localhost:3000/login with NO cookie -> should allow through (next)',
    req: createMockRequest('http://admin.localhost:3000/login'),
    verify: (res) => {
      const loc = res?.headers?.get('location');
      if (loc) throw new Error(`Expected next() on admin login, got redirect: ${loc}`);
      return 'OK: Admin login accessible';
    }
  },
  {
    name: '9. admin.localhost:3000/ with NO cookie -> should redirect to main homepage',
    req: createMockRequest('http://admin.localhost:3000/'),
    verify: (res) => {
      const loc = res?.headers?.get('location');
      if (!loc || loc !== 'http://localhost:3000/') throw new Error(`Expected redirect to http://localhost:3000/, got: ${loc}`);
      return `OK: Admin unauthenticated redirected directly to ${loc}`;
    }
  },
  {
    name: '10. ambassador.localhost:3000/ -> should redirect to /ambassador on root',
    req: createMockRequest('http://ambassador.localhost:3000/'),
    verify: (res) => {
      const loc = res?.headers?.get('location');
      if (!loc || !loc.includes('http://localhost:3000/ambassador')) throw new Error(`Expected redirect to root ambassador, got: ${loc}`);
      return `OK: Ambassador subdomain consolidated to ${loc}`;
    }
  },
  {
    name: '11. localhost:3000/discover with valid cookie in dev -> should allow through (next), NO bounce to app.localhost',
    req: createMockRequest('http://localhost:3000/discover', { '__Meova_session': 'valid-token-12345' }),
    verify: (res) => {
      const loc = res?.headers?.get('location');
      if (loc) throw new Error(`Expected next() but got redirect to: ${loc}`);
      return 'OK: Authenticated user stays on localhost:3000/discover without losing session';
    }
  },
  {
    name: '12. localhost:3000/discover with NO cookie -> should redirect to /login?redirect=/discover on localhost',
    req: createMockRequest('http://localhost:3000/discover'),
    verify: (res) => {
      const loc = res?.headers?.get('location');
      if (!loc || !loc.includes('redirect=%2Fdiscover')) throw new Error(`Expected redirect to login?redirect=/discover, got: ${loc}`);
      return `OK: Unauthenticated user redirected to: ${loc}`;
    }
  }
];

let passed = 0;
let failed = 0;

for (const t of tests) {
  try {
    const res = middleware(t.req);
    const msg = t.verify(res);
    console.log(`PASS: ${t.name}`);
    console.log(`      ${msg}`);
    passed++;
  } catch (err) {
    console.error(`FAIL: ${t.name}`);
    console.error(`      Error: ${err.message}`);
    failed++;
  }
}

// Clean up temp file
try {
  fs.unlinkSync(tempTestPath);
} catch {}

console.log(`\n========================================`);
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
