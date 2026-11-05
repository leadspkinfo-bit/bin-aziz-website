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
  return isDistance(clean) ? { street: "", distance: clean } : { street: clean, distance: "" };
}

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
    if (last && last.city === h.city && last.name === h.name && last.room === h.room) last.nights += h.nights;
    else out.push({ ...h });
  }
  return out;
}

