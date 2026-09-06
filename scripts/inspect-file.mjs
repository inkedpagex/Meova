import fs from 'fs';

const targetFile = process.argv[2];
if (!targetFile) {
  console.log('Provide a file path');
  process.exit(1);
}

const lines = fs.readFileSync(targetFile, 'utf8').split('\n');
lines.forEach((l, i) => {
  if (/7C3AED|6D28D9|purple|violet|accent/i.test(l)) {
    console.log(`${i + 1}: ${l.trim()}`);
  }
});
