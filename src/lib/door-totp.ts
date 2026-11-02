import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * The rotating six-digit code (RFC 6238, the kind a phone authenticator app shows): it changes every 30 seconds.
 * Pure functions, no database, so they can be tested against the published test values.
 */
export const STEP_SECONDS = 30;

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function fromBase32(text: string): Buffer {
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of text.replace(/=+$/, "").toUpperCase()) {
    const i = B32.indexOf(ch);
    if (i < 0) throw new Error("not base32");
    value = (value << 5) | i;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export const newSecret = () => base32(randomBytes(20));

/** The code for one 30-second step. */
export function codeAt(secret: Buffer, step: number, digits = 6): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const h = createHmac("sha1", secret).update(counter).digest();
  const o = h[h.length - 1] & 15;
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 10 ** digits).padStart(digits, "0");
}

export const stepNow = (now = Date.now()) => Math.floor(now / 1000 / STEP_SECONDS);

/**
 * Checks a typed code against this step and the one either side (clocks drift). Returns the step it matched, so the
 * caller can refuse the same code a second time, or null.
 */
export function matchStep(secretBase32: string, typed: string, lastUsedStep = -1, now = Date.now()): number | null {
  const clean = typed.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(clean)) return null;
  const secret = fromBase32(secretBase32);
  const here = stepNow(now);
  let hit: number | null = null;
  for (const step of [here - 1, here, here + 1]) {
    const want = Buffer.from(codeAt(secret, step));
    const got = Buffer.from(clean);
    // Compare every candidate, so the time taken does not show which one matched.
    if (want.length === got.length && timingSafeEqual(want, got) && step > lastUsedStep) hit = step;
  }
  return hit;
}

/** The address an authenticator app reads from the QR code. */
export const otpauthUrl = (secretBase32: string, account: string, issuer = "Christhood team door") =>
  `otpauth://totp/${encodeURIComponent(`${issuer}:${account}`)}?secret=${secretBase32}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=${STEP_SECONDS}`;
