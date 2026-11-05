import type { MultiPackageResult } from "./engine";
import type { QuotationBody } from "./schema";
import { tripStays } from "./trip";

/** One package as the SPO sent it, kept in the activity log for the admin's check and balance. */
export type LoggedPackage = {
  number: number;
  adults: number;
  children: number;
  infants: number;
  airline: string;
  ticketType: string;
  ticketPrice: number;
  transport: "bus" | "private";
  stays: { city: "Makkah" | "Madinah"; hotel: string; room: string; nights: number; dates: string; rate: string }[];
  nights: number;
  perAdult: number;
  children_: { count: number; bed: string; each: number }[];
  infantEach: number;
  /** the hidden markup the SPO typed (admin eyes only) */
  extraProfit: number;
  total: number;
  notes: string;
};
export type LoggedQuotation = { v: 2; packages: LoggedPackage[]; input: QuotationBody["packages"] };

/** What the log keeps of a sent quotation: every package priced, in trip order, plus the raw input. */
export function logDetails(result: MultiPackageResult, input: QuotationBody["packages"]): LoggedQuotation {
  return {
    v: 2,
    input,
    packages: result.packages.map((p, i) => ({
      number: p.packageNumber,
      adults: p.adults,
      children: p.children,
      infants: p.infants,
      airline: p.airline,
      ticketType: `${p.ticketType1} · ${p.ticketType2}`,
      ticketPrice: p.ticketPrice,
      transport: p.transportType,
      stays: tripStays(p).map((h) => ({ city: h.city, hotel: h.name, room: h.room, nights: h.nights, dates: h.dates ?? "", rate: h.season })),
      nights: p.totalMakkahNights + p.totalMadinaNights,
      perAdult: p.perAdultPrice,
      children_: p.childPrices.map((c) => ({ count: c.count, bed: c.bedType, each: c.each })),
      infantEach: p.infantPrice,
      extraProfit: Math.max(0, Number(input[i]?.extraProfit) || 0),
      total: p.finalPackageTotal,
      notes: p.notes,
    })),
  };
}
