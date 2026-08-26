/**
 * scripts/update-sw-version.js
 * Runs automatically before every build (via "prebuild" in package.json).
 * Injects the current UTC timestamp into public/sw.js so every deploy
 * gets a unique cache name — existing users auto-update without clearing cache.
 */

const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '..', 'public', 'sw.js');
const timestamp = new Date().toISOString().slice(0, 16); // e.g. "2026-08-26T16:06"

let content = fs.readFileSync(swPath, 'utf8');

// Replace the CACHE_VERSION line with the new timestamp
content = content.replace(
  /const CACHE_VERSION = '[^']*';/,
  `const CACHE_VERSION = '${timestamp}';`
);

fs.writeFileSync(swPath, content, 'utf8');
console.log(`✅ [SW] Cache version updated to: ${timestamp}`);
