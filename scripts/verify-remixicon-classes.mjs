import fs from 'fs';

const css = fs.readFileSync('node_modules/remixicon/fonts/remixicon.css', 'utf8');
const iconsJs = fs.readFileSync('lib/icons.jsx', 'utf8');

const regex = /ri\('([^']+)',\s*'([^']+)'\)/g;
let match;
const invalid = [];

while ((match = regex.exec(iconsJs)) !== null) {
  const [, line, fill] = match;
  if (!css.includes(`.${line}`)) invalid.push(line);
  if (!css.includes(`.${fill}`)) invalid.push(fill);
}

console.log('Invalid ri classes in lib/icons.jsx:', [...new Set(invalid)]);
