import { z } from "zod";
import { ROOM_TYPES } from "./constants";

const count = z.coerce.number().int().min(0).max(10000);
const money = z.coerce.number().min(0).max(100_000_000);

const hotelEntry = z.object({ hotelId: z.string(), room: z.enum(ROOM_TYPES), nights: count, season: z.string().max(200).optional(), dates: z.string().max(80).optional(), from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() });

export const packageSchema = z.object({
  id: z.string(),
  ticketPrice: money,
  airline: z.string().max(80),
  ticketType1: z.enum(["Direct", "Indirect"]),
  ticketType2: z.enum(["Group Ticket", "System Ticket"]),
  adults: count,
  infants: count,
  transportType: z.enum(["bus", "private"]),
  makkahList: z.array(hotelEntry).max(20),
  madinaList: z.array(hotelEntry).max(20),
  childDetails: z.array(z.object({ count, price: money, bedType: z.enum(["With Bed", "Without Bed"]) })).max(20),
  ziyarat: z.object({ makkah: z.boolean(), madina: z.boolean(), adults: count, children: count, included: z.boolean().optional() }).optional(),
  notes: z.string().max(2000).default(""),
  extraProfit: money.optional(),
});

export const calculateSchema = z.object({
  packages: z.array(packageSchema).min(1).max(20),
  season: z.string().max(200),
});

const text = z.string().max(500).default("");

export const quotationSchema = calculateSchema.extend({
  familyHead: text,
  contactNo: text,
  branch: text,
  preparedBy: text,
  notes: z.string().max(2000).default(""),
});

export type QuotationBody = z.infer<typeof quotationSchema>;

export function hasNoHotels(pkg: z.infer<typeof packageSchema>) {
  return !pkg.makkahList.some((h) => h.hotelId) && !pkg.madinaList.some((h) => h.hotelId);
}
