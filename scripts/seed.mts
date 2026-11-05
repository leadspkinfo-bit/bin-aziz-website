// Loads a JSON export of the Google Sheet into Supabase: npm run seed -- path/to/export.json
// {
//   "hotels": [{ "Hotel Name": "...", "City": "Makkah", "Location": "...", "Peak|Sharing": 100, "Peak|Quint": 120, ... }],
//   "visaBus": [{ "pax": 5, "rate": 615 }], "visaPrivate": [{ "pax": 5, "rate": 900 }],
//   "settings": { "profit_pkr": 20000, "ziyarat_makkah_sar": 10, "ziyarat_madina_sar": 10, "sar_to_pkr": 78, "infant_price_pkr": 95000 }
// }
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { ROOM_TYPES, type RoomType } from "../src/lib/calc/constants";
import type { ScanHotel, ScanRate, VisaSlab } from "../src/lib/gemini/normalize";

type Sheet = { hotels?: Record<string, string | number>[]; visaBus?: VisaSlab[]; visaPrivate?: VisaSlab[]; settings?: Record<string, number> };

const file = process.argv[2];
if (!file) throw new Error("Usage: npm run seed -- path/to/export.json");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");

const sheet = JSON.parse(readFileSync(file, "utf8")) as Sheet;
const payload = { periods: [] as string[], makkah: [] as ScanHotel[], madina: [] as ScanHotel[], visaBus: sheet.visaBus ?? [], visaPrivate: sheet.visaPrivate ?? [] };

for (const row of sheet.hotels ?? []) {
  const name = String(row["Hotel Name"] ?? "").trim();
  if (!name) continue;
  const periods = new Map<string, ScanRate>();
  for (const [column, value] of Object.entries(row)) {
    const [period, room] = column.split("|").map((p) => p.trim());
    const roomKey = room?.toLowerCase() as RoomType;
    if (!ROOM_TYPES.includes(roomKey)) continue;
    if (!periods.has(period)) periods.set(period, { period, sharing: 0, quint: 0, quad: 0, triple: 0, double: 0 });
    periods.get(period)![roomKey] = Number(value) || 0;
    if (!payload.periods.includes(period)) payload.periods.push(period);
  }
  const city = /madin|medin/i.test(String(row.City ?? "")) ? "madina" : "makkah";
  payload[city].push({ name, location: String(row.Location ?? "-"), rates: [...periods.values()] });
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const { data, error } = await supabase.rpc("apply_scan", { payload, mode: "merge" });
if (error) throw error;
console.log(data);

const settings = Object.entries(sheet.settings ?? {}).map(([k, value]) => ({ key: k, value }));
if (settings.length) {
  const { error: settingsError } = await supabase.from("rate_settings").upsert(settings);
  if (settingsError) throw settingsError;
  console.log(`${settings.length} settings updated`);
}
