import { AdminPage, MISSING_SQL } from "../AdminPage";
import { RateSettingsForm } from "./RateSettingsForm";

export default function Page() {
  return (
    <AdminPage
      title="Rate settings"
      render={async (supabase) => {
        const { data, error } = await supabase.from("rate_settings").select("key, value");
        if (error) return MISSING_SQL;
        return <RateSettingsForm initial={Object.fromEntries(data.map((r) => [r.key, Number(r.value)]))} />;
      }}
    />
  );
}
