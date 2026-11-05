"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { dayOf, periodLabel, periodWindow, seasonOf } from "@/lib/calc/seasons";
import { dayMs, isoDay, stayDates, stayNights, type Stay } from "./calcState";

const DAY = 86_400_000;
const WEEK = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

/** The days of one month as UTC midnights, padded to start on a Monday. */
function monthDays(year: number, month: number) {
  const first = Date.UTC(year, month, 1);
  const pad = (new Date(first).getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return [...Array(pad).fill(null), ...Array.from({ length: count }, (_, i) => first + i * DAY)] as (number | null)[];
}

const monthName = (y: number, m: number) => new Date(Date.UTC(y, m, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const fmt = (ms: number) => new Date(ms).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

type Props = {
  /** the season clicked, e.g. "1st Ashra Ramadan" */
  season: string;
  /** that season's rate periods from the rate list (dated bars), or just the season itself */
  periods: string[];
  /** the stay being changed, if any */
  editing?: Stay;
  /** nights already booked in this hotel by its other stays: [check-in, check-out) */
  taken: [number, number][];
  onApply: (period: string, from: string, to: string) => void;
  onClose: () => void;
};

/**
 * Booking-style date range picker: first click = check-in, second = check-out, the nights between are
 * shaded and counted at the top. The season's own dates are marked; nights already used by another stay
 * of the same hotel can't be picked again.
 */
export function StayCalendar({ season, periods, editing, taken, onApply, onClose }: Props) {
  const [today] = useState(() => dayOf(Date.now()));
  const [start, setStart] = useState<number | null>(editing ? dayMs(editing.from) : null);
  const [end, setEnd] = useState<number | null>(editing ? dayMs(editing.to) : null);
  const [hover, setHover] = useState<number | null>(null);
  // the dated bar the stay is priced on: follows the check-in date until one is picked by hand
  const [period, setPeriod] = useState(editing?.season && periods.includes(editing.season) ? editing.season : periods[0]);
  const [pickedByHand, setPickedByHand] = useState(Boolean(editing));
  const windows = useMemo(() => new Map(periods.map((p) => [p, periodWindow(p)] as const)), [periods]);
  const win = windows.get(period) ?? periodWindow(season);
  const seasonSpan = useMemo(() => {
    const all = [...windows.values()];
    return [Math.min(...all.map((w) => w[0])), Math.max(...all.map((w) => w[1]))] as const;
  }, [windows]);

  const firstShown = start ?? Math.max(today, win[0]);
  const [view, setView] = useState(() => {
    const d = new Date(firstShown);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() };
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const isTaken = (d: number) => taken.some(([a, b]) => d >= a && d < b);
  // a range may not run through a night another stay already uses
  const blocked = (a: number, b: number) => taken.some(([x, y]) => a < y && b > x);

  const pickPeriodFor = (d: number) => {
    if (pickedByHand || periods.length < 2) return;
    const match = periods.find((p) => {
      const [a, b] = windows.get(p)!;
      return d >= a && d <= b;
    });
    if (match) setPeriod(match);
  };

  const click = (d: number) => {
    if (start === null || end !== null || d <= start || blocked(start, d)) {
      if (isTaken(d)) return;
      setStart(d);
      setEnd(null);
      pickPeriodFor(d);
      return;
    }
    setEnd(d);
    // the dated rate that covers most of these nights (nights are check-in … the day before check-out)
    if (!pickedByHand && periods.length > 1) {
      // covered by none (e.g. 1–5 Feb between "10 DEC TILL 31 JAN" and Ramadan): the nearest dated rate
      const score = (p: string) => {
        const [a, b] = windows.get(p)!;
        const overlap = Math.min(d, b + DAY) - Math.max(start, a);
        return overlap > 0 ? overlap : overlap - 1e15;
      };
      setPeriod(periods.reduce((best, p) => (score(p) > score(best) ? p : best), periods[0]));
    }
  };

  const shownEnd = end ?? (start !== null && hover !== null && hover > start && !blocked(start, hover) ? hover : null);
  const nights = start !== null && end !== null ? stayNights({ from: isoDay(start), to: isoDay(end) }) : 0;
  const outside = start !== null && end !== null && (start < win[0] || end - DAY > win[1]);

  const months = [view, view.m === 11 ? { y: view.y + 1, m: 0 } : { y: view.y, m: view.m + 1 }];
  const move = (n: number) => setView(({ y, m }) => ({ y: y + Math.floor((m + n) / 12), m: (((m + n) % 12) + 12) % 12 }));
  const canGoBack = Date.UTC(view.y, view.m, 1) > Date.UTC(new Date(today).getUTCFullYear(), new Date(today).getUTCMonth(), 1);

  const label = (p: string) => periodLabel(p) || "General rate";

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`${season} dates`} className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-[640px] overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 pt-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-wide text-[#8e1b34] uppercase">{seasonOf(season) ?? season}</p>
              <p className="mt-0.5 text-2xl font-bold text-[#044064]">
                {nights > 0 ? `${nights} ${nights === 1 ? "Night" : "Nights"}` : start !== null ? "Choose check-out" : "Choose check-in"}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {start !== null ? fmt(start) : "Check-in"} → {end !== null ? fmt(end) : "Check-out"}
              </p>
            </div>
            <button type="button" aria-label="Close" onClick={onClose} className="grid size-9 place-items-center rounded-full text-lg text-slate-500 hover:bg-slate-100">
              ✕
            </button>
          </div>
          {periods.length > 1 && (
            <div role="group" aria-label="Rate dates" className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
              {periods.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={p === period}
                  onClick={() => {
                    setPeriod(p);
                    setPickedByHand(true);
                    const [a] = windows.get(p)!;
                    const d = new Date(Math.max(a, today));
                    setView({ y: d.getUTCFullYear(), m: d.getUTCMonth() });
                  }}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    p === period ? "border-[#8e1b34] bg-[#8e1b34] text-white" : "border-[#bae6fd] text-[#044064] hover:border-[#044064]"
                  }`}
                >
                  {label(p)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" aria-label="Previous month" disabled={!canGoBack} onClick={() => move(-1)} className="grid size-9 place-items-center rounded-full text-[#044064] hover:bg-slate-100 disabled:opacity-30">
              ‹
            </button>
            <button type="button" aria-label="Next month" onClick={() => move(1)} className="grid size-9 place-items-center rounded-full text-[#044064] hover:bg-slate-100">
              ›
            </button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {months.map(({ y, m }, i) => (
              <div key={`${y}-${m}`} className={i === 1 ? "max-sm:hidden" : ""}>
                <p className="mb-2 text-center text-sm font-bold text-[#044064]">{monthName(y, m)}</p>
                <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400">
                  {WEEK.map((w) => (
                    <span key={w} className="py-1">
                      {w}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7" onMouseLeave={() => setHover(null)}>
                  {monthDays(y, m).map((d, k) => {
                    if (d === null) return <span key={`p${k}`} />;
                    const past = d < today;
                    const used = isTaken(d);
                    const isStart = d === start;
                    const isEnd = d === shownEnd;
                    const between = start !== null && shownEnd !== null && d > start && d < shownEnd;
                    const inSeason = d >= win[0] && d <= win[1];
                    return (
                      <div key={d} className={`relative py-0.5 ${between ? "bg-slate-200" : ""} ${isStart && shownEnd ? "bg-gradient-to-r from-transparent from-50% to-slate-200 to-50%" : ""} ${isEnd && start !== null ? "bg-gradient-to-r from-slate-200 from-50% to-transparent to-50%" : ""}`}>
                        <button
                          type="button"
                          disabled={past || (used && !(start !== null && end === null && d > start && !blocked(start, d)))}
                          aria-label={fmt(d)}
                          aria-pressed={isStart || isEnd}
                          onClick={() => click(d)}
                          onMouseEnter={() => setHover(d)}
                          className={`relative mx-auto grid size-9 place-items-center rounded-full text-sm transition ${
                            isStart || isEnd
                              ? "bg-[#8e1b34] font-bold text-white"
                              : past
                                ? "text-slate-300"
                                : used
                                  ? "text-slate-300 line-through"
                                  : `${inSeason ? "font-semibold text-[#044064]" : "text-slate-600"} hover:ring-2 hover:ring-[#8e1b34]/40`
                          }`}
                        >
                          {new Date(d).getUTCDate()}
                          {inSeason && !isStart && !isEnd && !past && !used && <span aria-hidden className="absolute bottom-1 size-1 rounded-full bg-[#0284c7]" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[#0284c7]" /> {label(period) === "General rate" ? seasonOf(season) : label(period)}: {stayDates({ from: isoDay(win[0]), to: isoDay(win[1]) })}
            </span>
            {taken.length > 0 && (
              <span>
                <span className="text-slate-300 line-through">12</span> = night already in another stay of this hotel
              </span>
            )}
          </p>
          {outside && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Some of these nights fall outside {seasonOf(season)} ({stayDates({ from: isoDay(seasonSpan[0]), to: isoDay(seasonSpan[1]) })}). The {seasonOf(season)} rate is still used for
              all of them — add another season for the other nights if their rate differs.
            </p>
          )}
        </div>

        <div className="sticky bottom-0 flex gap-2 border-t border-slate-200 bg-white px-4 py-3">
          <button
            type="button"
            onClick={() => {
              setStart(null);
              setEnd(null);
            }}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 underline-offset-2 hover:underline"
          >
            Clear dates
          </button>
          <button type="button" onClick={onClose} className="ml-auto rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700">
            Cancel
          </button>
          <button
            type="button"
            disabled={!nights}
            onClick={() => start !== null && end !== null && onApply(period, isoDay(start), isoDay(end))}
            className="rounded-lg bg-[#8e1b34] px-5 py-2 text-sm font-bold text-white disabled:opacity-40"
          >
            {nights ? `Save ${nights} ${nights === 1 ? "night" : "nights"}` : "Save"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
