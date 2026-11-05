import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// The calculator opens only after the 6-digit access code (env CALCULATOR_ACCESS_CODE) is entered.
// The cookie holds a hash of the code, so changing the code locks everyone out again.

const COOKIE = "calc_access";
const MAX_AGE = 60 * 60 * 12; // 12 hours

function token(code: string) {
  return createHmac("sha256", code).update("bin-aziz-calculator").digest("hex");
}

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkAccessCode(code: string) {
  const expected = process.env.CALCULATOR_ACCESS_CODE ?? "";
  return /^\d{6}$/.test(code) && expected.length > 0 && same(code, expected);
}

export async function grantCalculatorAccess() {
  (await cookies()).set(COOKIE, token(process.env.CALCULATOR_ACCESS_CODE ?? ""), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

/*
 * The calculator's ADMIN button (rate scans, saving quotations) has its own 6-digit code, env
 * CALCULATOR_ADMIN_CODE, so the calculator code alone never opens it — not even in a browser that is
 * signed in as a site admin. It is checked on the server and kept in its own cookie only while the ADMIN
 * panel is in use (user request 2026-11-05): closing the panel, going back, reloading or leaving the page
 * locks it again (see Calculator.tsx); 30 minutes is only a safety net for a tab left open.
 */
const ADMIN_COOKIE = "calc_admin";
const ADMIN_MAX_AGE = 60 * 30;
const adminToken = (code: string) => createHmac("sha256", code).update("bin-aziz-calculator-admin").digest("hex");

export function checkAdminCode(code: string) {
  const expected = process.env.CALCULATOR_ADMIN_CODE ?? "";
  return /^\d{6}$/.test(code) && expected.length > 0 && same(code, expected);
}

export async function grantCalculatorAdmin() {
  (await cookies()).set(ADMIN_COOKIE, adminToken(process.env.CALCULATOR_ADMIN_CODE ?? ""), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_MAX_AGE,
  });
}

export async function revokeCalculatorAdmin() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function hasCalculatorAdmin() {
  const code = process.env.CALCULATOR_ADMIN_CODE;
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  return Boolean(code && value && same(value, adminToken(code)));
}

export async function hasCalculatorAccess() {
  const code = process.env.CALCULATOR_ACCESS_CODE;
  const value = (await cookies()).get(COOKIE)?.value;
  return Boolean(code && value && same(value, token(code)));
}
