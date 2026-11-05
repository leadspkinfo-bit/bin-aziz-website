// The five calculator seasons. Every rate a scan finds is sorted into one (or more) of them, from the
// words in the period heading, the period's dates, or the AI's own answer. The calculator shows only
// the seasons the uploaded sheet actually has rates for.

export const SEASONS = ["Before Ramadan", "1st Ashra Ramadan", "Mid Ashra Ramadan", "Last Ashra Ramadan", "Shawwal"] as const;
export type Season = (typeof SEASONS)[number];

const [BEFORE, FIRST, MID, LAST, SHAWWAL] = SEASONS;

// 1 Ramadan by the Umm al-Qura calendar (expected dates; the moon sighting can move them a day).
const RAMADAN_STARTS = ["2026-02-18", "2027-02-08", "2028-01-28", "2029-01-16", "2030-01-05", "2030-12-26"].map((d) => Date.parse(`${d}T00:00:00Z`));
const DAY = 86_400_000;

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH = "(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?";

export function isSeason(v: unknown): v is Season {
  return typeof v === "string" && (SEASONS as readonly string[]).includes(v);
}

/*
 * Rate periods. A rate list can print several date ranges inside one season (e.g. "CHECKOUT TILL 10 DEC"
 * and "10 DEC TILL 31 JAN", both before Ramadan). Each one is stored as its own row in `seasons`, named
 * "<season> — <printed heading>", so the calculator shows it as a separate bar under its season.
 * A rate printed without dates keeps the plain season name.
 */
export const PERIOD_SEP = " — ";

export function periodName(season: Season, label?: string) {
  return label ? `${season}${PERIOD_SEP}${label}` : season;
}

/** The season a stored period belongs to, or null for a name outside the four. */
export function seasonOf(name: string): Season | null {
  return SEASONS.find((s) => name === s || name.startsWith(s + PERIOD_SEP)) ?? null;
}

/** The printed heading part of a period name ("" for a plain season). */
export function periodLabel(name: string) {
  const season = seasonOf(name);
  return season && name !== season ? name.slice(season.length + PERIOD_SEP.length) : "";
}

/**
 * Season order first, then each period by its first date and then its last ("TILL 10 DEC" before
 * "10 DEC TILL 31 JAN"), a plain season before its dated ones.
 */
export function sortPeriods(names: Iterable<string>, now = Date.now()) {
  const key = (n: string) => {
    const s = seasonOf(n);
    const label = periodLabel(n);
    const range = label ? parseRange(label, now) : null;
    const [from, to] = label ? (range ?? [Infinity, Infinity]) : [-Infinity, -Infinity];
    return [s ? SEASONS.indexOf(s) : SEASONS.length, from, to] as const;
  };
  return [...new Set(names)].sort((a, b) => {
    const [sa, fa, ta] = key(a);
    const [sb, fb, tb] = key(b);
    return sa - sb || fa - fb || ta - tb || a.localeCompare(b);
  });
}

/** The heading as it will be shown: printed text, spaces tidied, at most 80 characters. */
export function cleanLabel(period: string) {
  // Urdu/Arabic script is dropped from the bar text (its meaning is already in the season); the dates stay
  const latin = period.replace(/[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]+/g, " ").replace(/\(\s*\)/g, " ");
  return (latin.replace(/\s+/g, " ").trim() || period.replace(/\s+/g, " ").trim()).slice(0, 80);
}

const utc = (y: number, m: number, d: number) => Date.UTC(y, m, d);

/** The first and last date written in a period heading, e.g. "01 - 15 Dec 2026" or "25 Dec 2026 - 10/01/2027". */
export function parseRange(text: string, now = Date.now()): [number, number] | null {
  const dates: { d: number; m: number; y?: number }[] = [];
  const year = (y?: string) => (y ? (y.length === 2 ? 2000 + Number(y) : Number(y)) : undefined);

  // "01 - 15 Dec 2026": the first day borrows the month of the second
  const shared = new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?\\s*(?:-|–|to)\\s*(\\d{1,2})(?:st|nd|rd|th)?\\s+${MONTH}(?:[\\s,]+(\\d{4}))?`, "i").exec(text);
  if (shared) {
    const m = MONTHS.indexOf(shared[3].slice(0, 3).toLowerCase());
    dates.push({ d: Number(shared[1]), m, y: year(shared[4]) }, { d: Number(shared[2]), m, y: year(shared[4]) });
  } else {
    const named = new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?[\\s\\-/.,]*${MONTH}(?:[\\s,\\-/.]*(\\d{4}))?`, "gi");
    const numeric = /\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\b/g;
    const found: { at: number; d: number; m: number; y?: number }[] = [];
    for (const x of text.matchAll(named)) found.push({ at: x.index, d: Number(x[1]), m: MONTHS.indexOf(x[2].slice(0, 3).toLowerCase()), y: year(x[3]) });
    for (const x of text.matchAll(numeric)) found.push({ at: x.index, d: Number(x[1]), m: Number(x[2]) - 1, y: year(x[3]) });
    found.sort((a, b) => a.at - b.at);
    dates.push(...found);
  }
  const valid = dates.filter((x) => x.m >= 0 && x.m < 12 && x.d >= 1 && x.d <= 31);
  if (!valid.length) return null;

  const first = valid[0];
  const last = valid[valid.length - 1];
  const known = first.y ?? last.y;
  let startYear = known ?? new Date(now).getUTCFullYear();
  // no year written: a date more than six months gone means next year's
  if (!known && utc(startYear, first.m, first.d) < now - 182 * DAY) startYear++;
  const start = utc(first.y ?? startYear, first.m, first.d);
  let end = utc(last.y ?? first.y ?? startYear, last.m, last.d);
  if (end < start) end = utc((last.y ?? startYear) + 1, last.m, last.d); // "25 Dec - 10 Jan"
  return [start, end];
}

/**
 * Which Ashras of Ramadan, and whether Shawwal (the month after it), a date range touches; none means
 * the rate is a "Before Ramadan" rate. Shawwal is counted from 1 Shawwal (Ramadan + 30 days) for 30 days.
 */
export function seasonsForRange([start, end]: [number, number]): Season[] {
  // days of the range inside each season; one or two days at an edge are the moon-sighting difference
  // (a list's "27 FEB TILL 11 MAR" Last Ashra starts a day before the table's), not another season
  const days = new Map<Season, number>();
  for (const r of RAMADAN_STARTS) {
    const ashras: [Season, number, number][] = [
      [FIRST, r, r + 9 * DAY],
      [MID, r + 10 * DAY, r + 19 * DAY],
      [LAST, r + 20 * DAY, r + 29 * DAY],
      [SHAWWAL, r + 30 * DAY, r + 59 * DAY],
    ];
    for (const [season, from, to] of ashras) {
      const n = Math.round((Math.min(end, to) - Math.max(start, from)) / DAY) + 1;
      if (n > 0) days.set(season, (days.get(season) ?? 0) + n);
    }
  }
  if (!days.size) return [BEFORE];
  const most = Math.max(...days.values());
  return SEASONS.filter((s) => (days.get(s) ?? 0) >= Math.min(3, most));
}

/** Midnight UTC of a day: the calculator's calendar counts whole days in UTC so time zones never shift them. */
export const dayOf = (ms: number) => {
  const d = new Date(ms);
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
};

/**
 * The next dates (first and last day, UTC midnight) a season covers, from today on: the coming Ashras and
 * Shawwal by the Ramadan table above, Before Ramadan from today (or the end of the last Shawwal) until
 * the day before the next Ramadan.
 */
export function seasonWindow(season: Season, now = Date.now()): [number, number] {
  const today = dayOf(now);
  let previousEnd = -Infinity;
  for (const r of RAMADAN_STARTS) {
    const windows: Record<Season, [number, number]> = {
      [BEFORE]: [Math.max(today, previousEnd + DAY), r - DAY],
      [FIRST]: [r, r + 9 * DAY],
      [MID]: [r + 10 * DAY, r + 19 * DAY],
      [LAST]: [r + 20 * DAY, r + 29 * DAY],
      [SHAWWAL]: [r + 30 * DAY, r + 59 * DAY],
    };
    previousEnd = r + 59 * DAY;
    if (windows[season][1] >= today) return windows[season];
  }
  return [today, today + 29 * DAY];
}

/**
 * The dates a stored rate period covers: the dates printed in its heading ("10 DEC TILL 31 JAN"; a lone
 * "CHECKOUT TILL 10 DEC" runs from the start of its season up to that day), else its season's dates.
 */
export function periodWindow(period: string, now = Date.now()): [number, number] {
  const season = seasonOf(period) ?? BEFORE;
  const own = seasonWindow(season, now);
  const label = periodLabel(period);
  const range = label ? parseRange(label, now) : null;
  if (!range) return own;
  // "CHECKOUT TILL 10 DEC": check-out by the 10th, so the last night it prices is the 9th
  if (range[0] === range[1] && /till|until|upto|up to|check\s*-?out/i.test(label)) return [Math.min(own[0], range[1] - DAY), range[1] - DAY];
  return range;
}

/**
 * The seasons a scanned period belongs to. Ashra words in the heading win, then the dates in it
 * (checked against the Ramadan table above), then the AI's own answer (`suggested`).
 */
export function seasonsForPeriod(period: string, suggested?: unknown, now = Date.now()): Season[] {
  const text = period.toLowerCase();
  // English / Roman Urdu, and Urdu script as printed on Pakistani lists ("پہلا اور دوسرا عشرہ", "آخری عشرہ")
  const ramadan = /rama[dz]h?an|ramzan|ashra|ashrah/.test(text) || /عشر[ہهةه]|رمضان/.test(period);
  // "Shawwal" / "Shawal" / "Eid ul Fitr" / "شوال" with no Ramadan words: the month after Ramadan
  if (!ramadan && (/shaw+a+l|eid\s*(?:ul|al)?[\s-]*fitr/.test(text) || /شوال|عید\s*ال\s*فطر/.test(period))) return [SHAWWAL];
  if (ramadan) {
    // one heading can name several Ashras: "1st & 2nd Ashra", "پہلا دوسرا اور آخری عشرہ"
    const found = new Set<Season>();
    if (/\b1st|first|pehla|pahla|\bstart|\b1\s*(?:-|–|to)\s*10\b/.test(text) || /پہلا|پهلا|پہلے|پہلی|اول/.test(period)) found.add(FIRST);
    if (/\bmid\b|middle|2nd|second|doosra|dusra|dosra|\b11\s*(?:-|–|to)/.test(text) || /دوسرا|دوسرے|دوسری|درمیانی/.test(period)) found.add(MID);
    if (/last|3rd|third|akhri|aakhri|final|\b21\s*(?:-|–|to)/.test(text) || /آخری|اخری|تیسرا|تیسری/.test(period)) found.add(LAST);
    if (found.size) return SEASONS.filter((s) => found.has(s));
  }
  const range = parseRange(period, now);
  if (range) return seasonsForRange(range);
  const fromAi = Array.isArray(suggested) ? SEASONS.filter((s) => suggested.includes(s)) : [];
  if (fromAi.length) return fromAi;
  return ramadan ? [FIRST, MID, LAST] : [BEFORE];
}
