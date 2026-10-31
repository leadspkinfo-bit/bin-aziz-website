import { createHmac, timingSafeEqual } from "node:crypto";

// Time-based one-time passwords (RFC 6238) — the 6-digit codes Google Authenticator shows.

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(input: string) {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    value = (value << 5) | ALPHABET.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function codeAt(key: Buffer, counter: number) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", key).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return bin.toString().padStart(6, "0");
}

// ±1 window (±30 s) — the standard allowance for small clock differences.
const DRIFT_WINDOWS = 1;

/** True when `code` matches the current 30-second window, allowing for clock drift. */
export function verifyTotp(secret: string, code: string, now = Date.now()) {
  if (!/^\d{6}$/.test(code) || !secret) return false;
  const key = base32Decode(secret);
  const counter = Math.floor(now / 30_000);
  for (let drift = -DRIFT_WINDOWS; drift <= DRIFT_WINDOWS; drift++) {
    if (counter + drift < 0) continue;
    if (timingSafeEqual(Buffer.from(codeAt(key, counter + drift)), Buffer.from(code))) return true;
  }
  return false;
}
