// src/common/utils/password.util.ts
import { randomBytes, scrypt } from 'node:crypto';

const SCRYPT_CONFIG = {
  N: 16384,
  r: 16,
  p: 1,
  dkLen: 64,
} as const;

function scryptAsync(
  value: string,
  salt: string,
  options: typeof SCRYPT_CONFIG & { maxmem: number },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(value, salt, options.dkLen, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const key = await scryptAsync(password.normalize('NFKC'), salt, {
    N: SCRYPT_CONFIG.N,
    r: SCRYPT_CONFIG.r,
    p: SCRYPT_CONFIG.p,
    dkLen: SCRYPT_CONFIG.dkLen,
    maxmem: 128 * SCRYPT_CONFIG.N * SCRYPT_CONFIG.r * 2,
  });
  return `${salt}:${Buffer.from(key).toString('hex')}`;
}

export function hashPin(pin: string): Promise<string> {
  return hashPassword(pin);
}
