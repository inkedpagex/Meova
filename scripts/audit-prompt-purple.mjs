import fs from 'fs';
import path from 'path';

const searchDirs = ['app', 'components', 'features', 'lib'];
const exts = ['.js', '.jsx', '.ts', '.tsx', '.css'];

// Strict prompt regex: #7C3AED, #6D28D9, bg-[#7C3AED], text-[#7C3AED], var(--accent)
const PROMPT_PURPLE_REGEX = /#7C3AED|#6D28D9|var\(--accent(?:-[a-z0-9]+)?\)/gi;

let matches = 0;
let fileCounts = {};

function scan(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.next', '.git'].includes(entry.name)) {
        scan(fullPath);
      }
    } else if (entry.isFile() && exts.includes(path.extname(entry.name))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        const found = line.match(PROMPT_PURPLE_REGEX);
        if (found) {
          matches += found.length;
          const rel = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
          fileCounts[rel] = (fileCounts[rel] || 0) + found.length;
        }
      });
    }
  }
}

for (const d of searchDirs) {
  if (fs.existsSync(d)) scan(d);
}

console.log(`PROMPT PURPLE MATCHES (#7C3AED, #6D28D9, var(--accent)): ${matches}`);
console.log('TOP FILES:');
Object.entries(fileCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .forEach(([f, c]) => console.log(`  ${f}: ${c}`));
