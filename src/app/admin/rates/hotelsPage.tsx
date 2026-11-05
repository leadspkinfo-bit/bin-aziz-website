import { ROOM_TYPES, type RoomType } from "@/lib/calc/constants";
import { AdminPage, MISSING_SQL } from "./AdminPage";
import { RateTable, type Hotel } from "./RateTable";

type Row = { id: string; name: string; location: string; hotel_rates: { season_id: string; room_type: RoomType; rate_sar: number }[] };

/** The Makkah and Madina pages are the same screen for a different city. */
export function HotelsPage({ city }: { city: "makkah" | "madina" }) {
  return (
    <AdminPage
      title={city === "makkah" ? "Makkah hotels" : "Madina hotels"}
      render={async (supabase) => {
        const [hotels, seasons] = await Promise.all([
          supabase.from("hotels").select("id, name, location, hotel_rates(season_id, room_type, rate_sar)").eq("city", city).order("name").limit(2000),
          supabase.from("seasons").select("id, name").order("sort_order"),
        ]);
        if (hotels.error || seasons.error) return MISSING_SQL;
        const list: Hotel[] = (hotels.data as Row[]).map((h) => {
          const rates: Hotel["rates"] = {};
          for (const r of h.hotel_rates) (rates[r.season_id] ??= Object.fromEntries(ROOM_TYPES.map((t) => [t, 0])) as Hotel["rates"][string])[r.room_type] = Number(r.rate_sar);
          return { id: h.id, name: h.name, location: h.location, rates };
        });
        return <RateTable city={city} hotels={list} seasons={seasons.data} />;
      }}
    />
  );
}
