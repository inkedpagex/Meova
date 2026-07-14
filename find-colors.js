const fs = require('fs');
const path = require('path');

function walk(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walk(filePath, files);
    } else if (/\.(js|jsx|tsx)$/.test(filePath)) {
      files.push(filePath);
    }
  }
  return files;
}

const files = [...walk('app'), ...walk('components'), ...walk('features')];
const classNames = new Set();
const fileMap = {};

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Match both className="..." and className={`...`}
  const matches = content.match(/className=(?:["']([^"']+)["']|\{`([^`]+)`\})/g);
  if (matches) {
    matches.forEach(m => {
      const clsString = m.replace(/className=/, '').replace(/^["'`{|]+|["'`}]+$/g, '');
      clsString.split(/\s+/).forEach(c => {
        if (c.startsWith('text-') || c.startsWith('bg-') || c.startsWith('border-')) {
          classNames.add(c);
          if (!fileMap[c]) fileMap[c] = new Set();
          fileMap[c].add(file);
        }
      });
    });
  }
});

const sortedColors = Array.from(classNames).sort();
console.log('--- FOUND COLOR CLASSES ---');
sortedColors.forEach(c => {
  console.log(`${c} (in ${fileMap[c].size} files)`);
});
