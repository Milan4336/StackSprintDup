import crypto from 'crypto';

export const hashPassword = (value: string): string => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(value, salt, 64).toString('hex');
  return `${salt}:${hash}`;
};

export const comparePassword = (value: string, encoded: string): boolean => {
  const [salt, hash] = encoded.split(':');
  const candidate = crypto.scryptSync(value, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'));
};
