import { ROOM_TYPES, SCAN_DIVISOR, STANDARD_RATES, type RoomType } from "@/lib/calc/constants";
import { cleanLabel, parseRange, periodName, seasonOf, seasonsForPeriod, sortPeriods } from "@/lib/calc/seasons";
import type { ScanTarget } from "./prompt";

export type ScanRate = { period: string } & Record<RoomType, number>;
export type ScanHotel = { name: string; location: string; rates: ScanRate[] };
export type VisaSlab = { pax: number; rate: number };

export type NormalizedScan = {
  periods: string[];
  makkah: ScanHotel[];
  madina: ScanHotel[];
  visaBus: VisaSlab[];
  visaPrivate: VisaSlab[];
  ziyarat: { makkah: number; madina: number };
};

/* eslint-disable @typescript-eslint/no-explicit-any -- model output is untrusted JSON of any shape */

/**
 * Rates are kept exact, never rounded to whole riyals: 185 ÷ 4 = 46.25 stays 46.25 (4 decimals are kept
 * so 290 ÷ 3 = 96.6667). Only the final PKR amounts are rounded, in the engine.
 */
export const exact = (n: number) => Math.round(n * 10000) / 10000;

export function num_(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const clean = String(v).replace(/[^0-9.\-]/g, "");
  if (clean === "") return null;
  const n = Number(clean);
  return Number.isNaN(n) ? null : n;
}

/**
 * One room type's per-person rate. `listHasColumn`: the list prints this room type for some hotel,
 * so a blank / "N/A" here means the room is not offered (0), not "work it out from the room rate".
 */
export function pick_(printed: unknown, roomRate: unknown, divisor: number, listHasColumn = false): number {
  const p = num_(printed);
  const r = num_(roomRate);
  // A "per person" figure above the whole-room price of the same row is itself a room price
  // (lists print e.g. "QUINT 420" next to a 370 DBL-TPL-QD room rate), so it is split by the beds.
  if (p !== null && p > 0 && r !== null && r > 0 && p > r) return exact(p / divisor);
  if (p !== null && p > 0) return exact(p);
  if (listHasColumn) return 0;
  if (r !== null && r > 0) return exact(r / divisor);
  return 0;
}

export function cleanVisa_(arr: unknown): VisaSlab[] {
  if (!Array.isArray(arr)) return [];
  const out: VisaSlab[] = [];
  for (const v of arr as any[]) {
    const pax = parseInt(v?.pax, 10);
    const rate = num_(v?.rate);
    if (pax > 0 && rate !== null && rate > 0) out.push({ pax, rate: exact(rate) });
  }
  return out;
}

export function normalizeScan(parsed: any, target: ScanTarget): NormalizedScan {
  const list = (v: unknown) => (Array.isArray(v) ? (v as any[]) : []);
  const rawHotels = [
    ...list(parsed?.hotels),
    ...list(parsed?.makkah).map((h) => ({ ...h, city: "Makkah" })),
    ...list(parsed?.madina).map((h) => ({ ...h, city: "Madina" })),
  ];

  const used = new Set<string>();
  const out: NormalizedScan = { periods: [], makkah: [], madina: [], visaBus: [], visaPrivate: [], ziyarat: { makkah: 0, madina: 0 } };

  // Room types this list actually prints for at least one hotel: a gap in such a column is "N/A".
  const printed = new Set<RoomType>();
  for (const h of rawHotels) for (const row of list(h?.rates)) for (const room of ROOM_TYPES) if ((num_(row?.[room]) ?? 0) > 0) printed.add(room);

  for (const h of rawHotels) {
    const name = String(h?.name ?? "").trim();
    if (!name) continue;
    const city = target === "makkah" ? "makkah" : target === "madina" ? "madina" : /madin|medin/i.test(String(h.city ?? "")) ? "madina" : "makkah";
    // Each printed period lands in one or more of the five seasons, as its own bar when the heading
    // carries dates ("Before Ramadan — 10 DEC TILL 31 JAN"). Only an undated heading falls back to the
    // plain season; two of those in one season keep the higher rate so a quote never undersells.
    const byPeriod = new Map<string, ScanRate>();
    for (const row of list(h.rates)) {
      const period = String(row?.period || STANDARD_RATES).trim();
      const label = parseRange(period) ? cleanLabel(period) : "";
      for (const season of seasonsForPeriod(period, row?.seasons)) {
        const key = periodName(season, label);
        used.add(key);
        const rate = byPeriod.get(key) ?? ({ period: key, sharing: 0, quint: 0, quad: 0, triple: 0, double: 0 } as ScanRate);
        for (const room of ROOM_TYPES) rate[room] = Math.max(rate[room], pick_(row?.[room], row?.roomRate, SCAN_DIVISOR[room], printed.has(room)));
        byPeriod.set(key, rate);
      }
    }
    const rates = sortPeriods(byPeriod.keys()).map((k) => byPeriod.get(k)!);
    out[city].push({ name, location: String(h.location ?? "").trim() || "-", rates });
  }
  out.periods = sortPeriods(used);

  out.visaBus = cleanVisa_(parsed?.visaBus);
  out.visaPrivate = cleanVisa_(parsed?.visaPrivate);
  out.ziyarat = { makkah: num_(parsed?.ziyarat?.makkah) || 0, madina: num_(parsed?.ziyarat?.madina) || 0 };
  return out;
}

/** `old` first, `incoming` second: incoming wins a same-period rate, and its location unless that is "-". */
export function mergeHotels(old: ScanHotel[], incoming: ScanHotel[]): ScanHotel[] {
  const key = (name: string) => name.toLowerCase().trim();
  const merged = new Map<string, ScanHotel>();
  for (const [hotels, wins] of [
    [old, false],
    [incoming, true],
  ] as const) {
    for (const h of hotels) {
      const existing = merged.get(key(h.name));
      if (!existing) {
        merged.set(key(h.name), { ...h, rates: [...h.rates] });
        continue;
      }
      if (wins && h.location !== "-") existing.location = h.location;
      for (const rate of h.rates) {
        const at = existing.rates.findIndex((r) => r.period === rate.period);
        if (at < 0) existing.rates.push(rate);
        else if (wins) existing.rates[at] = rate;
      }
    }
  }
  return [...merged.values()];
}

/**
 * Replace mode, one season at a time: the seasons the new sheet has rates for are rebuilt from it
 * (their old date periods disappear), every other season keeps its stored rates. So the Before Ramadan,
 * 1st, Mid and Last Ashra and Shawwal sheets can be uploaded one by one, in any order.
 * Returns the hotels to write and the seasons that were replaced.
 */
export function replaceSeasons(old: ScanHotel[], incoming: ScanHotel[]) {
  const group = (period: string) => seasonOf(period) ?? period;
  const replaced = new Set(incoming.flatMap((h) => h.rates.map((r) => group(r.period))));
  const kept = old
    .map((h) => ({ ...h, rates: h.rates.filter((r) => !replaced.has(group(r.period))) }))
    .filter((h) => h.rates.length > 0);
  return { hotels: mergeHotels(kept, incoming), replaced: sortPeriods(replaced) };
}

export function combineScans(scans: NormalizedScan[]): NormalizedScan {
  const out: NormalizedScan = { periods: [], makkah: [], madina: [], visaBus: [], visaPrivate: [], ziyarat: { makkah: 0, madina: 0 } };
  for (const s of scans) {
    out.periods = sortPeriods([...out.periods, ...s.periods]);
    out.makkah.push(...s.makkah);
    out.madina.push(...s.madina);
    out.visaBus.push(...s.visaBus);
    out.visaPrivate.push(...s.visaPrivate);
    if (s.ziyarat.makkah) out.ziyarat.makkah = s.ziyarat.makkah;
    if (s.ziyarat.madina) out.ziyarat.madina = s.ziyarat.madina;
  }
  return out;
}

export function isEmptyScan(s: NormalizedScan) {
  return !s.makkah.length && !s.madina.length && !s.visaBus.length && !s.visaPrivate.length && !s.ziyarat.makkah && !s.ziyarat.madina;
}
