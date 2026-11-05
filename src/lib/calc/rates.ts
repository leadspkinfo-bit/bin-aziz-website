import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import { MADINA_ZIYARAT_SAR, MAKKAH_ZIYARAT_SAR, INFANT_PRICE_PKR, PROFIT_PKR, RATES_TAG, SAR_TO_PKR, type RoomType } from "./constants";
import type { RateHotel, RatesData } from "./engine";
import { SEASONS } from "./seasons";

const FALLBACK: RatesData = {
  hotels: { makkah: {}, madina: {} },
  visa: { bus: {}, private: {} },
  dynamicProfit: PROFIT_PKR,
  periods: [...SEASONS],
  ziyarat: { makkah: MAKKAH_ZIYARAT_SAR, madina: MADINA_ZIYARAT_SAR },
  sarToPkr: SAR_TO_PKR,
  infantPrice: INFANT_PRICE_PKR,
};

type RateRow = { hotel_id: string; season_id: string; room_type: RoomType; rate_sar: number };

/** Supabase returns at most 1000 rows per request and a rate list easily has more. */
async function allRates(supabase: SupabaseClient) {
  const rows: RateRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("hotel_rates").select("hotel_id, season_id, room_type, rate_sar").order("id").range(from, from + 999);
    if (error) throw error;
    rows.push(...(data as RateRow[]));
    if (data.length < 1000) return rows;
  }
}

async function loadRates(): Promise<RatesData> {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
  });
  const [hotels, seasons, visa, settings, rates] = await Promise.all([
    supabase.from("hotels").select("id, name, city, location").order("name"),
    supabase.from("seasons").select("id, name").order("sort_order"),
    supabase.from("visa_rates").select("transport_type, pax, rate_sar"),
    supabase.from("rate_settings").select("key, value"),
    allRates(supabase),
  ]);
  const failed = hotels.error ?? seasons.error ?? visa.error ?? settings.error;
  if (failed) throw failed;
  const seasonRows = seasons.data ?? [];

  const seasonName = new Map(seasonRows.map((s) => [s.id as string, s.name as string]));
  const data: RatesData = { ...FALLBACK, hotels: { makkah: {}, madina: {} }, visa: { bus: {}, private: {} } };
  const byId = new Map<string, RateHotel>();
  for (const h of hotels.data ?? []) {
    const hotel: RateHotel = { name: h.name, location: h.location, rates: {} };
    data.hotels[h.city as "makkah" | "madina"][h.id] = hotel;
    byId.set(h.id, hotel);
  }
  for (const r of rates) {
    const hotel = byId.get(r.hotel_id);
    const season = seasonName.get(r.season_id);
    if (hotel && season) (hotel.rates[season] ??= {})[r.room_type] = Number(r.rate_sar);
  }
  for (const v of visa.data ?? []) data.visa[v.transport_type as "bus" | "private"][v.pax] = Number(v.rate_sar);

  const value = new Map((settings.data ?? []).map((s) => [s.key as string, Number(s.value)]));
  data.dynamicProfit = value.get("profit_pkr") ?? PROFIT_PKR;
  data.sarToPkr = value.get("sar_to_pkr") ?? SAR_TO_PKR;
  data.infantPrice = value.get("infant_price_pkr") ?? INFANT_PRICE_PKR;
  data.ziyarat = { makkah: value.get("ziyarat_makkah_sar") ?? MAKKAH_ZIYARAT_SAR, madina: value.get("ziyarat_madina_sar") ?? MADINA_ZIYARAT_SAR };
  // All five season names; the calculator itself shows only those the hotels have rates for.
  data.periods = [...SEASONS];
  return data;
}

/**
 * What the calculator page may see: hotel names, locations, rate periods, and per room only whether it
 * is available (1) or N/A (0). No rates, visa, ziyarat, exchange rate or profit ever leave the server.
 */
export type RateCatalog = { hotels: RatesData["hotels"] };

export function rateCatalog(data: RatesData): RateCatalog {
  const strip = (hotels: Record<string, RateHotel>) =>
    Object.fromEntries(
      Object.entries(hotels).map(([id, h]) => [
        id,
        {
          name: h.name,
          location: h.location,
          rates: Object.fromEntries(Object.entries(h.rates).map(([period, r]) => [period, Object.fromEntries(Object.entries(r).map(([room, v]) => [room, (v ?? 0) > 0 ? 1 : 0]))])),
        },
      ]),
    );
  return { hotels: { makkah: strip(data.hotels.makkah), madina: strip(data.hotels.madina) } };
}

/** All rate data in the shape the calculator expects. Cached, and dropped the moment an admin changes a rate. */
export async function getRates(): Promise<RatesData> {
  "use cache";
  cacheTag(RATES_TAG);
  try {
    const data = await loadRates();
    cacheLife({ stale: 60, revalidate: 60, expire: 300 });
    return data;
  } catch (e) {
    console.error("rates failed:", e);
    cacheLife({ stale: 30, revalidate: 30, expire: 60 });
    return FALLBACK;
  }
}
