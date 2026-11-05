import type { SupabaseClient } from "@supabase/supabase-js";
import { hotelKey, splitCombined, type HotelAlias, type NameAnswer } from "./hotelNames";

type City = "makkah" | "madina";
// the table comes with 015_hotel_names.sql; before it is run the scan still works, just without memory
const missingTable = (e: { code?: string } | null) => e?.code === "42P01" || e?.code === "PGRST205";

/** The stored hotel names per city. */
export async function storedHotelNames(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("hotels").select("name, city").limit(5000);
  if (error) throw error;
  const out: Record<City, string[]> = { makkah: [], madina: [] };
  for (const h of data ?? []) out[h.city as City].push(h.name);
  return out;
}

/** Every answer the admin gave before ("this spelling is that hotel" / "a different hotel"). */
export async function loadAliases(supabase: SupabaseClient): Promise<{ aliases: HotelAlias[]; ready: boolean }> {
  const { data, error } = await supabase.from("hotel_aliases").select("city, alias, target").limit(5000);
  if (missingTable(error)) return { aliases: [], ready: false };
  if (error) throw error;
  return { aliases: (data ?? []) as HotelAlias[], ready: true };
}

/** Remembers answers so the same spelling is never asked about again. */
export async function rememberAliases(supabase: SupabaseClient, answers: { city: City; alias: string; target: string | null }[]) {
  if (!answers.length) return true;
  const { error } = await supabase.from("hotel_aliases").upsert(answers, { onConflict: "city,alias" });
  if (missingTable(error)) return false;
  if (error) throw error;
  return true;
}

export const answersToAliases = (answers: NameAnswer[]) => answers.map((a) => ({ city: a.city, alias: a.name, target: a.target }));

type Row = { id: string; name: string; city: City; created_at: string };
export type Duplicate = { city: City; drop: { id: string; name: string }; keep: { id: string; name: string }[]; kind: "spelling" | "split" };

/**
 * Hotels stored twice: two spellings of one hotel (the older one is kept, the other's rates move onto it),
 * and an "A/B" row whose hotels also exist on their own (its rates move onto both).
 */
export async function findDuplicates(supabase: SupabaseClient): Promise<Duplicate[]> {
  const { data, error } = await supabase.from("hotels").select("id, name, city, created_at").order("created_at").limit(5000);
  if (error) throw error;
  const rows = (data ?? []) as Row[];
  const out: Duplicate[] = [];
  for (const city of ["makkah", "madina"] as const) {
    const list = rows.filter((r) => r.city === city);
    const singles = list.filter((r) => splitCombined(r.name).length === 1);
    for (const r of list) {
      const parts = splitCombined(r.name);
      if (parts.length < 2) continue;
      const keep = parts.map((p) => singles.find((s) => hotelKey(s.name) === hotelKey(p)));
      if (keep.every(Boolean)) out.push({ city, drop: { id: r.id, name: r.name }, keep: keep.map((k) => ({ id: k!.id, name: k!.name })), kind: "split" });
    }
    const byKey = new Map<string, Row[]>();
    for (const r of singles) byKey.set(hotelKey(r.name), [...(byKey.get(hotelKey(r.name)) ?? []), r]);
    for (const group of byKey.values()) {
      const [first, ...rest] = group; // oldest first
      for (const r of rest) out.push({ city, drop: { id: r.id, name: r.name }, keep: [{ id: first.id, name: first.name }], kind: "spelling" });
    }
  }
  return out;
}
