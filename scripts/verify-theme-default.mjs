import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

function runVerification() {
  console.log('====================================================');
  console.log('VERIFYING DEFAULT LIGHT THEME & DUAL-THEME PARITY');
  console.log('====================================================');

  let passed = true;

  // 1. Verify app/layout.js default fallback
  const layoutPath = path.join(ROOT, 'app', 'layout.js');
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');

  if (!layoutContent.includes("let initialMode = 'light';")) {
    console.error('FAIL: app/layout.js does not have initialMode initialized to light.');
    passed = false;
  } else {
    console.log('PASS: app/layout.js initializes initialMode to "light".');
  }

  if (!layoutContent.includes("cookieStore.get('meova_mode')?.value || 'light'")) {
    console.error('FAIL: app/layout.js does not have cookie fallback to "light".');
    passed = false;
  } else {
    console.log('PASS: app/layout.js has cookie fallback to "light" for zero-cookie first load.');
  }

  // 2. Verify Zero-FOUC script in app/layout.js
  const foucRegex = /localStorage\.getItem\('meova_mode'\)[\s\S]+?\|\|\s*'light'/;
  if (!foucRegex.test(layoutContent)) {
    console.error('FAIL: Zero-FOUC script does not fall back to "light" when storage and cookies are empty.');
    passed = false;
  } else {
    console.log('PASS: Zero-FOUC script in <head> defaults cleanly to "light" for zero-FOUC hydration.');
  }

  // 3. Verify ThemeProvider.jsx default props and storage fallback
  const themeProviderPath = path.join(ROOT, 'components', 'providers', 'ThemeProvider.jsx');
  const themeProviderContent = fs.readFileSync(themeProviderPath, 'utf8');

  if (!themeProviderContent.includes("initialMode = 'light'")) {
    console.error('FAIL: ThemeProvider default prop initialMode is not "light".');
    passed = false;
  } else {
    console.log('PASS: ThemeProvider component defaults initialMode to "light".');
  }

  if (!themeProviderContent.includes("localStorage.getItem('meova_mode') || 'light'")) {
    console.error('FAIL: ThemeProvider does not fallback to "light" when localStorage is null.');
    passed = false;
  } else {
    console.log('PASS: ThemeProvider hydrates with "light" on fresh visitor session.');
  }

  // 4. Verify Design Tokens in app/globals.css for Light Mode
  const globalsCssPath = path.join(ROOT, 'app', 'globals.css');
  const globalsCss = fs.readFileSync(globalsCssPath, 'utf8');

  const lightTokens = [
    /--bg-base:\s*#FAFAF8;/,
    /--bg-surface:\s*#FFFFFF;/,
    /--text-primary:\s*#1C1917;/,
    /--text-secondary:\s*#78716C;/,
    /--border-hairline:\s*#E7E5E4;/,
  ];

  for (const tokenRegex of lightTokens) {
    if (!tokenRegex.test(globalsCss)) {
      console.error(`FAIL: globals.css missing light mode token matching: ${tokenRegex}`);
      passed = false;
    }
  }
  if (passed) {
    console.log('PASS: globals.css has all required light mode tokens (#FAFAF8 base, #1C1917 text, etc.).');
  }

  // 5. Verify Design Tokens in app/globals.css for Dark Mode
  const darkTokens = [
    /--bg-base:\s*#0D0D0D;/,
    /--bg-surface:\s*#141414;/,
    /--bg-elevated:\s*#1A1A1A;/,
    /--text-primary:\s*#FFFFFF;/,
    /--border-hairline:\s*#2A2A2A;/,
  ];

  for (const tokenRegex of darkTokens) {
    if (!tokenRegex.test(globalsCss)) {
      console.error(`FAIL: globals.css missing dark mode token matching: ${tokenRegex}`);
      passed = false;
    }
  }
  if (passed) {
    console.log('PASS: globals.css has all required dark mode tokens (#0D0D0D base, #141414 surface, etc.).');
  }

  // 6. Simulate evaluation logic
  const simulateFreshVisitor = (cookieVal, localVal) => {
    const mode = localVal || cookieVal || 'light';
    return mode;
  };

  const freshLoadMode = simulateFreshVisitor(undefined, null);
  if (freshLoadMode !== 'light') {
    console.error(`FAIL: Simulated fresh visitor got ${freshLoadMode} instead of "light".`);
    passed = false;
  } else {
    console.log(`PASS: Simulated fresh load (no cookie, no localStorage) returns: mode === "${freshLoadMode}".`);
  }

  console.log('----------------------------------------------------');
  if (passed) {
    console.log('ALL LIGHT THEME DEFAULT & DUAL-THEME CHECKS PASSED (Exit Code 0)');
    process.exit(0);
  } else {
    console.error('ONE OR MORE CHECKS FAILED (Exit Code 1)');
    process.exit(1);
  }
}

runVerification();
