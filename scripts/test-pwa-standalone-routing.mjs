import fs from 'fs';
import path from 'path';

// Read middleware.js and create a testable module in memory
const middlewarePath = path.resolve('middleware.js');
let code = fs.readFileSync(middlewarePath, 'utf8');
code = code.replace("from 'next/server'", "from 'next/server.js'");

const tempTestPath = path.resolve('scripts', '_temp_pwa_test.mjs');
fs.writeFileSync(tempTestPath, code, 'utf8');

const { middleware } = await import('./_temp_pwa_test.mjs');

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
    name: '1. Root /?source=pwa without auth -> redirects to /login (bypasses marketing landing)',
    req: createMockRequest('http://localhost:3000/?source=pwa'),
    verify: (res) => {
      const loc = res?.headers?.get('location');
      if (!loc || !loc.includes('/login')) throw new Error(`Expected redirect to /login, got: ${loc}`);
      return `OK: PWA unauthenticated redirected to ${loc}`;
    }
  },
  {
    name: '2. Root / with __meova_pwa=1 cookie without auth -> redirects to /login',
    req: createMockRequest('http://localhost:3000/', { '__meova_pwa': '1' }),
    verify: (res) => {
      const loc = res?.headers?.get('location');
      if (!loc || !loc.includes('/login')) throw new Error(`Expected redirect to /login, got: ${loc}`);
      return `OK: PWA installed cookie redirected to ${loc}`;
    }
  },
  {
    name: '3. Root / with normal browser (no PWA) and no auth -> passes through to public marketing (next)',
    req: createMockRequest('http://localhost:3000/'),
    verify: (res) => {
      const loc = res?.headers?.get('location');
      if (loc) throw new Error(`Expected next() for regular browser, got: ${loc}`);
      return 'OK: Public marketing allowed for regular browsers';
    }
  },
  {
    name: '4. Root /?source=pwa with valid session cookie -> allows through to FeedClient (next)',
    req: createMockRequest('http://localhost:3000/?source=pwa', { '__Meova_session': 'valid-token-12345' }),
    verify: (res) => {
      const loc = res?.headers?.get('location');
      if (loc) throw new Error(`Expected next() for authenticated PWA user, got redirect: ${loc}`);
      return 'OK: Authenticated PWA user loads feed directly';
    }
  },
  {
    name: '5. app.localhost:3000/ with __meova_pwa=1 and no auth -> stays on app login (no cross-domain bounce)',
    req: createMockRequest('http://app.localhost:3000/', { '__meova_pwa': '1' }),
    verify: (res) => {
      const loc = res?.headers?.get('location');
      if (!loc || !loc.includes('http://app.localhost:3000/login')) throw new Error(`Expected redirect to app login, got: ${loc}`);
      return `OK: App subdomain PWA retained within origin at ${loc}`;
    }
  },
  {
    name: '6. admin.localhost:3000/ without auth -> strictly redirects to root home (isolated from PWA)',
    req: createMockRequest('http://admin.localhost:3000/', { '__meova_pwa': '1' }),
    verify: (res) => {
      const loc = res?.headers?.get('location');
      if (!loc || loc !== 'http://localhost:3000/') throw new Error(`Expected redirect to http://localhost:3000/, got: ${loc}`);
      return `OK: Admin subdomain strictly isolated at ${loc}`;
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

try {
  fs.unlinkSync(tempTestPath);
} catch {}

console.log(`\n========================================`);
console.log(`PWA STANDALONE ROUTING: ${passed} passed, ${failed} failed`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
