/**
 * The itinerary engine: turns what the visitor types into the ordered list of journey phases the
 * /umrah-journey page renders. Pure functions only — no React — so the routing rules can be read
 * (and tested) on their own.
 *
 * Rules (as taught to pilgrims travelling from Pakistan, Hanafi):
 * - Landing in Jeddah: Ihram is put on before the flight and the Niyyah made before the plane crosses
 *   the Miqat, so the first city is Makkah and the first Umrah follows straight away.
 * - Landing in Madinah: no Ihram on the flight. Madinah comes first; Ihram is put on at Dhul Hulayfah
 *   (Abyar ‘Ali) on the way to Makkah.
 * - Makkah → Madinah → Makkah: the return to Makkah passes Dhul Hulayfah, so a second Ihram and a
 *   second Umrah are part of the route.
 * - Leaving: from the last city to the chosen departure airport.
 */

export type Airport = "JED" | "MED";
export type City = "makkah" | "madinah";

export type ItineraryInput = {
  arrival: Airport;
  departure: Airport;
  makkahDays: number;
  madinahDays: number;
  /** Only used for Makkah → Madinah → Makkah (arrival in Jeddah with a Madinah stay) */
  secondMakkahDays: number;
};

export const DEFAULT_ITINERARY: ItineraryInput = {
  arrival: "JED",
  departure: "JED",
  makkahDays: 5,
  madinahDays: 4,
  secondMakkahDays: 0,
};

export const AIRPORTS: Record<Airport, { code: Airport; name: string; city: string }> = {
  JED: { code: "JED", name: "King Abdulaziz International Airport", city: "Jeddah" },
  MED: { code: "MED", name: "Prince Mohammad bin Abdulaziz Airport", city: "Madinah" },
};

export const CITY_NAMES: Record<City, string> = { makkah: "Makkah", madinah: "Madinah" };

/** The five chapters of the brief: A home & arrival, B Makkah, C Madinah, D second Miqat, E departure. */
export type PhaseGroup = "A" | "B" | "C" | "D" | "E";

type Place = Airport | City;

export type Phase =
  | { kind: "home-departure"; ihram: boolean }
  | { kind: "ksa-arrival"; airport: Airport }
  | { kind: "transfer"; from: Place; to: Place; reason: "arrival" | "between-cities" | "to-airport" }
  | { kind: "miqat"; place: "dhul-hulayfah"; umrah: number }
  | { kind: "makkah-arrival"; stay: number }
  | { kind: "umrah"; number: number }
  | { kind: "makkah-stay"; stay: number; stayDays: number }
  | { kind: "madinah-arrival" }
  | { kind: "madinah-stay"; stayDays: number }
  | { kind: "final-departure"; airport: Airport; farewellTawaf: boolean };

export type JourneyPhase = Phase & {
  /** Stable key for React (and for scroll anchors) */
  id: string;
  group: PhaseGroup;
  title: string;
  subtitle: string;
  /** Day numbers this phase covers, 1-based; null for moments that happen within a day */
  days: { from: number; to: number } | null;
};

export type ItineraryIssue = { field: keyof ItineraryInput; message: string };

const clampDays = (n: number) => (Number.isFinite(n) ? Math.min(60, Math.max(0, Math.round(n))) : 0);

/** Is the "second Makkah stay" field meaningful for this input? */
export const allowsSecondMakkah = (input: ItineraryInput) => input.arrival === "JED" && input.madinahDays > 0;

/** Problems the visitor should fix; the journey still renders with the cleaned values. */
export function validateItinerary(input: ItineraryInput): ItineraryIssue[] {
  const issues: ItineraryIssue[] = [];
  if (clampDays(input.makkahDays) < 1) issues.push({ field: "makkahDays", message: "Umrah needs at least one day in Makkah." });
  if (input.arrival === "MED" && clampDays(input.madinahDays) < 1)
    issues.push({ field: "madinahDays", message: "Landing in Madinah means at least one day there before Makkah." });
  if (input.secondMakkahDays > 0 && !allowsSecondMakkah(input))
    issues.push({ field: "secondMakkahDays", message: "A second Makkah stay only applies to Jeddah → Makkah → Madinah → Makkah." });
  return issues;
}

/** The cleaned input the engine actually uses. */
export function normaliseItinerary(input: ItineraryInput): ItineraryInput {
  const makkahDays = Math.max(1, clampDays(input.makkahDays));
  const madinahDays = input.arrival === "MED" ? Math.max(1, clampDays(input.madinahDays)) : clampDays(input.madinahDays);
  const clean = { ...input, makkahDays, madinahDays, secondMakkahDays: clampDays(input.secondMakkahDays) };
  if (!allowsSecondMakkah(clean)) clean.secondMakkahDays = 0;
  return clean;
}

type Stay = { city: City; days: number };

/** The order of city stays for this itinerary. */
export function cityStays(input: ItineraryInput): Stay[] {
  const i = normaliseItinerary(input);
  const stays: Stay[] =
    i.arrival === "JED"
      ? [
          { city: "makkah", days: i.makkahDays },
          { city: "madinah", days: i.madinahDays },
          { city: "makkah", days: i.secondMakkahDays },
        ]
      : [
          { city: "madinah", days: i.madinahDays },
          { city: "makkah", days: i.makkahDays },
        ];
  return stays.filter((s) => s.days > 0);
}

export const placeName = (p: Place) => (p === "JED" || p === "MED" ? `${AIRPORTS[p].city} airport` : CITY_NAMES[p]);

/** Builds the ordered list of phases the page renders, top to bottom. */
export function buildJourney(input: ItineraryInput): JourneyPhase[] {
  const i = normaliseItinerary(input);
  const stays = cityStays(i);
  const phases: JourneyPhase[] = [];
  const counts: Record<string, number> = {};
  const push = (phase: Phase, group: PhaseGroup, title: string, subtitle: string, days: JourneyPhase["days"] = null) => {
    const n = (counts[phase.kind] = (counts[phase.kind] ?? 0) + 1);
    phases.push({ ...phase, id: `${phase.kind}-${n}`, group, title, subtitle, days } as JourneyPhase);
  };

  const ihramOnFlight = stays[0].city === "makkah";
  push(
    { kind: "home-departure", ihram: ihramOnFlight },
    "A",
    "Leaving home",
    ihramOnFlight ? "Immigration, Ihram at the airport, Niyyah before the Miqat in the air" : "Immigration and boarding — no Ihram yet, Madinah comes first",
  );
  push({ kind: "ksa-arrival", airport: i.arrival }, "A", `Landing in ${AIRPORTS[i.arrival].city}`, "Visa, Bin Aziz Transport voucher and the welcome desk");

  let day = 1;
  let umrah = 0;
  let makkahVisits = 0;
  let where = i.arrival as Place; // reassigned inside forEach, so keep the wide type

  stays.forEach((stay, index) => {
    const from = where;
    const goingToMakkah = stay.city === "makkah";
    // anyone heading to Makkah from Madinah passes Dhul Hulayfah and must be in Ihram from there
    if (goingToMakkah && from === "madinah") {
      push({ kind: "miqat", place: "dhul-hulayfah", umrah: umrah + 1 }, "D", "Miqat at Dhul Hulayfah (Abyar ‘Ali)", "Ghusl, fresh Ihram and the Niyyah for the next Umrah");
    }
    push(
      { kind: "transfer", from, to: stay.city, reason: index === 0 ? "arrival" : "between-cities" },
      index === 0 ? "A" : goingToMakkah && from === "madinah" ? "D" : stay.city === "madinah" ? "C" : "B",
      `${placeName(from)} → ${CITY_NAMES[stay.city]}`,
      "On board the Bin Aziz bus",
    );

    const range = { from: day, to: day + stay.days - 1 };
    if (goingToMakkah) {
      makkahVisits += 1;
      umrah += 1;
      push({ kind: "makkah-arrival", stay: makkahVisits }, "B", makkahVisits === 1 ? "Makkah hotel check-in" : "Back in Makkah", "Rest, refresh, then walk to Masjid al-Haram in Ihram", {
        from: day,
        to: day,
      });
      push({ kind: "umrah", number: umrah }, "B", umrah === 1 ? "Umrah" : `Umrah ${umrah}`, "Tawaf, Sa’i and Halq or Taqsir — with the 3D Kaaba");
      push({ kind: "makkah-stay", stay: makkahVisits, stayDays: stay.days }, "B", `Days in Makkah`, `${stay.days} day${stay.days === 1 ? "" : "s"} of prayer in the Haram`, range);
    } else {
      push({ kind: "madinah-arrival" }, "C", "Madinah hotel check-in", "Settling in near Masjid an-Nabawi", { from: day, to: day });
      push({ kind: "madinah-stay", stayDays: stay.days }, "C", "Days in Madinah", "Masjid an-Nabawi, Riyad al-Jannah and Ziyarat", range);
    }
    day += stay.days;
    where = stay.city;
  });

  const lastDay = Math.max(1, day - 1);
  push(
    { kind: "transfer", from: where, to: i.departure, reason: "to-airport" },
    "E",
    `${placeName(where)} → ${placeName(i.departure)}`,
    "The Bin Aziz bus to the airport",
    { from: lastDay, to: lastDay },
  );
  push(
    { kind: "final-departure", airport: i.departure, farewellTawaf: where === "makkah" },
    "E",
    `Flying home from ${AIRPORTS[i.departure].city}`,
    "Final immigration and boarding",
    { from: lastDay, to: lastDay },
  );
  return phases;
}

/** One-line route summary, e.g. "Jeddah → Makkah → Madinah → Makkah → Jeddah". */
export function routeSummary(input: ItineraryInput) {
  const i = normaliseItinerary(input);
  const stops = [AIRPORTS[i.arrival].city, ...cityStays(i).map((s) => CITY_NAMES[s.city]), AIRPORTS[i.departure].city];
  // landing in Madinah and staying in Madinah is one stop, not two
  return stops.filter((s, k) => s !== stops[k - 1]).join(" → ");
}

export const totalDays = (input: ItineraryInput) => cityStays(input).reduce((sum, s) => sum + s.days, 0);
export const umrahCount = (input: ItineraryInput) => cityStays(input).filter((s) => s.city === "makkah").length;
