const crypto = require('crypto');
const { execSync } = require('child_process');

const { privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

const privateKeyFormatted = privateKey.replace(/\n/g, '\\n');

try {
  console.log('Setting JWT_PRIVATE_KEY...');
  execSync(`npx convex env set JWT_PRIVATE_KEY "${privateKeyFormatted}"`);
  console.log('Setting SITE_URL...');
  execSync(`npx convex env set SITE_URL "http://localhost:3000"`);
  console.log('Done!');
} catch (e) {
  console.error('Failed to set env vars:', e.message);
}
