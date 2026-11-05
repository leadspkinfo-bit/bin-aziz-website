import { AdminPage } from "../rates/AdminPage";
import { adminButton, adminInput } from "../rates/styles";
import { SpoManager } from "./SpoManager";
import { PERIODS, periodMarks, periodRange, pkr, spoKey, when } from "./time";

type Search = { spo?: string; period?: string; from?: string; to?: string };
type LogRow = {
  id: string;
  spo_id: string | null;
  spo_name: string;
  action: "whatsapp" | "pdf";
  client_name: string | null;
  client_phone: string | null;
  branch: string | null;
  package_count: number;
  summary: string;
  grand_total: number;
  created_at: string;
};

/** Every row of the log, newest first (paged past Supabase's 1000-row limit). */
async function allRows(supabase: Parameters<Parameters<typeof AdminPage>[0]["render"]>[0]) {
  const rows: LogRow[] = [];
  for (let from = 0; from < 50_000; from += 1000) {
    const { data, error } = await supabase
      .from("quotation_log")
      .select("id, spo_id, spo_name, action, client_name, client_phone, branch, package_count, summary, grand_total, created_at")
      .order("created_at", { ascending: false })
      .range(from, from + 999);
    if (error) return null;
    rows.push(...(data as LogRow[]));
    if (data.length < 1000) break;
  }
  return rows;
}

export default function Page({ searchParams }: { searchParams: Promise<Search> }) {
  return (
    <AdminPage
      title="SPO activity"
      render={async (supabase) => {
        const sp = await searchParams;
        const [spoRes, rows] = await Promise.all([supabase.from("spos").select("id, name, active").order("name"), allRows(supabase)]);
        if (spoRes.error || rows === null) {
          return (
            <p className="mt-8 rounded-2xl bg-red-500/10 p-6 text-red-200">
              Tables not found. Run <code>supabase/migrations/016_spo_activity.sql</code> in the Supabase SQL Editor.
            </p>
          );
        }
        const spos = spoRes.data as { id: string; name: string; active: boolean }[];
        const marks = periodMarks();

        // leaderboard: every SPO on the list, plus removed ones that still have entries
        const board = new Map<string, { name: string; active: boolean; today: number; week: number; month: number; all: number; monthTotal: number }>();
        for (const s of spos) board.set(s.id, { name: s.name, active: s.active, today: 0, week: 0, month: 0, all: 0, monthTotal: 0 });
        for (const r of rows) {
          const key = spoKey(r.spo_id, r.spo_name);
          if (!board.has(key)) board.set(key, { name: r.spo_name, active: false, today: 0, week: 0, month: 0, all: 0, monthTotal: 0 });
          const b = board.get(key)!;
          const t = Date.parse(r.created_at);
          b.all++;
          if (t >= marks.month) {
            b.month++;
            b.monthTotal += Number(r.grand_total);
          }
          if (t >= marks.week) b.week++;
          if (t >= marks.today) b.today++;
        }
        const leaders = [...board.entries()].filter(([, b]) => b.active || b.all > 0).sort(([, a], [, b]) => b.month - a.month || b.all - a.all || a.name.localeCompare(b.name));

        // the filtered list
        const period = PERIODS.some(([k]) => k === sp.period) ? sp.period! : "month";
        const [from, to] = periodRange(period, marks, sp.from, sp.to);
        const list = rows.filter((r) => {
          const t = Date.parse(r.created_at);
          return t >= from && t < to && (!sp.spo || r.spo_id === sp.spo || `name:${r.spo_name}` === sp.spo);
        });
        const sum = list.reduce((n, r) => n + Number(r.grand_total), 0);
        const chosen = sp.spo ? board.get(sp.spo)?.name : null;

        return (
          <>
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-gold-300">Who is working the most</h2>
              <p className="mt-1 text-xs text-ivory-100/55">Quotations sent (WhatsApp or PDF download) per SPO, Pakistan time. Week starts Monday.</p>
              <div className="mt-3 overflow-x-auto rounded-2xl border border-ivory-100/10">
                <table className="w-full min-w-[620px] text-sm">
                  <thead className="bg-ivory-100/5 text-left text-xs text-ivory-100/60">
                    <tr>
                      <th className="px-3 py-2 font-medium">SPO</th>
                      <th className="px-3 py-2 text-right font-medium">Today</th>
                      <th className="px-3 py-2 text-right font-medium">This week</th>
                      <th className="px-3 py-2 text-right font-medium">This month</th>
                      <th className="px-3 py-2 text-right font-medium">All time</th>
                      <th className="px-3 py-2 text-right font-medium">Month grand totals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaders.map(([key, b], i) => (
                      <tr key={key} className="border-t border-ivory-100/10">
                        <td className="px-3 py-2">
                          <a href={`/admin/spos/${encodeURIComponent(key)}`} className="underline-offset-2 hover:text-gold-300 hover:underline">
                            {i === 0 && b.month > 0 ? "★ " : ""}
                            {b.name}
                          </a>
                          {!b.active && <span className="ml-2 text-[10px] text-ivory-100/40">removed</span>}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{b.today}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{b.week}</td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums">{b.month}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{b.all}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{pkr(b.monthTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-10">
              <h2 className="text-lg font-semibold text-gold-300">Activity log</h2>
              <form method="get" className="mt-3 flex flex-wrap items-end gap-2 text-sm">
                <label className="min-w-44 flex-1">
                  <span className="mb-1 block text-xs text-ivory-100/60">SPO</span>
                  <select name="spo" defaultValue={sp.spo ?? ""} className={adminInput}>
                    <option value="">All SPOs</option>
                    {leaders.map(([key, b]) => (
                      <option key={key} value={key}>
                        {b.name}
                        {b.active ? "" : " (removed)"}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="min-w-36">
                  <span className="mb-1 block text-xs text-ivory-100/60">Period</span>
                  <select name="period" defaultValue={period} className={adminInput}>
                    {PERIODS.map(([k, l]) => (
                      <option key={k} value={k}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-xs text-ivory-100/60">From (for Dates…)</span>
                  <input type="date" name="from" defaultValue={sp.from ?? ""} className={adminInput} />
                </label>
                <label>
                  <span className="mb-1 block text-xs text-ivory-100/60">To</span>
                  <input type="date" name="to" defaultValue={sp.to ?? ""} className={adminInput} />
                </label>
                <button type="submit" className={adminButton}>
                  SHOW
                </button>
              </form>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-ivory-100/10 p-4">
                  <p className="text-2xl font-semibold">{list.length}</p>
                  <p className="text-xs text-ivory-100/55">
                    Quotations sent{chosen ? ` by ${chosen}` : ""} · {PERIODS.find(([k]) => k === period)![1]}
                  </p>
                </div>
                <div className="rounded-2xl border border-ivory-100/10 p-4">
                  <p className="text-2xl font-semibold">{pkr(sum)}</p>
                  <p className="text-xs text-ivory-100/55">Sum of their grand totals</p>
                </div>
              </div>

              <ul className="mt-4 space-y-2">
                {list.length === 0 && <li className="text-sm text-ivory-100/55">Nothing sent in this period.</li>}
                {list.slice(0, 300).map((r) => (
                  <li key={r.id} className="rounded-2xl border border-ivory-100/10 px-4 py-3 text-sm">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <p className="font-semibold">
                        <a href={`/admin/spos/${encodeURIComponent(spoKey(r.spo_id, r.spo_name))}`} className="hover:text-gold-300 hover:underline">
                          {r.spo_name}
                        </a>{" "}
                        <span className="font-normal text-ivory-100/50">· {when(r.created_at)}</span>
                      </p>
                      <p className="font-semibold text-gold-300 tabular-nums">{pkr(Number(r.grand_total))}</p>
                    </div>
                    <p className="mt-1 text-ivory-100/80">
                      {r.client_name || "Client"}
                      {r.client_phone ? ` · ${r.client_phone}` : ""}
                      {r.branch ? <span className="text-ivory-100/50"> · {r.branch}</span> : null}
                      <span className="ml-2 rounded-full bg-ivory-100/10 px-2 py-0.5 text-[10px] uppercase">{r.action === "pdf" ? "PDF" : "WhatsApp"}</span>
                    </p>
                    <p className="mt-1 text-xs whitespace-pre-line text-ivory-100/55">{r.summary}</p>
                  </li>
                ))}
                {list.length > 300 && <li className="text-xs text-ivory-100/50">Showing the newest 300 of {list.length}. Narrow the dates to see older ones.</li>}
              </ul>
            </section>

            <section className="mt-12">
              <h2 className="text-lg font-semibold text-gold-300">SPO list</h2>
              <p className="mt-1 mb-3 text-xs text-ivory-100/55">These names appear in the calculator&apos;s “Prepared By”. Removing a name keeps their history.</p>
              <SpoManager spos={spos} />
            </section>
          </>
        );
      }}
    />
  );
}
