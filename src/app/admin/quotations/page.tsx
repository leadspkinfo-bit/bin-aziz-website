import { AdminPage, MISSING_SQL } from "../rates/AdminPage";

export default function Page() {
  return (
    <AdminPage
      title="Quotations"
      render={async (supabase) => {
        const [list, total, hotels, seasons] = await Promise.all([
          supabase.from("quotations").select("id, family_head, contact_no, branch, prepared_by, season, grand_total, created_at").order("created_at", { ascending: false }).limit(200),
          supabase.from("quotations").select("id", { count: "exact", head: true }),
          supabase.from("hotels").select("id", { count: "exact", head: true }),
          supabase.from("seasons").select("id", { count: "exact", head: true }),
        ]);
        if (list.error) return MISSING_SQL;
        const stats = [
          ["Saved quotations", total.count ?? 0],
          ["Hotels", hotels.count ?? 0],
          ["Seasons", seasons.count ?? 0],
        ];
        return (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {stats.map(([label, n]) => (
                <div key={label} className="rounded-2xl border border-ivory-100/10 p-4">
                  <p className="text-2xl font-semibold">{n}</p>
                  <p className="text-xs text-ivory-100/55">{label}</p>
                </div>
              ))}
            </div>
            <ul className="mt-6 space-y-2">
              {list.data.length === 0 && <li className="text-sm text-ivory-100/55">No quotations saved yet.</li>}
              {list.data.map((q) => (
                <li key={q.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ivory-100/10 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-semibold">{q.family_head || "Client"}</p>
                    <p className="text-xs text-ivory-100/55">
                      {new Date(q.created_at).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi" })} · {q.branch} · {q.prepared_by} · PKR {Number(q.grand_total).toLocaleString("en-US")}
                    </p>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <a href={`/api/quotations/${q.id}/pdf`} className="underline">
                      PDF
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </>
        );
      }}
    />
  );
}
