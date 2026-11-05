import { INFANT_PRICE_PKR, ROOM_CAPACITY, STANDARD_RATES, type RoomType } from "./constants";
import { seasonOf, sortPeriods } from "./seasons";

// Pure port of the Apps Script calculator: no database calls, same rounding, same fallbacks.

export type RoomRates = Partial<Record<RoomType, number>>;
export type RateHotel = { name: string; location: string; rates: Record<string, RoomRates> };

export type RatesData = {
  hotels: { makkah: Record<string, RateHotel>; madina: Record<string, RateHotel> };
  visa: { bus: Record<number, number>; private: Record<number, number> };
  dynamicProfit: number;
  periods: string[];
  ziyarat: { makkah: number; madina: number };
  sarToPkr: number;
  infantPrice?: number;
};

/** `season` picks this hotel's rates; without it the package season applies. */
/** `dates` is only shown (e.g. "18 Feb – 23 Feb 2027"); the price uses `nights`. */
export type HotelEntry = { hotelId: string; room: RoomType; nights: number; season?: string; dates?: string; from?: string };
export type ChildEntry = { count: number; price: number; bedType: "With Bed" | "Without Bed" };
/** Which ziyarat the package takes and for how many people; infants never pay ziyarat. */
export type ZiyaratInput = {
  makkah: boolean;
  madina: boolean;
  adults: number;
  children: number;
  /**
   * The calculator's rule (user request 2026-11-04): every adult and child pays the ziyarat of each city
   * the package has hotel nights in (infants never), folded into the per-adult / per-child price; the
   * client only reads "Free Ziyarat Included". `makkah`/`madina`/counts are then ignored.
   */
  included?: boolean;
};

export type PackageInput = {
  id: string;
  ticketPrice: number;
  airline: string;
  ticketType1: "Direct" | "Indirect";
  ticketType2: "Group Ticket" | "System Ticket";
  adults: number;
  infants: number;
  transportType: "bus" | "private";
  makkahList: HotelEntry[];
  madinaList: HotelEntry[];
  childDetails: ChildEntry[];
  /**
   * Chosen in the calculator: ziyarat is then its own line, (Makkah + Madina rate) × the people chosen.
   * Left out (older callers), the original rule applies: each priced person pays the ziyarat of every
   * city with hotel nights, inside the per-person price.
   */
  ziyarat?: ZiyaratInput;
  /** printed under the package in the quotation */
  notes?: string;
  /**
   * Extra markup typed by staff on the calculator page: divided equally by every traveller (adults +
   * children + infants) and added to each per-person price, so the quotation's lines add up to the total.
   * Never shown to the client as such. The fixed profit (`dynamicProfit`) is separate and untouched.
   */
  extraProfit?: number;
  season?: string;
};

/** `from` = check-in day (ISO), used to list the stays in trip order. */
export type HotelDetail = { name: string; room: string; nights: number; location: string; season: string; dates?: string; from?: string };

export function getRoomCapacity(room: string): number {
  return ROOM_CAPACITY[room as RoomType] ?? 1;
}

export function getVisaRate(rates: Record<number, number> | undefined, pax: number): number {
  if (!rates || Object.keys(rates).length === 0) return 700;
  const keys = Object.keys(rates)
    .map(Number)
    .sort((a, b) => a - b);
  for (const k of keys) if (k >= pax) return rates[k];
  return rates[keys[keys.length - 1]] ?? 700;
}

/**
 * The rate period a hotel row uses: the one asked for; else another period of the same season
 * (earliest first); else the hotel's first period (as the original app did).
 */
export function rateSeason(hotel: RateHotel, season: string | undefined) {
  if (season && hotel.rates[season]) return season;
  const own = sortPeriods(Object.keys(hotel.rates));
  const group = season ? seasonOf(season) : null;
  return (group && own.find((p) => seasonOf(p) === group)) || own[0];
}

/**
 * Hotel rows that cannot be priced: the room is N/A in the period they use, or the hotel has no rate at
 * all in the chosen season (a season with nothing uploaded is never priced with another season's rate).
 */
export function missingRates(pkg: Pick<PackageInput, "makkahList" | "madinaList" | "season">, allData: RatesData) {
  const out: string[] = [];
  for (const [list, hotels, city] of [
    [pkg.makkahList, allData.hotels.makkah, "Makkah"],
    [pkg.madinaList, allData.hotels.madina, "Madina"],
  ] as const) {
    for (const h of list ?? []) {
      if (!h.hotelId) continue;
      const hotel = hotels[h.hotelId];
      // e.g. the rate list was scanned again while the page was open: never price without the hotel
      if (!hotel) {
        out.push(`a ${city} hotel is no longer in the rate list — please refresh the page and choose it again`);
        continue;
      }
      const chosen = h.season || pkg.season;
      const used = rateSeason(hotel, chosen);
      const room = h.room || "sharing";
      const wanted = chosen ? seasonOf(chosen) : null;
      if (used && wanted && seasonOf(used) !== wanted) out.push(`${hotel.name} has no ${wanted} rates yet`);
      else if (!used || !((hotel.rates[used]?.[room] ?? 0) > 0)) out.push(`${hotel.name} has no ${room.toUpperCase()} rate${used ? ` in ${used}` : ""}`);
    }
  }
  return out;
}

/**
 * The visa slab a package pays (visa + transport, per person). Private transport goes by the people
 * actually travelling (adults + children); bus sharing keeps the original rule, which also counts the
 * beds of the largest room booked.
 */
export function visaQuote(pkg: Pick<PackageInput, "adults" | "childDetails" | "transportType" | "makkahList" | "madinaList">, allData: RatesData) {
  const adults = Math.trunc(Number(pkg.adults)) || 0;
  const children = (pkg.childDetails ?? []).reduce((sum, c) => sum + (Math.trunc(Number(c.count)) || 0), 0);
  const travellers = adults + children || 1;
  const rooms = [
    ...(pkg.makkahList ?? []).filter((h) => h.hotelId && allData.hotels.makkah[h.hotelId]),
    ...(pkg.madinaList ?? []).filter((h) => h.hotelId && allData.hotels.madina[h.hotelId]),
  ].map((h) => getRoomCapacity(h.room || "sharing"));
  const isPrivate = pkg.transportType === "private";
  const pax = isPrivate ? travellers : Math.max(travellers, ...rooms);
  return { pax, rate: getVisaRate(isPrivate ? allData.visa.private : allData.visa.bus, pax) };
}

function hotelNights(list: HotelEntry[] | undefined, hotels: Record<string, RateHotel>, season: string | undefined) {
  let sar = 0;
  let nights = 0;
  let capacity = 0;
  const details: HotelDetail[] = [];
  for (const h of list ?? []) {
    const hotel = h.hotelId ? hotels[h.hotelId] : undefined;
    if (!hotel) continue;
    const used = rateSeason(hotel, h.season || season);
    const rates = used ? hotel.rates[used] : undefined;
    if (!rates) continue;
    const room = h.room || "sharing";
    const n = Math.trunc(Number(h.nights)) || 0;
    sar += (rates[room] || 0) * n;
    nights += n;
    capacity = Math.max(capacity, getRoomCapacity(room));
    details.push({ name: hotel.name, room: room.toUpperCase(), nights: n, location: hotel.location || "-", season: used!, ...(h.dates ? { dates: h.dates } : {}), ...(h.from ? { from: h.from } : {}) });
  }
  return { sar, nights, capacity, details };
}

export function computePackageTotal(pkg: PackageInput, allData: RatesData) {
  const adults = Math.trunc(Number(pkg.adults)) || 0;
  const childDetails = pkg.childDetails ?? [];
  const children = childDetails.reduce((sum, c) => sum + (Math.trunc(Number(c.count)) || 0), 0);
  const totalPax = adults + children || 1;

  const makkah = hotelNights(pkg.makkahList, allData.hotels.makkah, pkg.season);
  const madina = hotelNights(pkg.madinaList, allData.hotels.madina, pkg.season);

  const totalHotelSAR = makkah.sar + madina.sar;
  const z = pkg.ziyarat;
  // per person ziyarat: from the choice when there is one, else every city with hotel nights
  const included = Boolean(z?.included);
  const ziyaratMakkah = z && !included ? z.makkah : makkah.nights > 0;
  const ziyaratMadina = z && !included ? z.madina : madina.nights > 0;
  const totalZiyaratSAR = (ziyaratMakkah ? allData.ziyarat.makkah : 0) + (ziyaratMadina ? allData.ziyarat.madina : 0);
  const { pax: effectivePax, rate: visaRateSAR } = visaQuote(pkg, allData);
  // with a choice, ziyarat leaves the per-person price and becomes its own line below
  const totalSAR = totalHotelSAR + visaRateSAR + (z ? 0 : totalZiyaratSAR);
  const clamp = (n: number, max: number) => Math.min(Math.max(Math.trunc(Number(n)) || 0, 0), max);
  const ziyaratAdults = z && totalZiyaratSAR > 0 ? (included ? adults : clamp(z.adults, adults)) : 0;
  const ziyaratChildren = z && totalZiyaratSAR > 0 ? (included ? children : clamp(z.children, children)) : 0;
  const ziyaratTotalSAR = totalZiyaratSAR * (ziyaratAdults + ziyaratChildren);

  return {
    grandTotal: Math.round(totalSAR * allData.sarToPkr + allData.dynamicProfit),
    vRatePKR: Math.round(visaRateSAR * allData.sarToPkr),
    ziyaratPKR: Math.round(totalZiyaratSAR * allData.sarToPkr),
    dynamicProfitPKR: allData.dynamicProfit,
    hotelCostSAR: totalHotelSAR,
    visaCostSAR: visaRateSAR,
    ziyaratSAR: totalZiyaratSAR,
    /** true: ziyarat is the separate line below; false: it sits inside the per-person price (old rule) */
    ziyaratSeparate: Boolean(z) && !included,
    /** true: ziyarat sits inside the per-adult and per-child prices; the quotation says "Free Ziyarat Included" */
    ziyaratIncluded: included,
    ziyaratMakkah,
    ziyaratMadina,
    ziyaratAdults,
    ziyaratChildren,
    ziyaratTotalSAR,
    ziyaratTotalPKR: Math.round(ziyaratTotalSAR * allData.sarToPkr),
    makkahDetails: makkah.details,
    madinaDetails: madina.details,
    totalMakkahNights: makkah.nights,
    totalMadinaNights: madina.nights,
    season: pkg.season ?? STANDARD_RATES,
    transportType: pkg.transportType ?? "bus",
    totalPax,
    effectivePaxForVisa: effectivePax,
    sarToPkr: allData.sarToPkr,
    adults,
    children,
    infants: Math.trunc(Number(pkg.infants)) || 0,
    ticketPrice: Number(pkg.ticketPrice) || 0,
    airline: pkg.airline || "-",
    ticketType1: pkg.ticketType1 || "Direct",
    ticketType2: pkg.ticketType2 || "Group Ticket",
    childDetails,
    notes: pkg.notes?.trim() ?? "",
  };
}

export function computeMultiPackage(packages: PackageInput[], allData: RatesData) {
  const baseInfantPrice = allData.infantPrice ?? INFANT_PRICE_PKR;
  let grandTotal = 0;
  const results = packages.map((pkg, i) => {
    const result = computePackageTotal(pkg, allData);
    // staff's extra profit, shared equally by every traveller (adults + children + infants) and folded
    // into each per-person price, so per person × people still adds up to the total exactly
    const travellers = result.adults + result.children + result.infants;
    const extra = Math.max(0, Number(pkg.extraProfit) || 0);
    const share = travellers > 0 ? Math.round(extra / travellers) : 0;
    const infantPrice = baseInfantPrice + share;
    // ziyarat folded into each adult's and child's price (never an infant's), or kept as its own line
    const zPer = result.ziyaratIncluded ? result.ziyaratPKR : 0;
    const perAdultPrice = result.grandTotal + result.ticketPrice + zPer + share;
    let totalChildrenCost = 0;
    // the price of one child in each child row, for the quotation's "Child per person" line
    const childPrices: { count: number; bedType: string; each: number }[] = [];
    for (const child of result.childDetails) {
      const count = Math.trunc(Number(child.count)) || 0;
      const price = Number(child.price) || 0;
      const perChild = (child.bedType === "With Bed" ? result.grandTotal + price : result.vRatePKR + result.dynamicProfitPKR + price) + zPer + share;
      totalChildrenCost += count * perChild;
      if (count > 0) childPrices.push({ count, bedType: child.bedType, each: perChild });
    }
    const totalInfantsCost = result.infants * infantPrice;
    const finalPackageTotal = perAdultPrice * result.adults + totalChildrenCost + totalInfantsCost + (result.ziyaratIncluded ? 0 : result.ziyaratTotalPKR);
    grandTotal += finalPackageTotal;
    return { ...result, finalPackageTotal, perAdultPrice, totalChildrenCost, childPrices, totalInfantsCost, infantPrice, packageNumber: i + 1 };
  });
  return { packages: results, grandTotal, packageCount: packages.length };
}

export type MultiPackageResult = ReturnType<typeof computeMultiPackage>;
export type PackageResult = MultiPackageResult["packages"][number];
