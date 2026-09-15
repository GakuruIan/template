import { randomBytes, randomInt, scrypt, timingSafeEqual } from 'node:crypto';

const SCRYPT_PREFIX = 'scrypt';
const SCRYPT_KEY_LENGTH = 32;

function scryptAsync(value: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(value, salt, SCRYPT_KEY_LENGTH, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });
}

export function generatePairingCode(): string {
  const code = randomInt(0, 1_000_000);
  return code.toString().padStart(6, '0');
}

const normalizeCode = (code: string) => code.trim().normalize('NFKC');

export async function hashCode(code: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const key = await scryptAsync(normalizeCode(code), salt);

  return `${SCRYPT_PREFIX}:${salt}:${Buffer.from(key).toString('hex')}`;
}

export async function verifyCode(
  code: string,
  hashedCode: string,
): Promise<boolean> {
  const [prefix, salt, storedKey] = hashedCode.split(':');

  if (prefix !== SCRYPT_PREFIX || !salt || !storedKey) {
    return false;
  }

  const key = await scryptAsync(normalizeCode(code), salt);
  const stored = Buffer.from(storedKey, 'hex');
  const derived = Buffer.from(key);

  return stored.length === derived.length && timingSafeEqual(stored, derived);
}
