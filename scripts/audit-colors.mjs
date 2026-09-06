import fs from 'fs';
import path from 'path';

const searchDirs = ['app', 'components', 'features', 'lib'];
const exts = ['.js', '.jsx', '.ts', '.tsx', '.css'];

// Comprehensive regex for color tokens
const HEX_REGEX = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g;
const TW_COLOR_REGEX = /\b(?:bg|text|border|fill|stroke|ring|from|to|via)-(?:white|black|stone|zinc|neutral|gray|slate|purple|emerald|green|rose|red|amber|yellow|blue|indigo|violet|cyan)-[0-9]{2,3}\b/g;
const TW_BASIC_REGEX = /\b(?:bg|text|border|ring)-(?:white|black)\b/g;
const CSS_VAR_REGEX = /var\(--(?:bg-[a-z0-9-]+|text-[a-z0-9-]+|border-[a-z0-9-]+|accent(?:-[a-z0-9]+)?)\)/g;

let totalColors = 0;
let purpleCount = 0;
let blackWhiteCount = 0;
let darkPurpleCount = 0;
let perFilePurple = {};

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
      lines.forEach((line, idx) => {
        // Hex matches
        const hexes = line.match(HEX_REGEX) || [];
        // Tailwind matches
        const tws = line.match(TW_COLOR_REGEX) || [];
        const twBasics = line.match(TW_BASIC_REGEX) || [];
        const vars = line.match(CSS_VAR_REGEX) || [];

        const all = [...hexes, ...tws, ...twBasics, ...vars];
        totalColors += all.length;

        for (const item of all) {
          if (/7C3AED|6D28D9|purple|violet|accent/i.test(item)) {
            purpleCount++;
            const rel = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
            perFilePurple[rel] = (perFilePurple[rel] || 0) + 1;
            if (/dark:/i.test(line)) {
              darkPurpleCount++;
            }
          }
          if (/white|black|#FFFFFF|#000000|#1C1917|#0D0D0D|#141414/i.test(item)) {
            blackWhiteCount++;
          }
        }
      });
    }
  }
}

for (const d of searchDirs) {
  if (fs.existsSync(d)) scan(d);
}

const purplePercent = ((purpleCount / totalColors) * 100).toFixed(2);
const bwPercent = ((blackWhiteCount / totalColors) * 100).toFixed(2);

console.log('----------------------------------------------------');
console.log(`TOTAL COLOR INSTANCES: ${totalColors}`);
console.log(`PURPLE INSTANCES:      ${purpleCount} (${purplePercent}%)`);
console.log(`BLACK/WHITE INSTANCES: ${blackWhiteCount} (${bwPercent}%)`);
console.log(`DARK-THEME PURPLE:     ${darkPurpleCount}`);
console.log('----------------------------------------------------');
console.log('TOP PURPLE FILES:');
Object.entries(perFilePurple)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .forEach(([f, c]) => console.log(`  ${f}: ${c}`));
