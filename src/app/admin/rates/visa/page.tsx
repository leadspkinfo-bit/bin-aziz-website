import { AdminPage, MISSING_SQL } from "../AdminPage";
import { VisaEditor } from "./VisaEditor";

export default function Page() {
  return (
    <AdminPage
      title="Visa & transport rates"
      render={async (supabase) => {
        const { data, error } = await supabase.from("visa_rates").select("transport_type, pax, rate_sar").order("pax");
        if (error) return MISSING_SQL;
        const rows = (type: string) => data.filter((r) => r.transport_type === type).map((r) => ({ pax: r.pax, rate: Number(r.rate_sar) }));
        return <VisaEditor bus={rows("bus")} privateRows={rows("private")} />;
      }}
    />
  );
}
