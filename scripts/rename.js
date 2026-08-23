const fs = require('fs');
const path = require('path');

const dirsToScan = ['app', 'components', 'features', 'lib', 'utils', 'public'];
const extensions = ['.js', '.jsx', '.ts', '.tsx', '.css', '.json', '.html'];

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Replace double 'y' first so it doesn't get matched by single 'y'
  content = content.replace(/Meetifyy/g, 'Meetuply');
  content = content.replace(/meetifyy/g, 'meetuply');
  
  // Replace single 'y'
  content = content.replace(/Meetify/g, 'Meetuply');
  content = content.replace(/meetify/g, 'meetuply');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else {
      if (extensions.some(ext => fullPath.endsWith(ext))) {
        replaceInFile(fullPath);
      }
    }
  }
}

dirsToScan.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(fullPath)) scanDir(fullPath);
});

console.log('Renaming complete.');
