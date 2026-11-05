"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { adminClient } from "@/lib/admin";
import { SPOS_TAG } from "@/lib/spos";

export type SpoResult = { ok: true } | { ok: false; message: string };
const NOT_ADMIN: SpoResult = { ok: false, message: "Your session has ended. Please log in again." };

/** Adds an SPO to the calculator's "Prepared By" list (or brings back a removed one with the same name). */
export async function addSpo(name: string): Promise<SpoResult> {
  const admin = await adminClient();
  if (!admin) return NOT_ADMIN;
  const parsed = z.string().trim().min(1).max(80).safeParse(name);
  if (!parsed.success) return { ok: false, message: "Enter a name (up to 80 letters)." };
  const clean = parsed.data.replace(/\s+/g, " ");
  // a removed SPO with the same name (any capitals) comes back with their history
  const { data: existing } = await admin.supabase.from("spos").select("id, active").ilike("name", clean.replace(/[%_\\]/g, "\\$&")).maybeSingle();
  if (existing?.active) return { ok: false, message: `${clean} is already on the list.` };
  const { error } = existing
    ? await admin.supabase.from("spos").update({ active: true }).eq("id", existing.id)
    : await admin.supabase.from("spos").insert({ name: clean });
  if (error) return { ok: false, message: error.code === "23505" ? `${clean} is already on the list.` : "Could not save. Run supabase/migrations/016_spo_activity.sql first?" };
  updateTag(SPOS_TAG);
  return { ok: true };
}

/** Removes an SPO from the "Prepared By" list (their logged quotations stay) or brings them back. */
export async function setSpoActive(id: string, active: boolean): Promise<SpoResult> {
  const admin = await adminClient();
  if (!admin) return NOT_ADMIN;
  if (!z.string().uuid().safeParse(id).success) return { ok: false, message: "Invalid request." };
  const { error } = await admin.supabase.from("spos").update({ active }).eq("id", id);
  if (error) return { ok: false, message: "Could not save." };
  updateTag(SPOS_TAG);
  return { ok: true };
}
