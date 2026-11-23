"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { RateHotel } from "@/lib/calc/engine";
import { dayOf, seasonOf, seasonOn, seasonWindow } from "@/lib/calc/seasons";
import { dayMs, isoDay, stayNights, type Stay } from "./calcState";
import { bandOn, cityHotel, hotelBands, nightsByBand, type Band } from "./rateBands";

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
const dm = (ms: number) => new Date(ms).toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });
const nightsText = (n: number) => `${n} ${n === 1 ? "night" : "nights"}`;

type Props = {
  /** the season bar clicked, e.g. "1st Ashra Ramadan": only decides which month opens first */
  season: string;
  /** the hotel of this row (its own rate ranges colour the calendar); none yet = every rate range of the city */
  hotel?: RateHotel;
  /** the city's rate periods, used while no hotel is chosen */
  periods: string[];
  /** the stay being changed, if any */
  editing?: Stay;
  /** nights already booked in this hotel by its other stays: [check-in, check-out) */
  taken: [number, number][];
  /** `season` = the season of the check-in night; the price goes night by night by date anyway */
  onApply: (season: string, from: string, to: string) => void;
  onClose: () => void;
};

/** "3 nights · 1st & 2nd Ashra" lines for a range, one per rate block. */
function Breakdown({ parts, small }: { parts: { band: Band | null; nights: number }[]; small?: boolean }) {
  return (
    <ul className={`flex flex-wrap gap-1 ${small ? "justify-center" : ""}`}>
      {parts.map((p, i) => (
        <li
          key={`${p.band?.key ?? "none"}-${i}`}
          className={`rounded-full border px-2 py-0.5 font-semibold whitespace-nowrap ${small ? "text-[10px]" : "text-xs"} ${p.band ? p.band.tone.chip : "border-red-300 bg-red-50 text-red-700"}`}
        >
          {nightsText(p.nights)} · {p.band ? p.band.name : "no rate"}
        </li>
      ))}
    </ul>
  );
}

/**
 * Booking-style date range picker that guides a new SPO step by step (user request 2026-11-23): every
 * printed rate range of the hotel is its own colour (two Ashras sold at one rate are one block), a
 * bubble follows the pointer after check-in with the nights so far and how they split over the rates,
 * and a range may cross blocks — each night is priced on its own block's rate. Nights already used by
 * another stay of the same hotel can't be picked again.
 */
export function StayCalendar({ season, hotel, periods, editing, taken, onApply, onClose }: Props) {
  const [today] = useState(() => dayOf(Date.now()));
  const [start, setStart] = useState<number | null>(editing ? dayMs(editing.from) : null);
  const [end, setEnd] = useState<number | null>(editing ? dayMs(editing.to) : null);
  const [hover, setHover] = useState<number | null>(null);
  const opened = seasonOf(season) ?? "Before Ramadan";

  const rateHotel = useMemo(() => hotel ?? cityHotel(periods), [hotel, periods]);
  const bands = useMemo(() => hotelBands(rateHotel, today), [rateHotel, today]);

  const [view, setView] = useState(() => {
    const d = new Date(start ?? Math.max(today, seasonWindow(opened, today)[0]));
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

  const click = (d: number) => {
    if (start === null || end !== null || d <= start || blocked(start, d)) {
      if (isTaken(d)) return;
      setStart(d);
      setEnd(null);
      return;
    }
    setEnd(d);
  };

  const shownEnd = end ?? (start !== null && hover !== null && hover > start && !blocked(start, hover) ? hover : null);
  const nights = start !== null && shownEnd !== null ? stayNights({ from: isoDay(start), to: isoDay(shownEnd) }) : 0;
  const split = useMemo(() => (start !== null && shownEnd !== null ? nightsByBand(rateHotel, bands, start, shownEnd) : []), [rateHotel, bands, start, shownEnd]);
  const noRate = split.some((p) => !p.band);

  const months = [view, view.m === 11 ? { y: view.y + 1, m: 0 } : { y: view.y, m: view.m + 1 }];
  const move = (n: number) => setView(({ y, m }) => ({ y: y + Math.floor((m + n) / 12), m: (((m + n) % 12) + 12) % 12 }));
  const canGoBack = Date.UTC(view.y, view.m, 1) > Date.UTC(new Date(today).getUTCFullYear(), new Date(today).getUTCMonth(), 1);
  const jump = (ms: number) => {
    const d = new Date(Math.max(today, ms));
    setView({ y: d.getUTCFullYear(), m: d.getUTCMonth() });
  };

  // the step the SPO is on, written out
  const step = start === null ? 1 : end === null ? 2 : 3;
  const guide = [
    "Tap the CHECK-IN date (the first night in this hotel).",
    "Now move along the dates — the bubble shows the nights — and tap the CHECK-OUT date.",
    noRate ? "Some nights have no rate in the list — choose other dates or another hotel." : "Check the nights below, then press Save.",
  ][step - 1];

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Stay dates" className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-[680px] overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 pt-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-2xl font-bold text-[#044064]">{nights > 0 ? `${nights} ${nights === 1 ? "Night" : "Nights"}` : step === 1 ? "Choose check-in" : "Choose check-out"}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {start !== null ? fmt(start) : "Check-in"} → {shownEnd !== null ? fmt(shownEnd) : "Check-out"}
              </p>
            </div>
            <button type="button" aria-label="Close" onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-full text-lg text-slate-500 hover:bg-slate-100">
              ✕
            </button>
          </div>
          <p className={`mt-2 flex items-start gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${step === 3 && noRate ? "bg-red-50 text-red-700" : "bg-[#044064]/5 text-[#044064]"}`}>
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#8e1b34] text-[11px] text-white">{step}</span>
            {guide}
          </p>
          {split.length > 0 && (
            <div className="mt-2">
              <Breakdown parts={split} />
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
                    const band = past ? null : bandOn(rateHotel, bands, d);
                    // the bubble: on the date under the pointer while choosing the check-out
                    const bubble = !end && start !== null && d === hover && d > start && !blocked(start, d);
                    return (
                      <div
                        key={d}
                        className={`relative py-0.5 ${between ? "bg-slate-200" : ""} ${isStart && shownEnd ? "bg-gradient-to-r from-transparent from-50% to-slate-200 to-50%" : ""} ${isEnd && start !== null ? "bg-gradient-to-r from-slate-200 from-50% to-transparent to-50%" : ""}`}
                      >
                        {bubble && (
                          <div role="status" className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 w-max max-w-56 -translate-x-1/2 rounded-xl bg-[#044064] px-2.5 py-1.5 text-center text-white shadow-lg">
                            <p className="text-sm font-bold">{nightsText(nights)}</p>
                            <p className="text-[10px] text-white/80">
                              {dm(start!)} → {dm(d)} (check-out)
                            </p>
                            {split.length > 1 || noRate ? (
                              <div className="mt-1">
                                <Breakdown parts={split} small />
                              </div>
                            ) : (
                              split[0]?.band && <p className="text-[10px] text-white/80">{split[0].band.name}</p>
                            )}
                            <span aria-hidden className="absolute top-full left-1/2 -translate-x-1/2 border-x-[6px] border-t-[6px] border-x-transparent border-t-[#044064]" />
                          </div>
                        )}
                        <button
                          type="button"
                          disabled={past || (used && !(start !== null && end === null && d > start && !blocked(start, d)))}
                          aria-label={band ? `${fmt(d)}, ${band.name}` : `${fmt(d)}, no rate`}
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
                                  : `${band ? `${band.tone.day} font-semibold` : "text-slate-400"} hover:ring-2 hover:ring-[#8e1b34]/50`
                          }`}
                        >
                          {new Date(d).getUTCDate()}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {bands.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 text-[11px] font-bold tracking-wide text-slate-500 uppercase">{hotel ? "This hotel's rates — one colour per rate" : "Rates in the list — one colour per rate"}</p>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {bands
                  .filter((b) => b.to >= today)
                  .map((b) => (
                    <button key={b.key} type="button" onClick={() => jump(b.from)} title="Show these dates" className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 ${b.tone.chip}`}>
                      <span className={`size-2 rounded-full ${b.tone.dot}`} />
                      <span className="font-semibold">{b.name}</span>
                      {/* a block named by its dates already shows them */}
                      {!/\d/.test(b.name) && (
                        <span>
                          {dm(Math.max(b.from, today))} – {dm(b.to + DAY)}
                        </span>
                      )}
                    </button>
                  ))}
              </div>
            </div>
          )}
          <p className="mt-2 text-[11px] text-slate-500">
            Grey dates have no rate in the list. A stay may run over two colours — every night is charged at its own colour&apos;s rate.
            {taken.length > 0 && (
              <>
                {" "}
                <span className="text-slate-300 line-through">12</span> = night already in another stay of this hotel.
              </>
            )}
          </p>
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
            disabled={!end || !nights}
            onClick={() => start !== null && end !== null && onApply(seasonOf(split[0]?.band?.periods[0] ?? "") ?? seasonOn(start), isoDay(start), isoDay(end))}
            className="rounded-lg bg-[#8e1b34] px-5 py-2 text-sm font-bold text-white disabled:opacity-40"
          >
            {end && nights ? `Save ${nightsText(nights)}` : "Save"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
