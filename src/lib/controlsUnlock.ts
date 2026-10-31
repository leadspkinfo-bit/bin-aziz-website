import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// After the admin types a valid authenticator code, a short-lived signed cookie
// unlocks the hidden website controls. It is bound to the admin's user id and
// signed with ADMIN_TOTP_SECRET, so it can't be forged or reused by another account.

const COOKIE = "ba_ctl";
const TTL_MS = 15 * 60 * 1000;

function sign(payload: string) {
  return createHmac("sha256", process.env.ADMIN_TOTP_SECRET ?? "").update(payload).digest("base64url");
}

export async function grantControls(userId: string) {
  const expires = Date.now() + TTL_MS;
  const payload = `${userId}.${expires}`;
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: TTL_MS / 1000,
  });
}

export async function revokeControls() {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
}

export async function hasControls(userId: string) {
  if (!process.env.ADMIN_TOTP_SECRET) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  const [id, expires, mac] = value.split(".");
  if (id !== userId || !expires || !mac || Number(expires) < Date.now()) return false;
  const expected = Buffer.from(sign(`${id}.${expires}`));
  const given = Buffer.from(mac);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
