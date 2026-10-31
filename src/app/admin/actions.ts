"use server";

import { updateTag } from "next/cache";
import { adminClient } from "@/lib/admin";
// TEMP: hasControls is unused while the unlock is off — restore: import { grantControls, hasControls, revokeControls }
import { grantControls, revokeControls } from "@/lib/controlsUnlock";
import { SETTINGS_TAG, type SettingKey } from "@/lib/settings";
import { verifyTotp } from "@/lib/totp";

export type ToggleResult = { ok: true } | { ok: false; message: string };

/** Hidden unlock: a valid authenticator code from a signed-in admin opens the website controls. */
export async function unlockControls(code: string): Promise<{ ok: boolean }> {
  const admin = await adminClient();
  if (!admin || !verifyTotp(process.env.ADMIN_TOTP_SECRET ?? "", code)) return { ok: false };
  await grantControls(admin.userId);
  return { ok: true };
}

export async function lockControls() {
  await revokeControls();
}

export async function toggleSetting(key: SettingKey, enabled: boolean): Promise<ToggleResult> {
  // Admin role is checked here and again by the table's RLS policy; the unlock cookie is checked here.
  const admin = await adminClient();
  // TEMP (user request): authenticator unlock is off, so any signed-in admin may toggle. To restore, use:
  // if (!admin || !(await hasControls(admin.userId))) {
  if (!admin) {
    return { ok: false, message: "Controls are locked. Please unlock them again." };
  }

  const { data, error } = await admin.supabase
    .from("site_settings")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("key", key)
    .select("key");
  if (error || !data?.length) {
    console.error("toggle failed:", error?.message ?? "no row updated", key);
    return { ok: false, message: "Could not save. Please try again." };
  }

  updateTag(SETTINGS_TAG); // public pages pick up the change on their next request
  return { ok: true };
}
