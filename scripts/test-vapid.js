const webpush = require('web-push');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    value = value.trim().replace(/^['"]|['"]$/g, '');
    env[match[1]] = value;
  }
});

const publicKey = (env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').trim();
const privateKey = (env.VAPID_PRIVATE_KEY || '').trim();
const subject = (env.VAPID_SUBJECT || 'mailto:support@meova.in').trim();

console.log('Public Key:', publicKey.slice(0, 10) + '...', 'Length:', publicKey.length);
console.log('Private Key:', privateKey.slice(0, 6) + '...', 'Length:', privateKey.length);
console.log('Subject:', subject);

try {
  webpush.setVapidDetails(subject, publicKey, privateKey);
  console.log('✅ VAPID setup SUCCESS!');
} catch (e) {
  console.error('❌ VAPID setup FAILED:', e.message);
}
