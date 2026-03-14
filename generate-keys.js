const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

const pubPath = path.join(__dirname, 'public.key');
const privPath = path.join(__dirname, 'private.key');

fs.writeFileSync(pubPath, publicKey);
fs.writeFileSync(privPath, privateKey);

console.log("Successfully created public.key file and Private.key");