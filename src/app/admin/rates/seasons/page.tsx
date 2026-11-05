import { AdminPage, MISSING_SQL } from "../AdminPage";
import { SeasonsEditor } from "./SeasonsEditor";

export default function Page() {
  return (
    <AdminPage
      title="Seasons"
      render={async (supabase) => {
        const [seasons, used] = await Promise.all([
          supabase.from("seasons").select("id, name").order("sort_order"),
          supabase.from("hotel_rates").select("season_id").gt("rate_sar", 0).limit(1000),
        ]);
        if (seasons.error || used.error) return MISSING_SQL;
        const usedIds = [...new Set(used.data.map((r) => r.season_id as string))];
        return <SeasonsEditor key={seasons.data.map((s) => s.id).join()} seasons={seasons.data} usedIds={usedIds} />;
      }}
    />
  );
}
