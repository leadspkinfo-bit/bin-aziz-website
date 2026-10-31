/**
 * The Hajj itinerary engine. The visitor gives only their arrival date, package length and arrival
 * airport; because Hajj dates are fixed, everything else follows. Pure functions, Hajj al-Tamattu‘.
 *
 * Rules:
 * - The core days never move: 8–12 Dhul Hijjah, or to the 13th if `stayFor13th`.
 * - Landing in Jeddah: Ihram for the Umrah on the flight, Makkah until the 8th; every day left after
 *   Hajj goes to Madinah, and the flight home leaves from Madinah. No days left: home from Jeddah.
 * - Landing in Madinah: two days are kept for Makkah before the 8th and the rest go to Madinah first,
 *   with Ihram at Dhul Hulayfah; days left after Hajj stay in Makkah, and the flight leaves Jeddah.
 */

import type { Airport } from "@/lib/journey/itinerary";
import type { HajjStepId } from "./hajjData";

export type HajjInput = {
  arrival: Airport;
  /** Arrival, in days before 8 Dhul Hijjah: 4 means the 4th */
  daysBefore: number;
  /** The whole stay in Saudi Arabia */
  packageDays: number;
  /** false = leave Mina on the 12th, before sunset */
  stayFor13th: boolean;
};

export const DEFAULT_HAJJ: HajjInput = { arrival: "JED", daysBefore: 4, packageDays: 15, stayFor13th: false };

export type HajjGroup = "home" | "umrah" | "core" | "madinah" | "farewell";

export type HajjPhase = {
  id: string;
  /** Which entry of hajjGuideData this phase shows */
  step: HajjStepId;
  group: HajjGroup;
  when: string | null;
};

export type HajjIssue = { field: keyof HajjInput; message: string };

/** What the three answers work out to. */
export type HajjPlan = {
  makkahBefore: number;
  coreDays: number;
  madinahDays: number;
  madinahFirst: boolean;
  /** Days left in Makkah after Hajj (Madinah-first routes) */
  makkahAfter: number;
  departure: Airport;
};

const clampDays = (n: number, max: number) => (Number.isFinite(n) ? Math.min(max, Math.max(0, Math.round(n))) : 0);
const days = (n: number) => `${n} day${n === 1 ? "" : "s"}`;
const KEPT_FOR_MAKKAH = 2;
const LAST_DAY_OF_MONTH = 29;

/** "4 Dhul Hijjah"; earlier or later dates fall outside the month, so they are given as a count. */
export function dhulHijjah(day: number) {
  if (day >= 1 && day <= LAST_DAY_OF_MONTH) return `${day} Dhul Hijjah`;
  return day < 1 ? `${days(8 - day)} before the 8th` : `${days(day - 12)} after the 12th`;
}

/** The cleaned input the engine actually uses. */
export function normaliseHajj(input: HajjInput): HajjInput {
  const min = input.arrival === "MED" ? 2 : 1;
  const daysBefore = Math.max(min, clampDays(input.daysBefore, 60));
  const coreDays = input.stayFor13th ? 6 : 5;
  return { ...input, daysBefore, packageDays: Math.max(daysBefore + coreDays, clampDays(input.packageDays, 90)) };
}

export function hajjPlan(input: HajjInput): HajjPlan {
  const i = normaliseHajj(input);
  const coreDays = i.stayFor13th ? 6 : 5;
  const left = i.packageDays - i.daysBefore - coreDays;
  if (i.arrival === "MED") {
    const makkahBefore = Math.min(KEPT_FOR_MAKKAH, i.daysBefore - 1);
    return { makkahBefore, coreDays, madinahDays: i.daysBefore - makkahBefore, madinahFirst: true, makkahAfter: left, departure: "JED" };
  }
  return { makkahBefore: i.daysBefore, coreDays, madinahDays: left, madinahFirst: false, makkahAfter: 0, departure: left > 0 ? "MED" : "JED" };
}

/** Problems the visitor should fix; the journey still renders with the cleaned values. */
export function validateHajj(input: HajjInput): HajjIssue[] {
  const issues: HajjIssue[] = [];
  const min = input.arrival === "MED" ? 2 : 1;
  if (input.daysBefore < min) issues.push({ field: "daysBefore", message: input.arrival === "MED" ? "Landing in Madinah needs at least 2 days before the 8th: one there, one in Makkah." : "Arrive at least a day before the 8th for your Umrah." });
  const core = input.stayFor13th ? 6 : 5;
  if (input.packageDays < input.daysBefore + core) issues.push({ field: "packageDays", message: `This arrival needs a package of at least ${input.daysBefore + core} days to cover Hajj.` });
  return issues;
}

/** The ordered phases the page renders, top to bottom. */
export function buildHajjJourney(input: HajjInput): HajjPhase[] {
  const i = normaliseHajj(input);
  const plan = hajjPlan(i);
  const lastHajjDay = i.stayFor13th ? 13 : 12;
  const phases: HajjPhase[] = [];
  const add = (step: HajjStepId, group: HajjGroup, when: string | null = null) => phases.push({ id: `${step}-${phases.length}`, step, group, when });

  add("leaving-home", "home");
  add("home-airport", "home");
  add("flight", "home");
  add("arrival", "home", dhulHijjah(8 - i.daysBefore));
  if (plan.madinahFirst) {
    add("madinah", "madinah", days(plan.madinahDays));
    add("miqat-dhul-hulayfah", "umrah");
  } else add("transfer-to-makkah", "home");
  add("makkah-hotel", "umrah", `${days(plan.makkahBefore)} in Makkah before Hajj`);
  add("first-umrah", "umrah");
  add("waiting-in-makkah", "umrah", "Until the 8th");

  add("ihram-at-hotel", "core", "8 Dhul Hijjah · morning");
  add("road-to-mina", "core", "8 Dhul Hijjah · morning");
  add("day-8-mina", "core", "8 Dhul Hijjah");
  add("day-9-arafat", "core", "9 Dhul Hijjah · day");
  add("day-9-muzdalifah", "core", "9 Dhul Hijjah · night");
  add("day-10-rami", "core", "10 Dhul Hijjah · Eid");
  add("day-10-qurbani", "core", "10 Dhul Hijjah · Eid");
  add("day-10-halq", "core", "10 Dhul Hijjah · Eid");
  add("day-10-ziyarah", "core", "10 Dhul Hijjah · by sunset of the 12th at the latest");
  add("day-11-tashreeq", "core", "11 Dhul Hijjah");
  add("day-12-tashreeq", "core", "12 Dhul Hijjah");
  if (i.stayFor13th) add("day-13-tashreeq", "core", "13 Dhul Hijjah");

  // the farewell Tawaf is the last act in Makkah, wherever the road goes next
  add("tawaf-wida", "farewell", plan.makkahAfter > 0 ? `After ${plan.makkahAfter} more day${plan.makkahAfter === 1 ? "" : "s"} in Makkah` : "Just before leaving Makkah");
  if (!plan.madinahFirst && plan.madinahDays > 0) add("madinah", "madinah", days(plan.madinahDays));
  add("departure", "farewell", `${dhulHijjah(lastHajjDay + plan.madinahDays * (plan.madinahFirst ? 0 : 1) + plan.makkahAfter)} · home from ${plan.departure === "JED" ? "Jeddah" : "Madinah"}`);
  return phases;
}

/** One-line route, e.g. "Jeddah → Makkah → Mina → Arafat → Muzdalifah → Mina → Makkah → Madinah". */
export function hajjRoute(input: HajjInput) {
  const i = normaliseHajj(input);
  const plan = hajjPlan(i);
  const start = plan.madinahFirst ? "Madinah" : "Jeddah";
  const end = plan.departure === "JED" ? "Jeddah" : "Madinah";
  const stops = [start, "Makkah", "Mina", "Arafat", "Muzdalifah", "Mina", "Makkah", end];
  return stops.filter((s, k) => s !== stops[k - 1]).join(" → ");
}

/** Pebbles needed: 7 on the 10th, 21 on the 11th and 12th, 21 more if staying for the 13th. */
export const pebblesNeeded = (input: HajjInput) => (input.stayFor13th ? 70 : 49);
