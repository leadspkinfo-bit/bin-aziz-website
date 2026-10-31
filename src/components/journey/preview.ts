import { AIRPORTS, placeName, type JourneyPhase } from "@/lib/journey/itinerary";

type Kind = JourneyPhase["kind"];
type PhaseOf<K extends Kind> = Extract<JourneyPhase, { kind: K }>;

/** What each placeholder promises — replaced by the real scroll module when that phase is built. */
export const PREVIEW: { [K in Kind]: (p: PhaseOf<K>) => string[] } = {
  "home-departure": (p) =>
    p.ihram
      ? ["Home airport immigration", "Changing into Ihram before boarding", "Niyyah and Talbiyah before the Miqat, in the air"]
      : ["Home airport immigration", "Boarding in normal clothes — Ihram comes later, at Dhul Hulayfah"],
  "ksa-arrival": (p) => [`Landing at ${AIRPORTS[p.airport].name}`, "Holding up the visa and the Bin Aziz Transport voucher", "Voucher checked; boarding the assigned Bin Aziz vehicle"],
  transfer: (p) => [
    p.reason === "to-airport" ? "Luggage loaded for the airport" : "Bin Aziz bus on the highway",
    `${placeName(p.from)} to ${placeName(p.to)}`,
  ],
  miqat: () => ["Stop at Masjid Dhul Hulayfah (Abyar ‘Ali)", "Ghusl and a fresh Ihram", "Two rak‘ahs, then the Niyyah and Talbiyah"],
  "makkah-arrival": (p) => [p.stay === 1 ? "Hotel check-in and rest" : "Check back in", "Walking to Masjid al-Haram"],
  umrah: () => ["Tawaf with the 3D Kaaba — inside and out", "Sa’i between Safa and Marwah", "Halq or Taqsir"],
  "makkah-stay": (p) => [`${p.stayDays} day${p.stayDays === 1 ? "" : "s"} of prayer in the Haram`],
  "madinah-arrival": () => ["Hotel check-in near Masjid an-Nabawi"],
  "madinah-stay": (p) => [`${p.stayDays} day${p.stayDays === 1 ? "" : "s"} in Madinah`, "Masjid an-Nabawi in 3D — Rawdah, Riyad al-Jannah", "Ziyarat"],
  "final-departure": (p) => [
    ...(p.farewellTawaf ? ["A farewell Tawaf before leaving Makkah (recommended)"] : []),
    `Immigration at ${AIRPORTS[p.airport].city}`,
    "Boarding the flight home",
  ],
};


/** The bullet points shown beside a phase. */
export const previewPoints = (phase: JourneyPhase) => (PREVIEW[phase.kind] as (p: JourneyPhase) => string[])(phase);
