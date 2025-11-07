import crypto from 'crypto';

/**
 * Creates a SHA-256 hash.
 */
export function sha256hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Generates a cryptographically secure random string (32 bytes = 256 bits).
 */
export function generateRandomSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generates a simple random nonce.
 */
export function generateNonce(): string {
  // A simple nonce is fine, '42' was even used in the test vector [cite: 114]
  return crypto.randomBytes(8).toString('hex');
}

/**
 * Parses the first 4 bytes (32 bits) of a hex string as a Big-Endian unsigned int.
 * This is used to seed the xorshift32 PRNG.
 */
export function seedFromHex(hexSeed: string): number {
  const buf = Buffer.from(hexSeed.substring(0, 8), 'hex');
  if (buf.length < 4) {
    throw new Error("Seed hex string is too short");
  }
  return buf.readUInt32BE(0) >>> 0;
}