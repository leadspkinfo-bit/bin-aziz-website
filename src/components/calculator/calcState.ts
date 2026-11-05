import type { RoomType } from "@/lib/calc/constants";
import type { ChildEntry, HotelEntry, PackageInput, RateHotel } from "@/lib/calc/engine";
import { seasonOf, sortPeriods } from "@/lib/calc/seasons";

export type City = "makkah" | "madina";
/**
 * One date range of a hotel, chosen in the calendar: its rate period (a season such as "1st Ashra
 * Ramadan" or one of its dated periods, "Before Ramadan — 10 DEC TILL 31 JAN"), check-in and check-out
 * (ISO days). Nights = check-out − check-in.
 */
export type Stay = { id: string; season: string; from: string; to: string };
/** A hotel row: one hotel and room, with one or more stays (e.g. 5 nights 1st Ashra + 5 nights Mid Ashra). */
export type StayRow = { hotelId: string; room: RoomType; stays: Stay[] };
export type PackageState = Omit<PackageInput, "ziyarat" | "makkahList" | "madinaList"> & {
  customAirline: string;
  makkahList: StayRow[];
  madinaList: StayRow[];
};

/** The rate periods a city's hotels have (any room priced), in season and date order. */
export function cityPeriods(hotels: Record<string, RateHotel>) {
  const names = new Set<string>();
  for (const h of Object.values(hotels)) for (const [name, r] of Object.entries(h.rates)) if (Object.values(r).some((v) => (v ?? 0) > 0)) names.add(name);
  return sortPeriods(names);
}

/** The bars under one season: its periods that have rates. */
export function periodsOf(season: string, periods: string[]) {
  return periods.filter((p) => seasonOf(p) === seasonOf(season));
}

/**
 * The chosen period if hotels have it, else the first period of the same season, else the first period
 * the sheet has at all (e.g. only Ramadan and Shawwal rates are loaded), else the choice itself.
 */
export function resolvePeriod(chosen: string, periods: string[]) {
  // a season with no rates uploaded stays chosen (all five bars are always offered); it never jumps to another season
  return periods.includes(chosen) ? chosen : (periodsOf(chosen, periods)[0] ?? chosen);
}

const DAY = 86_400_000;
export const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const dayMs = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
export const stayNights = (s: Pick<Stay, "from" | "to">) => Math.max(0, Math.round((dayMs(s.to) - dayMs(s.from)) / DAY));
export const rowNights = (row: StayRow) => row.stays.reduce((sum, s) => sum + stayNights(s), 0);

const short = (ms: number, year = false) =>
  new Date(ms).toLocaleDateString("en-GB", { day: "2-digit", month: "short", ...(year ? { year: "numeric" } : {}), timeZone: "UTC" });
/** "18 Feb – 23 Feb 2027": check-in to check-out, the year once at the end. */
export function stayDates(s: Pick<Stay, "from" | "to">) {
  const a = dayMs(s.from);
  const b = dayMs(s.to);
  const sameYear = new Date(a).getUTCFullYear() === new Date(b).getUTCFullYear();
  return `${short(a, !sameYear)} – ${short(b, true)}`;
}

let nextStay = 0;
export const newStay = (season: string, from: string, to: string): Stay => ({ id: `stay-${++nextStay}`, season, from, to });

const hotelRow = (): StayRow => ({ hotelId: "", room: "sharing", stays: [] });
const childRow = (): ChildEntry => ({ count: 0, price: 0, bedType: "Without Bed" });

// A plain counter: the id is only a React key, and random values aren't allowed while the page prerenders.
let nextId = 0;

export function newPackage(): PackageState {
  return {
    id: `pkg-${++nextId}`,
    ticketPrice: 0,
    airline: "NONE",
    customAirline: "",
    ticketType1: "Direct",
    ticketType2: "Group Ticket",
    adults: 1,
    infants: 0,
    transportType: "bus",
    makkahList: [hotelRow()],
    madinaList: [hotelRow()],
    childDetails: [childRow()],
    notes: "",
    extraProfit: 0,
  };
}

export type Action =
  | { type: "add" }
  | { type: "remove"; id: string }
  | { type: "patch"; id: string; patch: Partial<PackageState> }
  | { type: "hotelAdd"; id: string; city: City }
  | { type: "hotelPatch"; id: string; city: City; index: number; patch: Partial<StayRow> }
  | { type: "hotelRemove"; id: string; city: City; index: number }
  | { type: "childAdd"; id: string }
  | { type: "childPatch"; id: string; index: number; patch: Partial<ChildEntry> }
  | { type: "childRemove"; id: string; index: number };

const LIST = { makkah: "makkahList", madina: "madinaList" } as const;

export function reducer(state: PackageState[], action: Action): PackageState[] {
  if (action.type === "add") return [...state, newPackage()];
  if (action.type === "remove") return state.filter((p) => p.id !== action.id);
  return state.map((p) => {
    if (p.id !== action.id) return p;
    switch (action.type) {
      case "patch":
        return { ...p, ...action.patch };
      case "hotelAdd":
        return { ...p, [LIST[action.city]]: [...p[LIST[action.city]], hotelRow()] };
      case "hotelPatch":
        return { ...p, [LIST[action.city]]: p[LIST[action.city]].map((h, i) => (i === action.index ? { ...h, ...action.patch } : h)) };
      case "hotelRemove":
        return { ...p, [LIST[action.city]]: p[LIST[action.city]].filter((_, i) => i !== action.index) };
      case "childAdd":
        return { ...p, childDetails: [...p.childDetails, childRow()] };
      case "childPatch":
        return { ...p, childDetails: p.childDetails.map((c, i) => (i === action.index ? { ...c, ...action.patch } : c)) };
      case "childRemove":
        return { ...p, childDetails: p.childDetails.filter((_, i) => i !== action.index) };
    }
  });
}

/** The periods each city's filled-in stays really use, given the periods its hotels have. */
export function packagePeriods(p: PackageState, periods: { makkah: string[]; madina: string[] }) {
  const used = (list: StayRow[], ps: string[]) => list.filter((h) => h.hotelId).flatMap((h) => h.stays.map((s) => resolvePeriod(s.season, ps)));
  return { makkah: used(p.makkahList, periods.makkah), madina: used(p.madinaList, periods.madina) };
}

/** Each stay of a chosen hotel becomes one priced row: same hotel and room, its own period and nights. */
function entries(list: StayRow[], periods: string[]): HotelEntry[] {
  return list
    .filter((h) => h.hotelId)
    .flatMap((h) => h.stays.map((s) => ({ hotelId: h.hotelId, room: h.room, nights: stayNights(s), season: resolvePeriod(s.season, periods), dates: stayDates(s), from: s.from })));
}

/** What the server receives: the airline's real name, each hotel with its city's period, and only rows that were actually filled in. */
export function toPayload(p: PackageState, periods: { makkah: string[]; madina: string[] }): PackageInput {
  const rest: Partial<PackageState> = { ...p };
  delete rest.customAirline;
  return {
    ...(rest as Omit<PackageInput, "ziyarat" | "makkahList" | "madinaList">),
    // no ziyarat choice on the page: the server prices it for everyone and the quote says "Free Ziyarat Included"
    ziyarat: { makkah: true, madina: true, adults: 0, children: 0, included: true },
    airline: p.airline === "CUSTOM AIRLINE" ? p.customAirline || "CUSTOM" : p.airline,
    makkahList: entries(p.makkahList, periods.makkah),
    madinaList: entries(p.madinaList, periods.madina),
    childDetails: p.childDetails.filter((c) => c.count > 0),
  };
}
