import fs from 'node:fs';

const file = 'src/server/auth.ts';
let source = fs.readFileSync(file, 'utf8');
const legacy = "secure: config.nodeEnv === 'production',";
const hardened = "secure: config.nodeEnv === 'production' && /^https:/i.test(config.appUrl),";

if (source.includes(legacy)) {
  source = source.split(legacy).join(hardened);
  fs.writeFileSync(file, source);
  console.log('v30.10.9 session cookie security now follows the configured public protocol.');
} else {
  console.log('v30.10.9 session cookie protocol handling already applied.');
}

const count = source.split(hardened).length - 1;
if (count !== 2) {
  throw new Error(`v30.10.9 expected two protocol-aware session cookie settings, found ${count}.`);
}
if (source.includes(legacy)) {
  throw new Error('v30.10.9 legacy NODE_ENV-only Secure cookie rule remains.');
}
