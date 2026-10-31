import { AIRPORTS, placeName, type JourneyPhase, type PhaseGroup } from "@/lib/journey/itinerary";
import type { TransportRoute } from "./scenes/TransportScene";
import { previewPoints } from "@/components/journey/preview";

/** Every look the single journey stage can take. */
export type SceneKey = "packing" | "airport" | "flight" | "arrival" | "transport" | "hotel" | "kaaba" | "sai" | "halq" | "makkah" | "madinah" | "nabawi" | "miqat" | "departure";

/**
 * One stretch of the scroll on the single stage. `start`/`end` are in screens of scroll (1 = one
 * viewport height); the stage crossfades from one beat to the next around those points.
 */
export type Beat = {
  id: string;
  scene: SceneKey;
  group: PhaseGroup;
  title: string;
  steps: string[];
  days: string | null;
  phase: JourneyPhase;
  start: number;
  end: number;
};

/** Where each airport step ends on the airport beat's 0 → 1 progress (matches AirportScene's route). */
export const AIRPORT_STEPS = [0.15, 0.34, 0.58, 0.79, 1];

const dayLabel = (p: JourneyPhase) =>
  p.days ? (p.days.from === p.days.to ? `Day ${p.days.from}` : `Days ${p.days.from}–${p.days.to}`) : null;

type Draft = Omit<Beat, "start" | "end" | "id" | "group" | "days" | "phase"> & { weight: number };

/** The beats one phase plays out as, in order, with how many screens of scroll each takes. */
function beatsFor(phase: JourneyPhase): Draft[] {
  switch (phase.kind) {
    case "home-departure":
      return [
        {
          scene: "packing",
          weight: 2.6,
          title: "Before you leave home",
          steps: ["Documents folder", "Hand-carry", "Lock the door with a du‘a"],
        },
        {
          scene: "airport",
          weight: 4,
          title: "Leaving home",
          steps: phase.ihram
            ? [
                "Into the departures hall with your passport, visa and ticket",
                "Immigration counter — your passport is checked and stamped",
                "Ihram in the prayer room — the Niyyah comes later, in the air",
                "A seat in the lounge until your gate is called",
                "Down the jet bridge and into your seat on the plane",
              ]
            : [
                "Into the departures hall with your passport, visa and ticket",
                "Immigration counter — your passport is checked and stamped",
                "No Ihram yet — you fly to Madinah first",
                "A seat in the lounge until your gate is called",
                "Down the jet bridge and into your seat on the plane",
              ],
        },
        {
          scene: "flight",
          weight: 2.2,
          title: phase.ihram ? "The Miqat, in the air" : "Flying to Madinah",
          steps: phase.ihram
            ? ["Before the plane crosses the Miqat: the Niyyah for Umrah", "Then the Talbiyah — Labbayk Allāhumma labbayk"]
            : ["No Miqat on this flight", "Ihram is put on later, at Dhul Hulayfah"],
        },
      ];
    case "ksa-arrival":
      return [{ scene: "arrival", weight: 1.8, title: phase.title, steps: previewPoints(phase) }];
    case "transfer":
      return [{ scene: "transport", weight: 1.6, title: phase.title, steps: previewPoints(phase) }];
    case "makkah-arrival":
      return [{ scene: "hotel", weight: 1.6, title: phase.title, steps: previewPoints(phase) }];
    case "umrah": {
      const label = phase.number === 1 ? "Umrah" : `Umrah ${phase.number}`;
      return [
        { scene: "kaaba", weight: 3.5, title: `${label} · Tawaf`, steps: ["Seven rounds, Kaaba on your left", "Drag to walk around; open the golden door to go inside", "Two rak‘ahs at Maqam-e-Ibrahim, then Zamzam"] },
        { scene: "sai", weight: 2, title: `${label} · Sa’i`, steps: ["Begin at Safa", "Men jog between the green lights", "Seven rounds, ending at Marwah"] },
        { scene: "halq", weight: 2.4, title: `${label} · Halq or Taqsir`, steps: ["Men: shave (best) or trim evenly", "Women: one fingertip’s length", "Ihram restrictions lifted"] },
      ];
    }
    case "makkah-stay":
      return [{ scene: "makkah", weight: 1.2, title: phase.title, steps: previewPoints(phase) }];
    case "madinah-arrival":
      // no separate picture: the check-in is the first step of the Masjid an-Nabawi beat, so the 3D model comes straight in
      return [];
    case "madinah-stay":
      return [
        {
          scene: "nabawi",
          weight: 3.2,
          title: `Masjid an-Nabawi · ${phase.stayDays} day${phase.stayDays === 1 ? "" : "s"}`,
          steps: [
            "Check in at your hotel near Masjid an-Nabawi and refresh",
            "Enter with your right foot, ideally by Bab as-Salam",
            "Greet the Prophet ﷺ, then Abu Bakr and ‘Umar (RA), at the brass grille",
            "Two rak‘ahs in Riyad al-Jannah — with a Nusuk permit",
            "Ziyarat: Quba, Uhud and al-Baqi",
          ],
        },
      ];
    case "miqat":
      return [{ scene: "miqat", weight: 1.8, title: phase.title, steps: previewPoints(phase) }];
    case "final-departure":
      return [{ scene: "departure", weight: 3, title: `Flying home from ${AIRPORTS[phase.airport].city}`, steps: previewPoints(phase) }];
  }
}

/** Lays the itinerary's phases end to end on one scroll timeline. */
export function buildBeats(phases: JourneyPhase[]): Beat[] {
  const beats: Beat[] = [];
  let at = 0;
  for (const phase of phases) {
    beatsFor(phase).forEach((d, k) => {
      const { weight, ...rest } = d;
      beats.push({ ...rest, id: `${phase.id}-${k}`, group: phase.group, days: dayLabel(phase), phase, start: at, end: at + weight });
      at += weight;
    });
  }
  return beats;
}

/** Rough road distances (km) for the transfer counter. */
const KM: Record<string, number> = {
  "JED-makkah": 90,
  "MED-madinah": 20,
  "makkah-madinah": 450,
  "madinah-makkah": 450,
  "makkah-JED": 100,
  "madinah-JED": 420,
  "makkah-MED": 460,
  "madinah-MED": 20,
};

/** The bus leg a transfer phase drives (the landing itself is shown at the end of the flight). */
export function transferLeg(phase: Extract<JourneyPhase, { kind: "transfer" }>): TransportRoute {
  const fromAirport = phase.from === "JED" || phase.from === "MED";
  const fromMadinah = phase.from === "madinah";
  return {
    from: fromAirport ? AIRPORTS[phase.from as "JED" | "MED"].city : placeName(phase.from),
    fromNote: fromAirport ? AIRPORTS[phase.from as "JED" | "MED"].name : fromMadinah ? "MED · your hotel" : undefined,
    startHotel: fromMadinah,
    // the road from Madinah to Makkah passes the Miqat, where Ihram is put on
    stop: fromMadinah && phase.to === "makkah" ? { at: 0.2, name: "Masjid Dhul Hulayfah", note: "Abyar ‘Ali · Miqat: Ihram & Niyyah" } : undefined,
    to: placeName(phase.to),
    km: KM[`${phase.from}-${phase.to}`] ?? 100,
    landing: false,
  };
}
