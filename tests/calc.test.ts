import { describe, expect, it } from "vitest";
import { computeMultiPackage, computePackageTotal, getRoomCapacity, getVisaRate, missingRates, rateSeason, type PackageInput, type RatesData } from "@/lib/calc/engine";
import { parseRange, periodLabel, periodName, seasonOf, seasonsForPeriod, sortPeriods } from "@/lib/calc/seasons";
import { newPackage, newStay, reducer, resolvePeriod, stayDates, stayNights, toPayload } from "@/components/calculator/calcState";
import { periodWindow, seasonWindow } from "@/lib/calc/seasons";
import { canonicalize, hotelKey, splitCombined } from "@/lib/calc/hotelNames";
import { splitLocation, tripStays } from "@/components/calculator/ShareTools";
import { publicResult } from "@/lib/calc/quotations";
import { cleanVisa_, combineScans, isEmptyScan, mergeHotels, normalizeScan, num_, pick_, replaceSeasons, type ScanRate } from "@/lib/gemini/normalize";

const rate = { sharing: 100, quint: 120, quad: 150, triple: 200, double: 300 };
const data: RatesData = {
  hotels: {
    makkah: { a: { name: "Hotel A", location: "500m", rates: { Peak: rate } }, b: { name: "Hotel B", location: "-", rates: { Y: rate } } },
    madina: { m: { name: "Hotel M", location: "100m", rates: { Peak: rate } } },
  },
  visa: { bus: { 5: 615, 10: 600 }, private: { 5: 900 } },
  dynamicProfit: 20000,
  periods: ["Peak"],
  ziyarat: { makkah: 10, madina: 12 },
  sarToPkr: 78,
};

const pkg = (over: Partial<PackageInput> = {}): PackageInput => ({
  id: "1",
  ticketPrice: 0,
  airline: "PIA",
  ticketType1: "Direct",
  ticketType2: "Group Ticket",
  adults: 1,
  infants: 0,
  transportType: "bus",
  makkahList: [],
  madinaList: [],
  childDetails: [],
  season: "Peak",
  ...over,
});

describe("getRoomCapacity", () => {
  it.each([
    ["sharing", 6],
    ["quint", 5],
    ["quad", 4],
    ["triple", 3],
    ["double", 2],
    ["unknown", 1],
  ])("%s = %i", (room, n) => expect(getRoomCapacity(room)).toBe(n));
});

describe("getVisaRate", () => {
  it("defaults to 700 when empty", () => expect(getVisaRate({}, 3)).toBe(700));
  it("finds the slab", () => {
    expect(getVisaRate({ 5: 615, 10: 600 }, 5)).toBe(615);
    expect(getVisaRate({ 5: 615, 10: 600 }, 7)).toBe(600);
    expect(getVisaRate({ 5: 615, 10: 600 }, 20)).toBe(600);
    expect(getVisaRate({ 4: 650 }, 9)).toBe(650);
  });
});

describe("computePackageTotal", () => {
  it("one Makkah hotel, one sharing night", () => {
    const r = computePackageTotal(pkg({ makkahList: [{ hotelId: "a", room: "sharing", nights: 1 }] }), data);
    expect(r.hotelCostSAR).toBe(100);
    expect(r.ziyaratSAR).toBe(10);
    expect(r.visaCostSAR).toBe(600); // a sharing room counts as 6, so the 10-pax slab applies
    expect(r.grandTotal).toBe(710 * 78 + 20000);
  });
  it("0 nights adds no ziyarat", () => {
    expect(computePackageTotal(pkg({ makkahList: [{ hotelId: "a", room: "sharing", nights: 0 }] }), data).ziyaratSAR).toBe(0);
  });
  it("sums several hotels", () => {
    const r = computePackageTotal(
      pkg({
        makkahList: [
          { hotelId: "a", room: "sharing", nights: 2 },
          { hotelId: "a", room: "double", nights: 1 },
        ],
        madinaList: [{ hotelId: "m", room: "quad", nights: 3 }],
      }),
      data,
    );
    expect(r.totalMakkahNights).toBe(3);
    expect(r.totalMadinaNights).toBe(3);
    expect(r.hotelCostSAR).toBe(200 + 300 + 450);
    expect(r.ziyaratSAR).toBe(22);
  });
  it("visa slab uses the room's capacity", () => {
    const r = computePackageTotal(pkg({ makkahList: [{ hotelId: "a", room: "triple", nights: 1 }] }), data);
    expect(r.effectivePaxForVisa).toBe(3);
  });
  it("falls back to the first season the hotel has", () => {
    const r = computePackageTotal(pkg({ season: "X", makkahList: [{ hotelId: "b", room: "sharing", nights: 1 }] }), data);
    expect(r.hotelCostSAR).toBe(100);
  });
});

describe("computeMultiPackage", () => {
  const stay = { makkahList: [{ hotelId: "a", room: "sharing" as const, nights: 1 }] };
  const single = computePackageTotal(pkg(stay), data).grandTotal;

  it("adults only", () => {
    const r = computeMultiPackage([pkg({ ...stay, adults: 2, ticketPrice: 1000 })], data).packages[0];
    expect(r.perAdultPrice).toBe(single + 1000);
    expect(r.finalPackageTotal).toBe((single + 1000) * 2);
  });
  it("child with bed", () => {
    const r = computeMultiPackage([pkg({ ...stay, adults: 0, childDetails: [{ count: 2, price: 500, bedType: "With Bed" }] })], data).packages[0];
    expect(r.totalChildrenCost).toBe((single + 500) * 2);
  });
  it("child without bed", () => {
    const r = computeMultiPackage([pkg({ ...stay, adults: 0, childDetails: [{ count: 2, price: 500, bedType: "Without Bed" }] })], data).packages[0];
    expect(r.totalChildrenCost).toBe((r.vRatePKR + r.dynamicProfitPKR + 500) * 2);
  });
  it("infant is 95000", () => {
    expect(computeMultiPackage([pkg({ ...stay, infants: 2 })], data).packages[0].totalInfantsCost).toBe(190000);
  });
  it("uses the admin's infant price", () => {
    expect(computeMultiPackage([pkg({ ...stay, infants: 1 })], { ...data, infantPrice: 80000 }).packages[0].totalInfantsCost).toBe(80000);
  });
  it("private transport goes by the people travelling, not the room size", () => {
    const list = { ...data, visa: { ...data.visa, private: { 1: 815, 2: 680, 3: 640, 4: 620 } } };
    const sharing = { makkahList: [{ hotelId: "a", room: "sharing" as const, nights: 1 }] };
    expect(computePackageTotal(pkg({ ...sharing, transportType: "private" }), list).visaCostSAR).toBe(815);
    expect(computePackageTotal(pkg({ ...sharing, transportType: "private", adults: 2, childDetails: [{ count: 1, price: 0, bedType: "Without Bed" }] }), list).visaCostSAR).toBe(640);
    expect(computePackageTotal(pkg({ ...sharing, transportType: "private", adults: 7 }), list).visaCostSAR).toBe(620);
    // bus sharing keeps the original rule: the 6-bed room counts as 6
    expect(computePackageTotal(pkg({ ...sharing }), data).effectivePaxForVisa).toBe(6);
  });
  it("ziyarat as its own line: (Makkah + Madina) × the people chosen, children without bed too", () => {
    const both = { makkahList: [{ hotelId: "a", room: "sharing" as const, nights: 1 }], madinaList: [{ hotelId: "m", room: "sharing" as const, nights: 1 }] };
    const old = computeMultiPackage([pkg({ ...both, adults: 2 })], data).packages[0];
    const kids = [{ count: 2, price: 0, bedType: "Without Bed" as const }];
    const r = computeMultiPackage([pkg({ ...both, adults: 2, childDetails: kids, infants: 1, ziyarat: { makkah: true, madina: true, adults: 2, children: 2 } })], data).packages[0];
    expect(r.ziyaratTotalSAR).toBe((10 + 12) * 4); // infants never counted
    expect(r.ziyaratTotalPKR).toBe(22 * 4 * 78);
    expect(r.perAdultPrice).toBe(old.perAdultPrice - 22 * 78); // ziyarat left the per-person price
    // everyone going costs the adults exactly what the old rule did
    const all = computeMultiPackage([pkg({ ...both, adults: 2, ziyarat: { makkah: true, madina: true, adults: 2, children: 0 } })], data).packages[0];
    expect(all.finalPackageTotal).toBe(old.finalPackageTotal);
  });
  it("ziyarat: only Makkah, fewer people, none, and counts above the travellers are capped", () => {
    const stayBoth = { makkahList: [{ hotelId: "a", room: "sharing" as const, nights: 1 }], madinaList: [{ hotelId: "m", room: "sharing" as const, nights: 1 }] };
    const one = (z: { makkah: boolean; madina: boolean; adults: number; children: number }) => computeMultiPackage([pkg({ ...stayBoth, adults: 3, ziyarat: z })], data).packages[0];
    expect(one({ makkah: true, madina: false, adults: 3, children: 0 }).ziyaratTotalSAR).toBe(30);
    expect(one({ makkah: true, madina: true, adults: 1, children: 0 }).ziyaratTotalSAR).toBe(22);
    expect(one({ makkah: false, madina: false, adults: 3, children: 0 }).ziyaratTotalPKR).toBe(0);
    expect(one({ makkah: true, madina: true, adults: 9, children: 5 }).ziyaratTotalSAR).toBe(22 * 3);
  });
  it("sums two packages", () => {
    const r = computeMultiPackage([pkg(stay), pkg(stay)], data);
    expect(r.grandTotal).toBe(single * 2);
    expect(r.packages[1].packageNumber).toBe(2);
  });
});

describe("normalizeScan", () => {
  it("sorts periods into the four seasons", () => {
    const r = normalizeScan(
      {
        hotels: [
          {
            name: "H",
            rates: [
              { period: "01 Nov - 15 Dec 2026", sharing: 100 },
              { period: "16 Dec 2026 - 31 Jan 2027", sharing: 120 },
              { period: "Last Ashra Ramadan", sharing: 300 },
              { period: "8 Feb - 17 Feb 2027", sharing: 200 },
            ],
          },
        ],
      },
      "makkah",
    );
    // each dated range is its own bar under its season; an undated Ashra heading keeps the plain name
    expect(r.periods).toEqual([
      "Before Ramadan — 01 Nov - 15 Dec 2026",
      "Before Ramadan — 16 Dec 2026 - 31 Jan 2027",
      "1st Ashra Ramadan — 8 Feb - 17 Feb 2027",
      "Last Ashra Ramadan",
    ]);
    expect(r.makkah[0].rates.map((x) => [x.period, x.sharing])).toEqual([
      ["Before Ramadan — 01 Nov - 15 Dec 2026", 100],
      ["Before Ramadan — 16 Dec 2026 - 31 Jan 2027", 120],
      ["1st Ashra Ramadan — 8 Feb - 17 Feb 2027", 200],
      ["Last Ashra Ramadan", 300],
    ]);
  });
  it("two undated headings in one season keep the higher rate", () => {
    const r = normalizeScan({ hotels: [{ name: "H", rates: [{ period: "Peak", sharing: 100 }, { period: "Normal", sharing: 90 }] }] }, "makkah");
    expect(r.makkah[0].rates).toEqual([{ period: "Before Ramadan", sharing: 100, quint: 0, quad: 0, triple: 0, double: 0 }]);
  });
  it("reads a list shaped like the 1448H sheet: two date columns, N/A sharing, quint room prices", () => {
    const till = "CHECKOUT TILL 10 DEC 2026";
    const after = "10 DEC 2026 TILL 31 JAN 2027";
    const r = normalizeScan(
      {
        hotels: [
          { name: "ARAFAT ZAHBI", rates: [{ period: till, sharing: 14, roomRate: 84 }, { period: after, sharing: 19, roomRate: 114 }] },
          { name: "LOLO AL FALAH", rates: [{ period: till, sharing: "N/A", roomRate: 550 }, { period: after, sharing: null, roomRate: 650 }] },
          { name: "DAIF AJYAD", rates: [{ period: till, quint: 360, roomRate: 320 }, { period: after, quint: 420, roomRate: 370 }] },
        ],
      },
      "makkah",
    );
    expect(r.periods).toEqual([`Before Ramadan — ${till}`, `Before Ramadan — ${after}`]);
    const [arafat, lolo, daif] = r.makkah;
    expect(arafat.rates[0]).toEqual({ period: `Before Ramadan — ${till}`, sharing: 14, quint: 0, quad: 21, triple: 28, double: 42 });
    expect(arafat.rates[1]).toMatchObject({ sharing: 19, double: 57, triple: 38, quad: 28.5, quint: 0 }); // 114 ÷ 4, not rounded
    expect(lolo.rates[1]).toMatchObject({ sharing: 0, double: 325 }); // N/A stays N/A
    expect(daif.rates[1]).toMatchObject({ sharing: 0, quint: 84, double: 185 }); // QUINT 420 is a room price
  });
  it("classifies the city by name", () => {
    const r = normalizeScan({ hotels: [{ name: "H1", city: "Medina" }, { name: "H2", city: "Makkah" }] }, "auto");
    expect(r.madina.map((h) => h.name)).toEqual(["H1"]);
    expect(r.makkah.map((h) => h.name)).toEqual(["H2"]);
  });
  it("target overrides the city", () => {
    expect(normalizeScan({ hotels: [{ name: "H", city: "Makkah" }] }, "madina").madina).toHaveLength(1);
  });
  it("divides a whole-room price, keeps a printed one", () => {
    expect(normalizeScan({ hotels: [{ name: "H", rates: [{ period: "Peak", roomRate: 1200, sharing: null }] }] }, "auto").makkah[0].rates[0].sharing).toBe(200);
    expect(pick_(200, 1200, 6)).toBe(200);
  });
  it("keeps rates exact, never rounded to whole riyals", () => {
    expect(pick_(null, 185, 4)).toBe(46.25); // Mella quad
    expect(pick_(null, 290, 4)).toBe(72.5); // Burj Mukhtara quad
    expect(pick_(null, 290, 3)).toBe(96.6667);
    expect(pick_(null, 115, 2)).toBe(57.5);
    expect(pick_(360, 320, 5)).toBe(72);
  });
  it("splits a printed quint ROOM price (Daif Ajyad: QUINT 420 beside a 370 room rate)", () => {
    expect(pick_(420, 370, 5)).toBe(84);
    expect(pick_(19, 114, 6)).toBe(19);
  });
  it("num_ edge cases", () => {
    for (const v of ["", "-", "N/A", "on request", null]) expect(num_(v)).toBeNull();
    expect(num_("1,200")).toBe(1200);
  });
  it("cleanVisa_ drops bad rows", () => {
    expect(cleanVisa_([{ pax: 0, rate: 5 }, { pax: 5, rate: 0 }, { pax: 5, rate: "615" }])).toEqual([{ pax: 5, rate: 615 }]);
  });
  it("detects an empty scan across several images", () => {
    expect(isEmptyScan(combineScans([normalizeScan({}, "auto"), normalizeScan({}, "transport")]))).toBe(true);
    expect(isEmptyScan(combineScans([normalizeScan({ ziyarat: { makkah: 10 } }, "auto")]))).toBe(false);
  });
});

describe("mergeHotels", () => {
  const r = (period: string, sharing: number): ScanRate => ({ period, sharing, quint: 0, quad: 0, triple: 0, double: 0 });
  const old = [{ name: "Hilton ", location: "100m", rates: [r("A", 1)] }];

  it("adds a new period", () => {
    expect(mergeHotels(old, [{ name: "Hilton", location: "-", rates: [r("B", 2)] }])[0].rates).toHaveLength(2);
  });
  it("new rate wins the same period", () => {
    expect(mergeHotels(old, [{ name: "Hilton", location: "-", rates: [r("A", 9)] }])[0].rates[0].sharing).toBe(9);
  });
  it("'-' does not overwrite a location", () => {
    expect(mergeHotels(old, [{ name: "Hilton", location: "-", rates: [] }])[0].location).toBe("100m");
  });
  it("matches names case-insensitively and keeps others", () => {
    const m = mergeHotels(old, [
      { name: "HILTON", location: "200m", rates: [] },
      { name: "Other", location: "-", rates: [] },
    ]);
    expect(m).toHaveLength(2);
    expect(m[0].location).toBe("200m");
  });
});

describe("seasons", () => {
  const now = Date.UTC(2026, 10, 3);
  it.each([
    ["1st Ashra Ramadan", ["1st Ashra Ramadan"]],
    ["Ramadan 11-20", ["Mid Ashra Ramadan"]],
    ["Ramzan last ashra", ["Last Ashra Ramadan"]],
    ["01 - 15 Dec 2026", ["Before Ramadan"]],
    ["25 Feb - 12 Mar 2027", ["Mid Ashra Ramadan", "Last Ashra Ramadan", "Shawwal"]], // Ramadan 1448 ends 9 Mar 2027
    ["15 Mar - 30 Mar 2027", ["Shawwal"]],
    ["Shawwal rates", ["Shawwal"]],
    ["Eid ul Fitr package", ["Shawwal"]],
    ["01 May - 30 May 2027", ["Before Ramadan"]], // after Shawwal: an ordinary period again
    ["01/03/2027 - 09/03/2027", ["Last Ashra Ramadan"]],
    ["Peak season", ["Before Ramadan"]],
  ])("%s", (period, expected) => expect(seasonsForPeriod(period, undefined, now)).toEqual(expected));
  it("uses the AI's answer when the heading has no dates", () => {
    expect(seasonsForPeriod("Peak season", ["Mid Ashra Ramadan"], now)).toEqual(["Mid Ashra Ramadan"]);
  });
  it("reads a range without a year as the coming one", () => {
    expect(parseRange("10 Feb - 20 Feb", now)?.[0]).toBe(Date.UTC(2027, 1, 10));
  });
});

describe("rate periods", () => {
  const till = "Before Ramadan — CHECKOUT TILL 10 DEC";
  const after = "Before Ramadan — 10 DEC TILL 31 JAN";
  it("names, groups and orders periods", () => {
    expect(periodName("Before Ramadan", "10 DEC TILL 31 JAN")).toBe(after);
    expect(seasonOf(after)).toBe("Before Ramadan");
    expect(seasonOf("Peak")).toBeNull();
    expect(periodLabel(after)).toBe("10 DEC TILL 31 JAN");
    expect(periodLabel("Before Ramadan")).toBe("");
    expect(sortPeriods(["Last Ashra Ramadan", after, till, "Before Ramadan"], Date.UTC(2026, 10, 3))).toEqual(["Before Ramadan", till, after, "Last Ashra Ramadan"]);
  });
  it("a hotel without the chosen period uses another one of the same season", () => {
    const h = { name: "H", location: "-", rates: { [till]: rate, [after]: rate, "1st Ashra Ramadan": rate } };
    expect(rateSeason(h, after)).toBe(after);
    expect(rateSeason({ ...h, rates: { [till]: rate, "1st Ashra Ramadan": rate } }, after)).toBe(till);
    expect(rateSeason({ ...h, rates: { "1st Ashra Ramadan": rate } }, after)).toBe("1st Ashra Ramadan");
  });
  it("flags a room that is N/A in the period it uses", () => {
    const na: RatesData = { ...data, hotels: { makkah: { a: { name: "LOLO", location: "-", rates: { Peak: { ...rate, sharing: 0 } } } }, madina: {} } };
    expect(missingRates({ makkahList: [{ hotelId: "a", room: "sharing", nights: 2 }], madinaList: [], season: "Peak" }, na)).toEqual(["LOLO has no SHARING rate in Peak"]);
    expect(missingRates({ makkahList: [{ hotelId: "a", room: "double", nights: 2 }], madinaList: [], season: "Peak" }, na)).toEqual([]);
  });
});

describe("all five seasons can be chosen, whatever the sheet has", () => {
  const ramadanSheet = ["1st Ashra Ramadan — 8 Feb - 17 Feb 2027", "Last Ashra Ramadan — 28 Feb - 9 Mar 2027", "Shawwal — 10 Mar - 8 Apr 2027"];
  it("a season the sheet lacks stays chosen; a season it has picks its first dates", () => {
    expect(resolvePeriod("Before Ramadan", ramadanSheet)).toBe("Before Ramadan");
    expect(resolvePeriod("Shawwal", ramadanSheet)).toBe("Shawwal — 10 Mar - 8 Apr 2027");
  });
  it("a season with no rates is refused, never priced with another season", () => {
    const only: RatesData = { ...data, hotels: { makkah: { a: { name: "H", location: "-", rates: { [ramadanSheet[0]]: rate } } }, madina: {} } };
    const row = { hotelId: "a", room: "double" as const, nights: 2 };
    expect(missingRates({ makkahList: [{ ...row, season: "Before Ramadan" }], madinaList: [] }, only)).toEqual(["H has no Before Ramadan rates yet"]);
    expect(missingRates({ makkahList: [{ ...row, season: "1st Ashra Ramadan" }], madinaList: [] }, only)).toEqual([]);
    // a hotel id from before a re-scan is refused, not silently left out of the price
    expect(missingRates({ makkahList: [{ ...row, hotelId: "gone" }], madinaList: [] }, only)).toHaveLength(1);
  });
  it("a Shawwal heading is stored under Shawwal", () => {
    const r = normalizeScan({ hotels: [{ name: "H", rates: [{ period: "SHAWWAL 10 MAR TILL 8 APR 2027", roomRate: 400 }] }] }, "makkah");
    expect(r.periods).toEqual(["Shawwal — SHAWWAL 10 MAR TILL 8 APR 2027"]);
  });
});

describe("per-hotel season", () => {
  it("a hotel row can use its own season", () => {
    const two: RatesData = { ...data, hotels: { ...data.hotels, makkah: { a: { name: "A", location: "-", rates: { Peak: rate, Low: { ...rate, sharing: 50 } } } } } };
    const r = computePackageTotal(pkg({ makkahList: [{ hotelId: "a", room: "sharing", nights: 1, season: "Low" }] }), two);
    expect(r.hotelCostSAR).toBe(50);
    expect(r.makkahDetails[0].season).toBe("Low");
  });
});

describe("sheets uploaded one season at a time (Replace mode)", () => {
  const sheet = (heading: string, hotels: Record<string, number>) =>
    normalizeScan({ hotels: Object.entries(hotels).map(([name, sharing]) => ({ name, city: "Makkah", rates: [{ period: heading, sharing }] })) }, "makkah").makkah;
  const now = Date.parse("2026-11-04T00:00:00Z");
  const periodsOf = (hotels: ReturnType<typeof sheet>) => sortPeriods(hotels.flatMap((h) => h.rates.map((r) => r.period)), now);

  it("keeps the other seasons and fills each Ashra from its own sheet", () => {
    let db = [
      ...sheet("CHECKOUT TILL 10 DEC", { A: 14, B: 20 }),
      ...sheet("10 DEC TILL 31 JAN", { A: 19, B: 25 }),
    ];
    db = replaceSeasons([], db).hotels;
    const first = replaceSeasons(db, sheet("1ST ASHRA RAMADAN", { A: 60 }));
    expect(first.replaced).toEqual(["1st Ashra Ramadan"]);
    db = first.hotels;
    db = replaceSeasons(db, sheet("LAST ASHRA RAMADAN", { A: 120, C: 150 })).hotels;
    db = replaceSeasons(db, sheet("MID ASHRA RAMADAN", { A: 80 })).hotels;
    expect(db.map((h) => h.name).sort()).toEqual(["A", "B", "C"]);
    const a = db.find((h) => h.name === "A")!;
    expect(Object.fromEntries(a.rates.map((r) => [seasonOf(r.period), r.sharing]))).toMatchObject({
      "1st Ashra Ramadan": 60, "Mid Ashra Ramadan": 80, "Last Ashra Ramadan": 120,
    });
    expect(a.rates.filter((r) => seasonOf(r.period) === "Before Ramadan").map((r) => r.sharing).sort()).toEqual([14, 19]);
    // a hotel only on the Last Ashra sheet has only that season
    expect(db.find((h) => h.name === "C")!.rates.map((r) => r.period)).toEqual(["Last Ashra Ramadan"]);
  });

  it("a new Before Ramadan sheet with one date range replaces both old ranges, Ramadan stays", () => {
    let db = replaceSeasons([], [...sheet("CHECKOUT TILL 10 DEC", { A: 14, B: 20 }), ...sheet("10 DEC TILL 31 JAN", { A: 19, B: 25 })]).hotels;
    db = replaceSeasons(db, sheet("1ST ASHRA RAMADAN", { A: 60, B: 70 })).hotels;
    db = replaceSeasons(db, sheet("1 JAN TILL 31 JAN", { A: 22 })).hotels;
    expect(periodsOf(db)).toEqual(["Before Ramadan — 1 JAN TILL 31 JAN", "1st Ashra Ramadan"]);
    // B is not on the new Before Ramadan sheet: its old Before Ramadan rates go, its Ramadan rate stays
    expect(db.find((h) => h.name === "B")!.rates.map((r) => r.period)).toEqual(["1st Ashra Ramadan"]);
  });

  it("a Ramadan sheet that prints only dates is sorted by the Ramadan calendar", () => {
    // 1 Ramadan 1448 ≈ 8 Feb 2027: 8–17 Feb is the 1st Ashra, 18–27 Feb the Mid Ashra
    const db = replaceSeasons([], [...sheet("08 FEB TILL 17 FEB 2027", { A: 60 }), ...sheet("18 FEB TILL 27 FEB 2027", { A: 80 })]).hotels;
    expect(db[0].rates.map((r) => seasonOf(r.period))).toEqual(["1st Ashra Ramadan", "Mid Ashra Ramadan"]);
  });
});


describe("stay dates from the calendar", () => {
  const periods = ["Before Ramadan — CHECKOUT TILL 10 DEC", "Before Ramadan — 10 DEC TILL 31 JAN", "1st Ashra Ramadan", "Mid Ashra Ramadan"];

  it("counts nights as check-out minus check-in and writes the dates once", () => {
    expect(stayNights({ from: "2027-02-08", to: "2027-02-13" })).toBe(5);
    expect(stayDates({ from: "2027-02-08", to: "2027-02-13" })).toBe("08 Feb – 13 Feb 2027");
    expect(stayDates({ from: "2026-12-28", to: "2027-01-02" })).toBe("28 Dec 2026 – 02 Jan 2027");
  });

  it("one hotel, 5 nights 1st Ashra + 5 nights Mid Ashra, each on its own rate", () => {
    let state = [newPackage()];
    const id = state[0].id;
    const stays = [newStay("1st Ashra Ramadan", "2027-02-08", "2027-02-13"), newStay("Mid Ashra Ramadan", "2027-02-18", "2027-02-23")];
    state = reducer(state, { type: "hotelPatch", id, city: "makkah", index: 0, patch: { hotelId: "h", stays } });
    const payload = toPayload(state[0], { makkah: periods, madina: [] });
    expect(payload.makkahList.map((h) => [h.season, h.nights, h.dates])).toEqual([
      ["1st Ashra Ramadan", 5, "08 Feb – 13 Feb 2027"],
      ["Mid Ashra Ramadan", 5, "18 Feb – 23 Feb 2027"],
    ]);
    const data: RatesData = {
      hotels: { makkah: { h: { name: "H", location: "-", rates: { "1st Ashra Ramadan": { sharing: 100 }, "Mid Ashra Ramadan": { sharing: 150 } } } }, madina: {} },
      visa: { bus: { 1: 0 }, private: {} },
      dynamicProfit: 0,
      periods: [],
      ziyarat: { makkah: 0, madina: 0 },
      sarToPkr: 1,
    };
    const r = computePackageTotal({ ...payload, madinaList: [] }, data);
    expect(r.hotelCostSAR).toBe(5 * 100 + 5 * 150);
    expect(r.totalMakkahNights).toBe(10);
    expect(r.makkahDetails.map((d) => d.dates)).toEqual(["08 Feb – 13 Feb 2027", "18 Feb – 23 Feb 2027"]);
  });

  it("a hotel chosen without dates is not priced", () => {
    let state = [newPackage()];
    state = reducer(state, { type: "hotelPatch", id: state[0].id, city: "makkah", index: 0, patch: { hotelId: "h" } });
    expect(toPayload(state[0], { makkah: periods, madina: [] }).makkahList).toEqual([]);
  });

  it("knows the dates of each season and dated period", () => {
    const now = Date.parse("2026-11-04T00:00:00Z");
    const d = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
    expect(seasonWindow("1st Ashra Ramadan", now)).toEqual([d("2027-02-08"), d("2027-02-17")]);
    expect(seasonWindow("Shawwal", now)).toEqual([d("2027-03-10"), d("2027-04-08")]);
    expect(seasonWindow("Before Ramadan", now)).toEqual([d("2026-11-04"), d("2027-02-07")]);
    expect(periodWindow("Before Ramadan — 10 DEC TILL 31 JAN", now)).toEqual([d("2026-12-10"), d("2027-01-31")]);
    expect(periodWindow("Before Ramadan — CHECKOUT TILL 10 DEC", now)).toEqual([d("2026-11-04"), d("2026-12-09")]);
  });
});

describe("Free Ziyarat Included", () => {
  const data: RatesData = {
    hotels: {
      makkah: { m: { name: "M", location: "-", rates: { "Before Ramadan": { sharing: 100 } } } },
      madina: { d: { name: "D", location: "-", rates: { "Before Ramadan": { sharing: 50 } } } },
    },
    visa: { bus: { 10: 500 }, private: {} },
    dynamicProfit: 1000,
    periods: [],
    ziyarat: { makkah: 13, madina: 13 },
    sarToPkr: 10,
  };
  const pkg = (madina: boolean): PackageInput => ({
    id: "p",
    ticketPrice: 0,
    airline: "-",
    ticketType1: "Direct",
    ticketType2: "Group Ticket",
    adults: 2,
    infants: 1,
    transportType: "bus",
    makkahList: [{ hotelId: "m", room: "sharing", nights: 2, season: "Before Ramadan" }],
    madinaList: madina ? [{ hotelId: "d", room: "sharing", nights: 2, season: "Before Ramadan" }] : [],
    childDetails: [
      { count: 1, price: 0, bedType: "With Bed" },
      { count: 1, price: 0, bedType: "Without Bed" },
    ],
    ziyarat: { makkah: true, madina: true, adults: 0, children: 0, included: true },
  });

  it("is inside every adult's and child's price, never an infant's, and not a separate line", () => {
    const r = computeMultiPackage([pkg(true)], data).packages[0];
    const land = (200 + 100 + 500) * 10 + 1000; // hotels + visa, per person
    expect(r.ziyaratIncluded).toBe(true);
    expect(r.ziyaratSeparate).toBe(false);
    expect(r.perAdultPrice).toBe(land + 260);
    expect(r.totalChildrenCost).toBe(land + 260 + (500 * 10 + 1000 + 260));
    expect(r.finalPackageTotal).toBe(2 * (land + 260) + r.totalChildrenCost + r.totalInfantsCost);
  });

  it("charges only the cities the package stays in", () => {
    const r = computeMultiPackage([pkg(false)], data).packages[0];
    expect(r.perAdultPrice).toBe((200 + 500) * 10 + 1000 + 130);
  });
});

describe("one batch with sheets of different seasons and cities", () => {
  it("sorts every file into its own season and city, and Replace keeps the seasons not in the batch", () => {
    const makkahFirst = normalizeScan({ hotels: [{ name: "A", city: "Makkah", rates: [{ period: "1ST ASHRA RAMADAN", sharing: 60 }] }] }, "auto");
    const makkahMid = normalizeScan({ hotels: [{ name: "A", city: "Makkah", rates: [{ period: "MID ASHRA RAMADAN", sharing: 80 }] }] }, "makkah");
    const madinaLast = normalizeScan({ hotels: [{ name: "Z", city: "Madina", rates: [{ period: "LAST ASHRA RAMADAN", sharing: 90 }] }] }, "auto");
    const visa = normalizeScan({ visaBus: [{ pax: 1, rate: 550 }] }, "transport");
    const batch = combineScans([makkahFirst, makkahMid, madinaLast, visa]);
    expect(batch.periods).toEqual(["1st Ashra Ramadan", "Mid Ashra Ramadan", "Last Ashra Ramadan"]);
    expect(batch.visaBus).toHaveLength(1);

    const stored = normalizeScan({ hotels: [{ name: "A", city: "Makkah", rates: [{ period: "10 DEC TILL 31 JAN", sharing: 19 }] }] }, "makkah").makkah;
    const out = replaceSeasons(stored, mergeHotels([], batch.makkah));
    expect(out.replaced).toEqual(["1st Ashra Ramadan", "Mid Ashra Ramadan"]);
    expect(out.hotels).toHaveLength(1);
    expect(out.hotels[0].rates.map((r) => [seasonOf(r.period), r.sharing])).toEqual([
      ["Before Ramadan", 19],
      ["1st Ashra Ramadan", 60],
      ["Mid Ashra Ramadan", 80],
    ]);
    expect(batch.madina[0].rates[0].period).toBe("Last Ashra Ramadan");
  });
});

describe("Urdu Ashra headings (Meezab 1448H Ramadan sheets)", () => {
  const now = Date.parse("2026-11-04T00:00:00Z");
  it("reads the Urdu words, several Ashras in one heading", () => {
    expect(seasonsForPeriod("پہلا اور دوسرا عشرہ 06 FEB TILL 27 FEB", undefined, now)).toEqual(["1st Ashra Ramadan", "Mid Ashra Ramadan"]);
    expect(seasonsForPeriod("آخری عشرہ 27 FEB TILL 11 MAR", undefined, now)).toEqual(["Last Ashra Ramadan"]);
    expect(seasonsForPeriod("پہلا دوسرا اور آخری عشرہ 06 FEB TILL 11 MAR", undefined, now)).toEqual(["1st Ashra Ramadan", "Mid Ashra Ramadan", "Last Ashra Ramadan"]);
    expect(seasonsForPeriod("پہلا اور دوسرا عشرہ (1st & 2nd Ashra Ramadan) 06 FEB TILL 27 FEB", ["1st Ashra Ramadan", "Mid Ashra Ramadan"], now)).toEqual(["1st Ashra Ramadan", "Mid Ashra Ramadan"]);
    expect(seasonsForPeriod("شوال", undefined, now)).toEqual(["Shawwal"]);
    expect(seasonsForPeriod("1st & 2nd Ashra", undefined, now)).toEqual(["1st Ashra Ramadan", "Mid Ashra Ramadan"]);
  });

  it("dates alone: an edge day or two is not another season", () => {
    expect(seasonsForPeriod("27 FEB TILL 11 MAR", undefined, now)).toEqual(["Last Ashra Ramadan"]);
    expect(seasonsForPeriod("06 FEB TILL 27 FEB", undefined, now)).toEqual(["1st Ashra Ramadan", "Mid Ashra Ramadan"]);
    expect(seasonsForPeriod("10 DEC TILL 31 JAN", undefined, now)).toEqual(["Before Ramadan"]);
  });

  it("the Makkah sheet lands in the right bars with the Urdu dropped from the bar text", () => {
    const scan = normalizeScan(
      {
        hotels: [
          {
            name: "ARAFAT ZAHBI",
            city: "Makkah",
            rates: [
              { period: "پہلا اور دوسرا عشرہ 06 FEB TILL 27 FEB", sharing: 29, roomRate: 160 },
              { period: "آخری عشرہ 27 FEB TILL 11 MAR", sharing: 49, roomRate: 290 },
            ],
          },
        ],
      },
      "makkah",
    );
    const rates = Object.fromEntries(scan.makkah[0].rates.map((r) => [r.period, r.sharing]));
    expect(rates).toEqual({
      "1st Ashra Ramadan — 06 FEB TILL 27 FEB": 29,
      "Mid Ashra Ramadan — 06 FEB TILL 27 FEB": 29,
      "Last Ashra Ramadan — 27 FEB TILL 11 MAR": 49,
    });
  });
});

describe("hotel names from different suppliers' sheets", () => {
  const stored = {
    makkah: ["ARAFAT ZAHBI", "SNOOD MOWWTAN", "MELLA 1/MELLA 2", "THAT HOTEL/ TAJ FIDDI", "NAWARAT SHAMAS 3", "AREEJ AL ZAHBI", "AL KISWA TOWERS"],
    madina: ["HALA TAIBA", "DIYAR SAFA", "TAIF NIBRAS", "MANAZIL MARJAN"],
  };
  const h = (name: string) => ({ name, rates: [] as number[] });

  it("same hotel, other spelling: stored name used by itself", () => {
    expect(hotelKey("SNOOD MOWWTAN")).toBe(hotelKey("SNOOD MOWTAN"));
    expect(hotelKey("HALA TAIBA")).toBe(hotelKey("HALA TAIBAH"));
    expect(hotelKey("TAIF NIBRAS")).toBe(hotelKey("TAIF NEBRAS"));
    expect(hotelKey("DIYAR SAFA")).toBe(hotelKey("DIYAR AL SAFA (old Safa Center)"));
    expect(hotelKey("NAWARAT SHAMAS 3")).toBe(hotelKey("NAWARA SHAMS 3"));
    expect(hotelKey("ARAFAT ZAHBI")).toBe(hotelKey("ARAFAT ZAHBI (Shuttle)"));
    expect(hotelKey("TAJ FIDDI")).toBe(hotelKey("TAJ FIDDI HOTEL"));
    // different hotels stay different
    expect(hotelKey("MELLA 1")).not.toBe(hotelKey("MELLA 2"));
    expect(hotelKey("MASA AL TAIBA (NEW ADDITION)")).not.toBe(hotelKey("HALA TAIBA"));
    expect(hotelKey("SHAMS AL ZAHBI")).not.toBe(hotelKey("AREEJ AL ZAHBI"));
  });

  it("splits a two-hotel row, never a single name", () => {
    expect(splitCombined("MELLA 1/MELLA 2")).toEqual(["MELLA 1", "MELLA 2"]);
    expect(splitCombined("THAT HOTEL/ TAJ FIDDI")).toEqual(["THAT HOTEL", "TAJ FIDDI"]);
    expect(splitCombined("ARFAT GOLDEN RUSHD (OLD DAR AL KHALIL/RUSHD)")).toEqual(["ARFAT GOLDEN RUSHD (OLD DAR AL KHALIL/RUSHD)"]);
  });

  it("a Meezab batch lands on the stored Bin Aziz hotels; unsure names are asked once and remembered", () => {
    const incoming = {
      makkah: ["ARAFAT ZAHBI (Shuttle)", "SNOOD MOWTAN", "MELLA 1", "MELLA 2", "TAJ FIDDI HOTEL", "THAT HOTEL", "NAWARA SHAMS 3", "AREEJ AL ZAHRI"].map(h),
      madina: ["HALA TAIBAH", "DIYAR AL SAFA (old Safa Center)", "TAIF NEBRAS", "MASA AL TAIBA (NEW ADDITION)"].map(h),
    };
    // the stored "A/B" rows are split already (Merge), so the single hotels are what is stored
    const split = { ...stored, makkah: stored.makkah.flatMap(splitCombined) };
    const first = canonicalize(incoming, split, []);
    expect(first.hotels.makkah.map((x) => x.name)).toEqual(["ARAFAT ZAHBI", "SNOOD MOWWTAN", "MELLA 1", "MELLA 2", "TAJ FIDDI", "THAT HOTEL", "NAWARAT SHAMAS 3", "AREEJ AL ZAHRI"]);
    expect(first.hotels.madina.map((x) => x.name)).toEqual(["HALA TAIBA", "DIYAR SAFA", "TAIF NIBRAS", "MASA AL TAIBA (NEW ADDITION)"]);
    // one letter from AREEJ AL ZAHBI and not a known spelling: asked
    expect(first.questions.map((q) => q.name)).toEqual(["AREEJ AL ZAHRI"]);

    const answered = canonicalize(incoming, split, [], [{ city: "makkah", name: "AREEJ AL ZAHRI", target: "AREEJ AL ZAHBI" }]);
    expect(answered.questions).toEqual([]);
    expect(answered.hotels.makkah.at(-1)!.name).toBe("AREEJ AL ZAHBI");
    // next scan: the answer comes from memory, nothing is asked
    const next = canonicalize(incoming, split, [{ city: "makkah", alias: "AREEJ AL ZAHRI", target: "AREEJ AL ZAHBI" }]);
    expect(next.questions).toEqual([]);
    expect(next.renames.find((r) => r.from === "AREEJ AL ZAHRI")?.why).toBe("remembered");
  });

  it("an old Bin Aziz sheet with 'MELLA 1/MELLA 2' puts the same rate on both hotels", () => {
    const out = canonicalize({ makkah: [h("MELLA 1/MELLA 2")], madina: [] }, { makkah: ["MELLA 1", "MELLA 2"], madina: [] }, []);
    expect(out.hotels.makkah.map((x) => x.name)).toEqual(["MELLA 1", "MELLA 2"]);
  });

  it("'a different hotel' is remembered too", () => {
    const out = canonicalize({ makkah: [h("AREEJ AL ZAHRI")], madina: [] }, stored, [{ city: "makkah", alias: "AREEJ AL ZAHRI", target: null }]);
    expect(out.questions).toEqual([]);
    expect(out.hotels.makkah[0].name).toBe("AREEJ AL ZAHRI");
  });
});

describe("WhatsApp quotation layout", () => {
  const stay = (name: string, from: string, nights: number, location = "IBRAHIM KHALIL ROAD, 650-700 MTR") => ({ name, room: "QUAD", nights, location, season: "x", from });
  it("lists stays in trip order and joins one hotel split over two seasons", () => {
    const out = tripStays({
      makkahDetails: [stay("AL KISWA TOWERS", "2027-01-22", 5), stay("MELLA 1", "2027-02-08", 5), stay("MELLA 1", "2027-02-13", 5)],
      madinaDetails: [stay("ANWAR AL AWALI", "2027-01-27", 4)],
    });
    expect(out.map((h) => `${h.city} ${h.name} ${h.nights}`)).toEqual(["Makkah AL KISWA TOWERS 5", "Madinah ANWAR AL AWALI 4", "Makkah MELLA 1 10"]);
  });
  it("splits the stored location into street and distance", () => {
    expect(splitLocation("AL TAYSIR STREET, SHUTTLE SERVICE")).toEqual({ street: "AL TAYSIR STREET", distance: "SHUTTLE SERVICE" });
    expect(splitLocation("IBRAHIM KHALIL ROAD, 650-700 MTR")).toEqual({ street: "IBRAHIM KHALIL ROAD", distance: "650-700 MTR" });
    expect(splitLocation("SHUTTLE SERVICE")).toEqual({ street: "", distance: "SHUTTLE SERVICE" });
    expect(splitLocation("AJYAD STREET")).toEqual({ street: "AJYAD STREET", distance: "" });
    expect(splitLocation("-")).toEqual({ street: "", distance: "" });
  });
});

describe("extra Profit typed on the calculator", () => {
  const data: RatesData = {
    hotels: { makkah: { m: { name: "M", location: "-", rates: { "Before Ramadan": { quad: 50 } } } }, madina: {} },
    visa: { bus: { 47: 550 }, private: {} },
    dynamicProfit: 20000,
    periods: [],
    ziyarat: { makkah: 10, madina: 10 },
    sarToPkr: 76,
  };
  const pkg = (extraProfit?: number): PackageInput => ({
    id: "p",
    ticketPrice: 0,
    airline: "-",
    ticketType1: "Direct",
    ticketType2: "Group Ticket",
    adults: 4,
    infants: 1,
    transportType: "bus",
    makkahList: [{ hotelId: "m", room: "quad", nights: 5, season: "Before Ramadan" }],
    madinaList: [],
    childDetails: [{ count: 1, price: 100000, bedType: "With Bed" }],
    ziyarat: { makkah: true, madina: true, adults: 0, children: 0, included: true },
    extraProfit,
  });

  it("is shared by every traveller and folded into each per-person price; the lines still add up", () => {
    const plain = computeMultiPackage([pkg()], data);
    const marked = computeMultiPackage([pkg(12000)], data);
    const [a, b] = [plain.packages[0], marked.packages[0]];
    // 4 adults + 1 child + 1 infant = 6 travellers → 2,000 each
    expect(b.perAdultPrice).toBe(a.perAdultPrice + 2000);
    expect(b.childPrices[0].each).toBe(a.childPrices[0].each + 2000);
    expect(b.infantPrice).toBe(a.infantPrice + 2000);
    expect(b.dynamicProfitPKR).toBe(20000);
    expect(b.finalPackageTotal).toBe(a.finalPackageTotal + 12000);
    expect(b.finalPackageTotal).toBe(b.perAdultPrice * 4 + b.childPrices[0].each * 1 + b.infantPrice * 1);
    expect(marked.grandTotal).toBe(plain.grandTotal + 12000);
  });

  it("an amount that doesn't divide evenly is rounded per person, and the total is still per person × people", () => {
    const b = computeMultiPackage([pkg(10000)], data).packages[0];
    expect(b.finalPackageTotal).toBe(b.perAdultPrice * 4 + b.childPrices[0].each + b.infantPrice);
  });

  it("is never in the result the page, PDF or WhatsApp text are built from", () => {
    const r = publicResult(computeMultiPackage([pkg(10000)], data));
    expect(JSON.stringify(r)).not.toMatch(/extraProfit|10000(?!\d)/);
  });

  it("ignores a negative or empty value", () => {
    const plain = computeMultiPackage([pkg()], data).grandTotal;
    expect(computeMultiPackage([pkg(-500)], data).grandTotal).toBe(plain);
    expect(computeMultiPackage([pkg(undefined)], data).grandTotal).toBe(plain);
  });
});
