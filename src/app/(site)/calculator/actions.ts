"use server";

import { checkAccessCode, checkAdminCode, grantCalculatorAccess, grantCalculatorAdmin, hasCalculatorAccess, revokeCalculatorAdmin } from "@/lib/calcAccess";

export async function unlockCalculator(code: string): Promise<{ ok: boolean }> {
  if (!checkAccessCode(code)) {
    // slows down guessing the code
    await new Promise((r) => setTimeout(r, 1000));
    return { ok: false };
  }
  await grantCalculatorAccess();
  return { ok: true };
}

/** The ADMIN button's own code; the calculator code is not enough. */
export async function unlockCalculatorAdmin(code: string): Promise<{ ok: boolean }> {
  if (!(await hasCalculatorAccess()) || !checkAdminCode(code)) {
    await new Promise((r) => setTimeout(r, 1000));
    return { ok: false };
  }
  await grantCalculatorAdmin();
  return { ok: true };
}

export async function lockCalculatorAdmin() {
  await revokeCalculatorAdmin();
}
