import fs from 'fs';
import path from 'path';

const iconsFile = fs.readFileSync('lib/icons.jsx', 'utf8');
const exportedIcons = new Set();
const exportRegex = /export\s+(?:const|function)\s+([A-Za-z0-9_]+)/g;
let match;
while ((match = exportRegex.exec(iconsFile)) !== null) {
  exportedIcons.add(match[1]);
}

let missingCount = 0;

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next') scanDir(fullPath);
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]@\/lib\/icons['"]/g;
      let impMatch;
      while ((impMatch = importRegex.exec(content)) !== null) {
        const names = impMatch[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);
        for (const name of names) {
          if (!exportedIcons.has(name)) {
            console.error('MISSING ICON:', name, 'in', fullPath);
            missingCount++;
          }
        }
      }
    }
  }
}

scanDir('app');
scanDir('components');
scanDir('features');

if (missingCount > 0) {
  console.error(`Total missing icons: ${missingCount}`);
  process.exit(1);
} else {
  console.log('SUCCESS: All icon imports across app/, components/, and features/ are valid!');
}
