import { stayPeriods, type RateHotel } from "@/lib/calc/engine";
import { periodLabel, periodWindow, seasonOf, sortPeriods } from "@/lib/calc/seasons";

/*
 * The calendar's colour blocks (user request 2026-11-23): one block per printed rate range of the chosen
 * hotel, so "1st & 2nd Ashra 06 FEB TILL 27 FEB" is ONE colour over both Ashras and "Last Ashra 27 FEB
 * TILL 11 MAR" another. Which block a night is in comes from `stayPeriods`, the same function that
 * prices it, so the colours and the price never disagree.
 */

/** Tailwind classes written out in full (Tailwind only finds whole class names). */
const TONES = [
  { day: "bg-sky-100 text-sky-900", dot: "bg-sky-500", chip: "border-sky-300 bg-sky-50 text-sky-900" },
  { day: "bg-teal-100 text-teal-900", dot: "bg-teal-500", chip: "border-teal-300 bg-teal-50 text-teal-900" },
  { day: "bg-indigo-100 text-indigo-900", dot: "bg-indigo-500", chip: "border-indigo-300 bg-indigo-50 text-indigo-900" },
  { day: "bg-emerald-100 text-emerald-900", dot: "bg-emerald-500", chip: "border-emerald-300 bg-emerald-50 text-emerald-900" },
  { day: "bg-amber-100 text-amber-900", dot: "bg-amber-500", chip: "border-amber-300 bg-amber-50 text-amber-900" },
  { day: "bg-violet-100 text-violet-900", dot: "bg-violet-500", chip: "border-violet-300 bg-violet-50 text-violet-900" },
  { day: "bg-rose-100 text-rose-900", dot: "bg-rose-500", chip: "border-rose-300 bg-rose-50 text-rose-900" },
  { day: "bg-orange-100 text-orange-900", dot: "bg-orange-500", chip: "border-orange-300 bg-orange-50 text-orange-900" },
] as const;
export type Tone = (typeof TONES)[number];

export type Band = { key: string; name: string; dates: string; from: number; to: number; tone: Tone; periods: string[] };

const DAY = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/**
 * A period's name and printed dates: "1st Ashra Ramadan — (1st & 2nd Ashra Ramadan) 06 FEB TILL 27 FEB"
 * → "1st & 2nd Ashra" · "06 FEB TILL 27 FEB"; "Before Ramadan — 30 NOV TILL 20 DEC" → "Before Ramadan" · "30 NOV TILL 20 DEC".
 */
export function bandName(period: string) {
  const season = seasonOf(period) ?? period;
  const label = periodLabel(period);
  const inner = /^\(([^)]+)\)\s*(.*)$/.exec(label);
  if (inner) return { name: inner[1].replace(/\s*Ramadan\b/g, "").replace(/\s+/g, " ").trim() || season, dates: inner[2] };
  // no name printed (Before Ramadan rates): the block is named by its dates, "30 Nov – 20 Dec", "Till 30 Nov"
  if (label) return { name: prettyDates(label), dates: "" };
  return { name: season.replace(/ Ramadan$/, ""), dates: "" };
}

const prettyDates = (label: string) =>
  label
    .replace(/\bcheck\s*-?out\s+/i, "")
    .replace(/\s+(?:till|until|to|-|–)\s+/gi, " – ")
    .replace(/[A-Za-z]+/g, (w) => (/^(?:till|until)$/i.test(w) ? "Till" : w[0].toUpperCase() + w.slice(1).toLowerCase()));

/** The hotel's rate blocks in date order, one per printed range (copies under several Ashras are one block). */
export function hotelBands(hotel: RateHotel, now = Date.now()): Band[] {
  const groups = new Map<string, { w: [number, number]; periods: string[] }>();
  for (const p of sortPeriods(Object.keys(hotel.rates))) {
    const w = periodWindow(p, now);
    const key = `${w[0]}-${w[1]}`;
    const g = groups.get(key);
    if (g) g.periods.push(p);
    else groups.set(key, { w, periods: [p] });
  }
  return [...groups.entries()]
    .sort((a, b) => a[1].w[0] - b[1].w[0] || a[1].w[1] - b[1].w[1])
    .map(([key, g], i) => {
      const { name, dates } = bandName(g.periods[0]);
      return { key, name, dates: dates || "", from: g.w[0], to: g.w[1], tone: TONES[i % TONES.length], periods: g.periods };
    });
}

/** A stand-in hotel holding every period of the city, for the calendar before a hotel is chosen. */
export const cityHotel = (periods: string[]): RateHotel => ({ name: "", location: "", rates: Object.fromEntries(periods.map((p) => [p, { sharing: 1 }])) });

/** The block a night is priced in, or null when the rate list has no rate for it. */
export function bandOn(hotel: RateHotel, bands: Band[], day: number): Band | null {
  const [seg] = stayPeriods(hotel, { from: iso(day), nights: 1 });
  return (seg?.period && bands.find((b) => b.periods.includes(seg.period!))) || null;
}

/** Nights from check-in to check-out per block, in order; `band` null = nights with no rate. */
export function nightsByBand(hotel: RateHotel, bands: Band[], from: number, to: number) {
  const out: { band: Band | null; nights: number }[] = [];
  for (let d = from; d < to; d += DAY) {
    const band = bandOn(hotel, bands, d);
    const last = out[out.length - 1];
    if (last && last.band?.key === band?.key) last.nights++;
    else out.push({ band, nights: 1 });
  }
  return out;
}
