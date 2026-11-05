import type { SupabaseClient } from "@supabase/supabase-js";
import type { RoomType } from "./constants";
import { mergeHotels, replaceSeasons, type NormalizedScan, type ScanHotel, type ScanRate } from "@/lib/gemini/normalize";

type HotelRow = {
  name: string;
  location: string;
  hotel_rates: { room_type: RoomType; rate_sar: number; seasons: { name: string } | null }[];
};

/** The city's current hotels in scan shape, so merge mode can combine them with the new list. */
async function existingHotels(supabase: SupabaseClient, city: "makkah" | "madina"): Promise<ScanHotel[]> {
  const { data, error } = await supabase
    .from("hotels")
    .select("name, location, hotel_rates(room_type, rate_sar, seasons(name))")
    .eq("city", city)
    .limit(5000);
  if (error) throw error;
  return (data as unknown as HotelRow[]).map((h) => {
    const periods = new Map<string, ScanRate>();
    for (const r of h.hotel_rates) {
      const period = r.seasons?.name;
      if (!period) continue;
      if (!periods.has(period)) periods.set(period, { period, sharing: 0, quint: 0, quad: 0, triple: 0, double: 0 });
      periods.get(period)![r.room_type] = Number(r.rate_sar);
    }
    return { name: h.name, location: h.location, rates: [...periods.values()] };
  });
}

const dedupe = (hotels: ScanHotel[]) => mergeHotels([], hotels);

/** Prepares the payload and calls the transactional database function. */
export async function applyScan(supabase: SupabaseClient, scan: NormalizedScan, mode: "replace" | "merge") {
  const payload = { ...scan, makkah: dedupe(scan.makkah), madina: dedupe(scan.madina) };
  const replaced = new Set<string>();
  for (const city of ["makkah", "madina"] as const) {
    if (!payload[city].length) continue;
    const old = await existingHotels(supabase, city);
    if (mode === "merge") payload[city] = mergeHotels(old, payload[city]);
    else {
      // only the seasons this sheet prints are rebuilt; the database function then rewrites the city
      // (delete + insert in one transaction) with the other seasons' rates carried over
      const out = replaceSeasons(old, payload[city]);
      payload[city] = out.hotels;
      out.replaced.forEach((s) => replaced.add(s));
    }
  }
  const { error } = await supabase.rpc("apply_scan", { payload, mode });
  if (error) throw error;
  return {
    makkahWritten: scan.makkah.length,
    madinaWritten: scan.madina.length,
    visaBus: scan.visaBus.length,
    visaPrivate: scan.visaPrivate.length,
    replacedSeasons: [...replaced],
    ziyaratUpdated: scan.ziyarat.makkah > 0 || scan.ziyarat.madina > 0,
  };
}
