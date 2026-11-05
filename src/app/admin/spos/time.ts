// Pakistan time is UTC+5 all year (no daylight saving): days, weeks and months are counted in it.
export const PKT = 5 * 3_600_000;
export const DAY = 86_400_000;

export const startOfDay = (t: number) => Math.floor((t + PKT) / DAY) * DAY - PKT;
export const startOfWeek = (t: number) => {
  const day = startOfDay(t);
  const weekday = (new Date(day + PKT).getUTCDay() + 6) % 7; // Monday = 0
  return day - weekday * DAY;
};
export const startOfMonth = (t: number) => {
  const d = new Date(t + PKT);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) - PKT;
};

/** Where today, this week (Monday) and this month began, Pakistan time; read per request. */
export function periodMarks() {
  const now = Date.now();
  return { today: startOfDay(now), week: startOfWeek(now), month: startOfMonth(now) };
}

/** "2026-11-05" from a date input → that day's start, Pakistan time. */
export const dayParam = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? Date.parse(`${v}T00:00:00Z`) - PKT : null);

export const PERIODS = [
  ["today", "Today"],
  ["week", "This week"],
  ["month", "This month"],
  ["all", "All time"],
  ["custom", "Dates…"],
] as const;

/** The [from, to) window of a period choice. */
export function periodRange(period: string, marks: ReturnType<typeof periodMarks>, from?: string, to?: string): [number, number] {
  if (period === "today") return [marks.today, Infinity];
  if (period === "week") return [marks.week, Infinity];
  if (period === "month") return [marks.month, Infinity];
  if (period === "custom") {
    const end = dayParam(to);
    return [dayParam(from) ?? -Infinity, end === null ? Infinity : end + DAY];
  }
  return [-Infinity, Infinity];
}

export const pkr = (n: number) => `PKR ${Math.round(n).toLocaleString("en-US")}`;
export const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Karachi", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
export const timeOnly = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { timeZone: "Asia/Karachi", hour: "2-digit", minute: "2-digit", hour12: true });
export const dayTitle = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", weekday: "long", day: "numeric", month: "long", year: "numeric" });
/** The Pakistan calendar day of a moment, for grouping. */
export const dayKey = (iso: string) => new Date(Date.parse(iso) + PKT).toISOString().slice(0, 10);

/** A link key for an SPO: their id, or "name:<name>" for log entries whose SPO row is gone. */
export const spoKey = (spoId: string | null, name: string) => spoId ?? `name:${name}`;
