import Link from "next/link";
import type { LoggedPackage, LoggedQuotation } from "@/lib/calc/logDetails";
import { whatsappNumber } from "@/lib/phone";
import { AdminPage } from "../../rates/AdminPage";
import { adminButton, adminInput } from "../../rates/styles";
import { dayKey, dayTitle, PERIODS, periodMarks, periodRange, pkr, timeOnly } from "../time";

type Row = {
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
  packages_json: LoggedQuotation | unknown;
  created_at: string;
};
type Search = { period?: string; from?: string; to?: string; q?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const isDetailed = (v: unknown): v is LoggedQuotation => Boolean(v && typeof v === "object" && (v as LoggedQuotation).v === 2);

function Stat({ label, value, strong }: { label: string; value: string | number; strong?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${strong ? "border-gold-400/40 bg-gold-500/10" : "border-ivory-100/10"}`}>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-ivory-100/55">{label}</p>
    </div>
  );
}

/** One package of a sent quotation, written out the way the client got it, plus the hidden markup. */
function PackageView({ p }: { p: LoggedPackage }) {
  const people = [plural(p.adults, "Adult"), p.children ? plural(p.children, "Child", "Children") : "", p.infants ? plural(p.infants, "Infant") : ""].filter(Boolean).join(" · ");
  const chips = [
    p.transport === "private" ? "Private transport" : "Bus",
    p.airline && p.airline !== "NONE" && p.airline !== "-" ? `${p.airline} (${p.ticketType})` : "",
    p.ticketPrice ? `Ticket ${pkr(p.ticketPrice)}` : "",
    p.nights ? plural(p.nights, "night") : "",
  ].filter(Boolean);
  return (
    <div className="rounded-xl border border-ivory-100/10 bg-night-900/40 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold">
          Package {p.number} <span className="font-normal text-ivory-100/60">· {people}</span>
        </p>
        <p className="font-semibold text-gold-300 tabular-nums">{pkr(p.total)}</p>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <span key={c} className="rounded-full bg-ivory-100/10 px-2 py-0.5 text-[11px]">
            {c}
          </span>
        ))}
      </div>

      {p.stays.length > 0 && (
        <ol className="mt-3 space-y-1.5">
          {p.stays.map((h, i) => (
            <li key={i} className="grid grid-cols-[4.5rem_1fr] gap-x-3 text-sm sm:grid-cols-[4.5rem_1fr_auto]">
              <span className={`self-start rounded-md px-1.5 py-0.5 text-center text-[11px] font-semibold ${h.city === "Makkah" ? "bg-emerald-500/15 text-emerald-200" : "bg-sky-500/15 text-sky-200"}`}>{h.city}</span>
              <span>
                <span className="font-medium">{h.hotel}</span> <span className="text-ivory-100/60">· {h.room} · {plural(h.nights, "night")}</span>
                <span className="block text-xs text-ivory-100/45">{h.rate}</span>
              </span>
              <span className="col-start-2 text-xs text-ivory-100/70 sm:col-start-3 sm:text-right">{h.dates}</span>
            </li>
          ))}
        </ol>
      )}

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-ivory-100/10 pt-2 text-xs sm:grid-cols-4">
        <div>
          <dt className="text-ivory-100/50">Adult per person</dt>
          <dd className="tabular-nums">{pkr(p.perAdult)}</dd>
        </div>
        {p.children_.map((c) => (
          <div key={c.bed}>
            <dt className="text-ivory-100/50">
              Child ({c.bed.toLowerCase()}) × {c.count}
            </dt>
            <dd className="tabular-nums">{pkr(c.each)}</dd>
          </div>
        ))}
        {p.infants > 0 && (
          <div>
            <dt className="text-ivory-100/50">Infant × {p.infants}</dt>
            <dd className="tabular-nums">{pkr(p.infantEach)}</dd>
          </div>
        )}
        {p.extraProfit > 0 && (
          <div>
            <dt className="text-amber-200/80">Extra profit (hidden)</dt>
            <dd className="text-amber-200 tabular-nums">{pkr(p.extraProfit)}</dd>
          </div>
        )}
      </dl>
      {p.notes && <p className="mt-2 rounded-lg bg-ivory-100/5 px-2 py-1.5 text-xs text-ivory-100/70">Notes: {p.notes}</p>}
    </div>
  );
}

/**
 * One SPO's every sent quotation, day by day: when, to whom (name and number, with call / WhatsApp links),
 * which branch, and each package in full — for the admin's check and balance.
 */
export default function Page({ params, searchParams }: { params: Promise<{ key: string }>; searchParams: Promise<Search> }) {
  return (
    <AdminPage
      title="SPO activity"
      render={async (supabase) => {
        const [{ key: raw }, sp] = await Promise.all([params, searchParams]);
        const key = decodeURIComponent(raw);
        const byId = UUID.test(key);
        const nameOnly = key.startsWith("name:") ? key.slice(5) : null;
        if (!byId && !nameOnly) return <p className="mt-8 text-ivory-100/60">Unknown SPO.</p>;

        const { data: spo } = byId ? await supabase.from("spos").select("id, name, active").eq("id", key).maybeSingle() : { data: null };
        const rows: Row[] = [];
        for (let from = 0; from < 50_000; from += 1000) {
          let query = supabase.from("quotation_log").select("*").order("created_at", { ascending: false }).range(from, from + 999);
          query = byId ? query.eq("spo_id", key) : query.is("spo_id", null).eq("spo_name", nameOnly!);
          const { data, error } = await query;
          if (error) return <p className="mt-8 rounded-2xl bg-red-500/10 p-6 text-red-200">Run supabase/migrations/016_spo_activity.sql in Supabase first.</p>;
          rows.push(...(data as Row[]));
          if (data.length < 1000) break;
        }
        const name = spo?.name ?? rows[0]?.spo_name ?? nameOnly ?? "SPO";
        const removed = byId ? spo?.active === false : true;

        const marks = periodMarks();
        const count = (since: number) => rows.filter((r) => Date.parse(r.created_at) >= since).length;
        const monthTotal = rows.filter((r) => Date.parse(r.created_at) >= marks.month).reduce((n, r) => n + Number(r.grand_total), 0);

        const period = PERIODS.some(([k]) => k === sp.period) ? sp.period! : "all";
        const [from, to] = periodRange(period, marks, sp.from, sp.to);
        const q = (sp.q ?? "").trim().toLowerCase();
        const digits = q.replace(/\D/g, "");
        const list = rows.filter((r) => {
          const t = Date.parse(r.created_at);
          if (t < from || t >= to) return false;
          if (!q) return true;
          return (r.client_name ?? "").toLowerCase().includes(q) || (digits.length >= 3 && (r.client_phone ?? "").replace(/\D/g, "").includes(digits));
        });
        const days = new Map<string, Row[]>();
        for (const r of list) days.set(dayKey(r.created_at), [...(days.get(dayKey(r.created_at)) ?? []), r]);
        const self = `/admin/spos/${encodeURIComponent(key)}`;
        const link = (p: string) => `${self}?period=${p}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}`;

        return (
          <>
            <Link href="/admin/spos" className="mt-4 inline-block text-sm text-ivory-100/60 hover:text-gold-300">
              ← All SPOs
            </Link>
            <div className="mt-3 flex flex-wrap items-baseline gap-3">
              <h2 className="font-display text-3xl">{name}</h2>
              {removed && <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs text-red-200">removed from the list</span>}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
              <Stat label="Today" value={count(marks.today)} />
              <Stat label="This week" value={count(marks.week)} />
              <Stat label="This month" value={count(marks.month)} strong />
              <Stat label="All time" value={rows.length} />
              <Stat label="Grand totals this month" value={pkr(monthTotal)} />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-2">
              {PERIODS.filter(([k]) => k !== "custom").map(([k, l]) => (
                <Link key={k} href={link(k)} className={`rounded-full border px-3.5 py-1.5 text-xs transition ${period === k ? "border-gold-400 bg-gold-500 text-night-950" : "border-ivory-100/20 hover:border-gold-400"}`}>
                  {l}
                </Link>
              ))}
            </div>
            <form method="get" className="mt-3 flex flex-wrap items-end gap-2 text-sm">
              <input type="hidden" name="period" value={period === "custom" || sp.from || sp.to ? "custom" : period} />
              <label className="min-w-48 flex-1">
                <span className="mb-1 block text-xs text-ivory-100/60">Client name or number</span>
                <input name="q" defaultValue={sp.q ?? ""} placeholder="e.g. Bilal or 0300…" className={adminInput} />
              </label>
              <label>
                <span className="mb-1 block text-xs text-ivory-100/60">From</span>
                <input type="date" name="from" defaultValue={sp.from ?? ""} className={adminInput} />
              </label>
              <label>
                <span className="mb-1 block text-xs text-ivory-100/60">To</span>
                <input type="date" name="to" defaultValue={sp.to ?? ""} className={adminInput} />
              </label>
              <button type="submit" className={adminButton}>
                SEARCH
              </button>
            </form>

            <p className="mt-6 text-sm text-ivory-100/70">
              {plural(list.length, "quotation")} · {pkr(list.reduce((n, r) => n + Number(r.grand_total), 0))}
            </p>

            {list.length === 0 && <p className="mt-4 rounded-2xl border border-ivory-100/10 p-6 text-center text-sm text-ivory-100/55">Nothing sent in this period.</p>}

            <div className="mt-4 space-y-8">
              {[...days].map(([day, entries]) => (
                <section key={day}>
                  <div className="sticky top-0 z-10 -mx-2 flex flex-wrap items-baseline justify-between gap-2 bg-night-950/90 px-2 py-2 backdrop-blur">
                    <h3 className="font-semibold text-gold-300">{dayTitle(entries[0].created_at)}</h3>
                    <p className="text-xs text-ivory-100/60">
                      {plural(entries.length, "quotation")} · {pkr(entries.reduce((n, r) => n + Number(r.grand_total), 0))}
                    </p>
                  </div>
                  <ul className="mt-2 space-y-3">
                    {entries.map((r) => {
                      const wa = r.client_phone ? whatsappNumber(r.client_phone) : null;
                      return (
                        <li key={r.id} className="rounded-2xl border border-ivory-100/10 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs text-ivory-100/55">
                                {timeOnly(r.created_at)}
                                <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${r.action === "pdf" ? "bg-sky-500/15 text-sky-200" : "bg-emerald-500/15 text-emerald-200"}`}>
                                  {r.action === "pdf" ? "PDF downloaded" : "Sent on WhatsApp"}
                                </span>
                              </p>
                              <p className="mt-1 text-base font-semibold">{r.client_name || "Client (no name)"}</p>
                              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ivory-100/75">
                                {r.client_phone ? (
                                  <>
                                    <a href={`tel:${r.client_phone.replace(/[^\d+]/g, "")}`} className="tabular-nums hover:text-gold-300">
                                      {r.client_phone}
                                    </a>
                                    {wa && (
                                      <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-300 hover:underline">
                                        WhatsApp ↗
                                      </a>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-ivory-100/45">no number</span>
                                )}
                                {r.branch && <span className="text-ivory-100/50">{r.branch}</span>}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-ivory-100/50">Grand total</p>
                              <p className="text-lg font-semibold text-gold-300 tabular-nums">{pkr(Number(r.grand_total))}</p>
                            </div>
                          </div>
                          <div className="mt-3 space-y-2">
                            {isDetailed(r.packages_json) ? (
                              r.packages_json.packages.map((p) => <PackageView key={p.number} p={p} />)
                            ) : (
                              <p className="rounded-xl bg-ivory-100/5 p-3 text-xs whitespace-pre-line text-ivory-100/70">{r.summary}</p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </>
        );
      }}
    />
  );
}
