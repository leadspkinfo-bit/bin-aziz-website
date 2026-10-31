"use server";

import { adminClient } from "@/lib/admin";

export type InquiryStatus = "new" | "contacted" | "closed";
export type ActionResult = { ok: true } | { ok: false; message: string };

const STATUSES: InquiryStatus[] = ["new", "contacted", "closed"];
const DENIED = { ok: false, message: "Only admins can do this. Please log in again." } as const;

export async function setInquiryStatus(id: string, status: InquiryStatus): Promise<ActionResult> {
  if (!STATUSES.includes(status)) return { ok: false, message: "Unknown status." };
  const admin = await adminClient();
  if (!admin) return DENIED;

  const { data, error } = await admin.supabase.from("inquiries").update({ status }).eq("id", id).select("id");
  if (error || !data?.length) {
    console.error("inquiry status update failed:", error?.message ?? "no row updated");
    return { ok: false, message: "Could not save. Please try again." };
  }
  return { ok: true };
}

export async function deleteInquiry(id: string): Promise<ActionResult> {
  const admin = await adminClient();
  if (!admin) return DENIED;

  const { data, error } = await admin.supabase.from("inquiries").delete().eq("id", id).select("id");
  if (error || !data?.length) {
    console.error("inquiry delete failed:", error?.message ?? "no row deleted");
    return { ok: false, message: "Could not delete. Please try again." };
  }
  return { ok: true };
}
