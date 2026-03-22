import crypto from 'crypto';

export const hashPassword = (value: string): string => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(value, salt, 64).toString('hex');
  return `${salt}:${hash}`;
};

export const comparePassword = (value: string, encoded: string): boolean => {
  const parts = encoded.split(':');
  if (parts.length !== 2) return false;
  const [salt, hash] = parts;
  const candidate = crypto.scryptSync(value, salt, 64).toString('hex');
  const hashBuf = Buffer.from(hash, 'hex');
  const candidateBuf = Buffer.from(candidate, 'hex');
  if (hashBuf.length !== candidateBuf.length) return false;
  return crypto.timingSafeEqual(hashBuf, candidateBuf);
};
