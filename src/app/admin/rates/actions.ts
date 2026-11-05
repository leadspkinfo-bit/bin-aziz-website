"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { adminClient } from "@/lib/admin";
import { applyScan } from "@/lib/calc/applyScan";
import { RATES_TAG, ROOM_TYPES } from "@/lib/calc/constants";
import type { NormalizedScan, ScanRate } from "@/lib/gemini/normalize";

export type Result = { ok: true; id?: string } | { ok: false; message: string };

const NOT_ADMIN: Result = { ok: false, message: "Your session has ended. Please log in again." };
const FAILED: Result = { ok: false, message: "Could not save. Please try again." };

const slugOf = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_");

// exact riyals, decimals allowed (e.g. 46.25 = a 185 room for 4)
const rate = z.coerce.number().min(0);
const hotelSchema = z.object({
  id: z.string().optional(),
  city: z.enum(["makkah", "madina"]),
  name: z.string().trim().min(1).max(200),
  location: z.string().trim().max(200),
  rates: z.record(z.string(), z.object({ sharing: rate, quint: rate, quad: rate, triple: rate, double: rate })),
});
export type HotelForm = z.infer<typeof hotelSchema>;

export async function saveHotel(input: HotelForm): Promise<Result> {
  const admin = await adminClient();
  if (!admin) return NOT_ADMIN;
  const parsed = hotelSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Name is required and rates must be whole numbers, 0 or more." };

  const { id, city, name, location, rates } = parsed.data;
  const row = { city, name, location: location || "-", slug: slugOf(name) };
  const { data, error } = id
    ? await admin.supabase.from("hotels").update(row).eq("id", id).select("id").single()
    : await admin.supabase.from("hotels").insert(row).select("id").single();
  if (error) return error.code === "23505" ? { ok: false, message: "A hotel with this name already exists in this city." } : FAILED;

  const rows = Object.entries(rates).flatMap(([season_id, r]) => ROOM_TYPES.map((room_type) => ({ hotel_id: data.id, season_id, room_type, rate_sar: r[room_type] })));
  if (rows.length) {
    const { error: rateError } = await admin.supabase.from("hotel_rates").upsert(rows, { onConflict: "hotel_id,season_id,room_type" });
    if (rateError) return FAILED;
  }
  updateTag(RATES_TAG);
  return { ok: true, id: data.id };
}

export async function deleteHotel(id: string): Promise<Result> {
  const admin = await adminClient();
  if (!admin) return NOT_ADMIN;
  const { error } = await admin.supabase.from("hotels").delete().eq("id", id);
  if (error) return FAILED;
  updateTag(RATES_TAG);
  return { ok: true };
}

/** CSV import: the same merge as an AI scan, so existing hotels and seasons are kept. */
export async function importHotels(city: "makkah" | "madina", hotels: { name: string; location: string; rates: ScanRate[] }[]): Promise<Result> {
  const admin = await adminClient();
  if (!admin) return NOT_ADMIN;
  const periods = [...new Set(hotels.flatMap((h) => h.rates.map((r) => r.period)))];
  const scan: NormalizedScan = { periods, makkah: [], madina: [], visaBus: [], visaPrivate: [], ziyarat: { makkah: 0, madina: 0 } };
  scan[city] = hotels;
  try {
    await applyScan(admin.supabase, scan, "merge");
  } catch {
    return FAILED;
  }
  updateTag(RATES_TAG);
  return { ok: true };
}

const visaSchema = z.array(z.object({ pax: z.coerce.number().int().positive(), rate: z.coerce.number().positive() }));

export async function saveVisa(transport: "bus" | "private", rows: { pax: number; rate: number }[]): Promise<Result> {
  const admin = await adminClient();
  if (!admin) return NOT_ADMIN;
  const parsed = visaSchema.safeParse(rows);
  if (!parsed.success || new Set(parsed.data.map((r) => r.pax)).size !== parsed.data.length) return { ok: false, message: "Each pax must be unique, and pax and rate must be above 0." };

  // visa_rates has no bulk transaction here, so the new rows go in first and only then the removed slabs leave.
  const { data: existing, error: readError } = await admin.supabase.from("visa_rates").select("pax").eq("transport_type", transport);
  if (readError) return FAILED;
  if (parsed.data.length) {
    const { error } = await admin.supabase
      .from("visa_rates")
      .upsert(parsed.data.map((r) => ({ transport_type: transport, pax: r.pax, rate_sar: r.rate })), { onConflict: "transport_type,pax" });
    if (error) return FAILED;
  }
  const removed = existing.map((r) => r.pax).filter((pax) => !parsed.data.some((r) => r.pax === pax));
  if (removed.length) {
    const { error } = await admin.supabase.from("visa_rates").delete().eq("transport_type", transport).in("pax", removed);
    if (error) return FAILED;
  }
  updateTag(RATES_TAG);
  return { ok: true };
}

export async function addSeason(name: string): Promise<Result> {
  const admin = await adminClient();
  if (!admin) return NOT_ADMIN;
  if (!name.trim()) return { ok: false, message: "Enter a season name." };
  const { data } = await admin.supabase.from("seasons").select("sort_order").order("sort_order", { ascending: false }).limit(1);
  const { error } = await admin.supabase.from("seasons").insert({ name: name.trim(), sort_order: (data?.[0]?.sort_order ?? 0) + 1 });
  if (error) return error.code === "23505" ? { ok: false, message: "This season already exists." } : FAILED;
  updateTag(RATES_TAG);
  return { ok: true };
}

export async function deleteSeason(id: string): Promise<Result> {
  const admin = await adminClient();
  if (!admin) return NOT_ADMIN;
  const { error } = await admin.supabase.from("seasons").delete().eq("id", id);
  if (error) return FAILED;
  updateTag(RATES_TAG);
  return { ok: true };
}

export async function orderSeasons(ids: string[]): Promise<Result> {
  const admin = await adminClient();
  if (!admin) return NOT_ADMIN;
  const results = await Promise.all(ids.map((id, i) => admin.supabase.from("seasons").update({ sort_order: i + 1 }).eq("id", id)));
  if (results.some((r) => r.error)) return FAILED;
  updateTag(RATES_TAG);
  return { ok: true };
}

const SETTING_KEYS = ["profit_pkr", "ziyarat_makkah_sar", "ziyarat_madina_sar", "sar_to_pkr", "infant_price_pkr"];

export async function saveRateSettings(values: Record<string, number>): Promise<Result> {
  const admin = await adminClient();
  if (!admin) return NOT_ADMIN;
  const rows = SETTING_KEYS.map((key) => ({ key, value: Number(values[key]), updated_at: new Date().toISOString() }));
  if (rows.some((r) => !Number.isFinite(r.value) || r.value < 0)) return { ok: false, message: "All values must be numbers, 0 or more." };
  const { error } = await admin.supabase.from("rate_settings").upsert(rows);
  if (error) return FAILED;
  updateTag(RATES_TAG);
  return { ok: true };
}
