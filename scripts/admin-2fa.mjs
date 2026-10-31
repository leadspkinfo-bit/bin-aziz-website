// Creates (once) the secret behind the hidden admin unlock and prints how to
// add it to Google Authenticator. Run:  npm run admin:2fa
// The secret is stored only in .env.local (git-ignored) — never commit it.
import { randomBytes } from "node:crypto";
import { appendFileSync, existsSync, readFileSync } from "node:fs";

const ENV = ".env.local";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32(buf) {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

const current = existsSync(ENV) ? readFileSync(ENV, "utf8") : "";
let secret = current.match(/^ADMIN_TOTP_SECRET=(\S+)/m)?.[1];

if (secret) {
  console.log("\nA secret already exists in .env.local — showing it again.\n");
} else {
  secret = base32(randomBytes(20));
  appendFileSync(ENV, `${current.endsWith("\n") || !current ? "" : "\n"}# Hidden admin unlock (Google Authenticator). Keep private.\nADMIN_TOTP_SECRET=${secret}\n`);
  console.log("\nNew secret saved to .env.local.\n");
}

const label = encodeURIComponent("Bin Aziz Admin");
console.log("Google Authenticator → + → Enter a setup key");
console.log("  Account name : Bin Aziz Admin");
console.log(`  Your key     : ${secret.match(/.{1,4}/g).join(" ")}`);
console.log("  Type of key  : Time based\n");
console.log(`(Or paste into any authenticator that accepts links: otpauth://totp/${label}?secret=${secret}&issuer=${label})\n`);
console.log("Restart `npm run dev` after creating the secret. On Vercel, add ADMIN_TOTP_SECRET with the same value.\n");
