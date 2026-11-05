// Hotel names as different rate lists spell them. Suppliers write the same hotel differently
// ("SNOOD MOWWTAN" / "SNOOD MOWTAN", "TAIF NIBRAS" / "TAIF NEBRAS", "HALA TAIBA" / "HALA TAIBAH",
// "DIYAR SAFA" / "DIYAR AL SAFA (old Safa Center)", "TAJ FIDDI HOTEL"), and some print two hotels in one
// row ("MELLA 1/MELLA 2"). A scan maps every printed name onto the hotel already stored:
//   1. a name the admin already answered for (hotel_aliases) → that answer;
//   2. the same `hotelKey` → the same hotel, automatically;
//   3. a near key (one letter apart) → the admin is asked once, and the answer is remembered.

/** "MELLA 1/MELLA 2" → ["MELLA 1", "MELLA 2"]; one name stays one. A "/" inside brackets is not a split. */
export function splitCombined(name: string): string[] {
  const outside = name.replace(/\([^)]*\)/g, (m) => m.replace(/\//g, "\u0000"));
  const parts = outside
    .split("/")
    .map((p) => p.replace(/\u0000/g, "/").trim())
    .filter(Boolean);
  // "AL HIJRA / AL HIJRAH" style spellings of one name are not two hotels: only split when the parts differ
  if (parts.length < 2) return [name.trim()];
  const keys = new Set(parts.map(hotelKey));
  return keys.size === parts.length ? parts : [name.trim()];
}

const NOISE = new Set(["HOTEL", "HOTELS", "AL", "EL", "THE", "TOWER", "TOWERS"]);

/**
 * The spelling-proof identity of a hotel name: brackets and filler words dropped, Arabic endings evened out
 * ("-AH", "-AT" → "-A"), then only the consonants, doubled letters once, numbers kept.
 * "SNOOD MOWWTAN" = "SNOOD MOWTAN" = "SNDMWTN"; "NAWARAT SHAMAS 3" = "NAWARA SHAMS 3".
 */
export function hotelKey(name: string): string {
  const words = name
    .toUpperCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^A-Z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w && !NOISE.has(w));
  const key = words
    .map((w) => (/^\d+$/.test(w) ? w : w.replace(/(?<=[A-Z]{2})(AH|AT)$/, "A")))
    .map((w) => (/^\d+$/.test(w) ? w : w[0] + w.slice(1).replace(/[AEIOUY]/g, "")))
    .join("")
    .replace(/([A-Z])\1+/g, "$1");
  return key || name.toUpperCase().replace(/\s+/g, "");
}

function distance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

/** Close enough to ask about: one letter apart on keys of 5+ letters, never a different number ("MELLA 1" vs "MELLA 2"). */
export function nearKeys(a: string, b: string) {
  if (a === b) return false;
  if (a.replace(/\D/g, "") !== b.replace(/\D/g, "")) return false;
  return Math.min(a.length, b.length) >= 5 && distance(a, b) <= 1;
}

/** An admin's answer, remembered: `target` is the stored hotel's name, or null for "a different hotel". */
export type HotelAlias = { city: "makkah" | "madina"; alias: string; target: string | null };

export type NameMatch =
  | { kind: "same"; name: string; stored: string; why: "remembered" | "spelling" }
  | { kind: "new"; name: string }
  | { kind: "ask"; name: string; candidates: string[] };

type City = "makkah" | "madina";
type NamedHotel = { name: string };
export type Rename = { city: City; from: string; to: string; why: "remembered" | "spelling" | "split" | "answer" };
export type NameQuestion = { city: City; name: string; candidates: string[] };
/** The admin's reply to a question: `target` = the stored hotel it is, or null = a new hotel. */
export type NameAnswer = { city: City; name: string; target: string | null };

/**
 * Puts every scanned hotel under the name it is stored as. "A/B" rows become two hotels with the same
 * rates; spellings of a stored hotel take its name; a name close to a stored one and never answered
 * before becomes a question (the batch is not saved until it is answered). Names of the batch itself
 * count as stored too, so two sheets in one batch that spell a hotel differently still meet.
 */
export function canonicalize<T extends NamedHotel>(
  incoming: Record<City, T[]>,
  stored: Record<City, string[]>,
  aliases: HotelAlias[],
  answers: NameAnswer[] = [],
) {
  const renames: Rename[] = [];
  const questions: NameQuestion[] = [];
  const out = { makkah: [] as T[], madina: [] as T[] };
  for (const city of ["makkah", "madina"] as const) {
    const known = [...stored[city]];
    const remembered = [...aliases, ...answers.map((a) => ({ city: a.city, alias: a.name, target: a.target }))];
    for (const hotel of incoming[city]) {
      const parts = splitCombined(hotel.name);
      for (const part of parts) {
        if (parts.length > 1) renames.push({ city, from: hotel.name, to: part, why: "split" });
        const m = matchHotel(part, city, known, remembered);
        let name = part;
        if (m.kind === "same") {
          name = m.stored;
          const answered = answers.some((a) => a.city === city && hotelKey(a.name) === hotelKey(part));
          if (name !== part) renames.push({ city, from: part, to: name, why: answered ? "answer" : m.why });
        } else if (m.kind === "ask") {
          if (!questions.some((q) => q.city === city && hotelKey(q.name) === hotelKey(part))) questions.push({ city, name: part, candidates: m.candidates });
        }
        if (!known.some((k) => k.toUpperCase() === name.toUpperCase())) known.push(name);
        out[city].push({ ...hotel, name });
      }
    }
  }
  return { hotels: out, renames, questions };
}

/** Where one printed name goes, given the city's stored hotel names and the remembered answers. */
export function matchHotel(name: string, city: "makkah" | "madina", stored: string[], aliases: HotelAlias[]): NameMatch {
  const key = hotelKey(name);
  const exact = stored.find((s) => s.toUpperCase().trim() === name.toUpperCase().trim());
  if (exact) return { kind: "same", name, stored: exact, why: "spelling" };
  const answer = aliases.find((a) => a.city === city && hotelKey(a.alias) === key);
  if (answer) {
    const target = answer.target && stored.find((s) => hotelKey(s) === hotelKey(answer.target!));
    if (target) return { kind: "same", name, stored: target, why: "remembered" };
    if (answer.target === null) return { kind: "new", name };
  }
  const same = stored.find((s) => hotelKey(s) === key);
  if (same) return { kind: "same", name, stored: same, why: "spelling" };
  const near = stored.filter((s) => nearKeys(hotelKey(s), key));
  return near.length ? { kind: "ask", name, candidates: near } : { kind: "new", name };
}
