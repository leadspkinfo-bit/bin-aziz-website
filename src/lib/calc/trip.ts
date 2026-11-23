import type { PublicResult } from "./quotations";

type Pkg = PublicResult["packages"][number];
export type Stay = Pkg["makkahDetails"][number] & { city: "Makkah" | "Madinah" };

/**
 * "AL TAYSIR STREET, SHUTTLE SERVICE" → street "AL TAYSIR STREET", distance "SHUTTLE SERVICE". The scan
 * keeps a hotel's location and distance in one text; the part that names metres or a shuttle is the distance.
 */
export function splitLocation(text: string) {
  const clean = (text ?? "").trim();
  if (!clean || clean === "-") return { street: "", distance: "" };
  const isDistance = (t: string) => /\d|meter|metre|mtr|shuttle|walk/i.test(t);
  const at = clean.lastIndexOf(",");
  if (at > 0) {
    const tail = clean.slice(at + 1).trim();
    if (isDistance(tail)) return { street: clean.slice(0, at).trim(), distance: tail };
  }
  // stored without a comma ("MASJID BILAL SIDE 750 MTR", "ABDUL AZIZ ROAD SHUTTLE SERVICE"): the trailing distance
  const tail = /\s((?:\d[\d\s.\-–]*\s*(?:m|mtrs?|meters?|metres?)\b.*)|(?:shuttle(?:\s+service)?))$/i.exec(clean);
  if (tail && tail.index > 0) return { street: clean.slice(0, tail.index).trim(), distance: tail[1].trim() };
  return isDistance(clean) ? { street: "", distance: clean } : { street: clean, distance: "" };
}

const DAY = 86_400_000;
const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
const day = (iso: string, year: boolean) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", ...(year ? { year: "numeric" } : {}), timeZone: "UTC" });
/** "18 Feb – 23 Feb 2027" (as the calculator writes a stay's dates), the year once unless it changes. */
const spanDates = (from: string, to: string) => `${day(from, from.slice(0, 4) !== to.slice(0, 4))} – ${day(to, true)}`;

/**
 * The package's hotel stays in trip order (by check-in date), Makkah and Madinah mixed, so
 * Makkah → Madinah → Makkah reads in that order. Back-to-back stays in the same hotel and room (one stay
 * split over two rate seasons) read as one stay with their nights added.
 */
export function tripStays(p: Pick<Pkg, "makkahDetails" | "madinaDetails">): Stay[] {
  const all: Stay[] = [
    ...p.makkahDetails.map((h) => ({ ...h, city: "Makkah" as const })),
    ...p.madinaDetails.map((h) => ({ ...h, city: "Madinah" as const })),
  ];
  // stable: stays without a date keep their place after the dated ones
  const sorted = all.map((h, i) => ({ h, i })).sort((a, b) => (a.h.from ?? "9999").localeCompare(b.h.from ?? "9999") || a.i - b.i).map((x) => x.h);
  const out: Stay[] = [];
  for (const h of sorted) {
    const last = out[out.length - 1];
    // joined only when really back to back (check-out of one = check-in of the next); the dates then span both
    const backToBack = last?.from && h.from ? addDays(last.from, last.nights) === h.from : !last?.from && !h.from;
    if (last && backToBack && last.city === h.city && last.name === h.name && last.room === h.room) {
      last.nights += h.nights;
      if (last.from) last.dates = spanDates(last.from, addDays(last.from, last.nights));
      if (h.season && !last.season.split(" + ").includes(h.season)) last.season = [last.season, h.season].filter(Boolean).join(" + ");
    } else out.push({ ...h });
  }
  return out;
}

