import crypto from 'node:crypto';
import fs from 'node:fs';

export function sha1(str) {
  return crypto.createHash('sha1').update(str).digest('hex');
}

export function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

export function fileSha256(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

export function lineHash(provider, voice, rate, spoken) {
  return sha1(`${provider}|${voice}|${rate}|${spoken}`);
}

