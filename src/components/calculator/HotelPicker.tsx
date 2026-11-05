"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { RateHotel } from "@/lib/calc/engine";
import { parseRange, periodLabel, SEASONS, seasonOf, sortPeriods, type Season } from "@/lib/calc/seasons";

// short season names for the tags (the user's wording: 2nd / 3rd Ashra)
const SHORT: Record<Season, string> = {
  "Before Ramadan": "Before Ramadan",
  "1st Ashra Ramadan": "1st",
  "Mid Ashra Ramadan": "2nd",
  "Last Ashra Ramadan": "3rd",
  Shawwal: "Shawwal",
};
const ASHRAS: Season[] = ["1st Ashra Ramadan", "Mid Ashra Ramadan", "Last Ashra Ramadan"];

const day = (ms: number, withMonth = true) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", ...(withMonth ? { month: "short" } : {}), timeZone: "UTC" });

/** "10 DEC TILL 06 FEB" → "10 Dec–6 Feb", "06 FEB TILL 27 FEB" → "6–27 Feb", "CHECKOUT TILL 10 DEC" → "till 10 Dec". */
export function shortDates(label: string) {
  const range = label ? parseRange(label) : null;
  if (!range) return "";
  const [a, b] = range;
  if (a === b) return /till|until|upto|up to|check\s*-?out/i.test(label) ? `till ${day(b)}` : day(a);
  const sameMonth = new Date(a).getUTCMonth() === new Date(b).getUTCMonth();
  return `${day(a, !sameMonth)}–${day(b)}`;
}

/** "1st & 2nd Ashra", "1st, 2nd & 3rd Ashra", "Before Ramadan", "Shawwal". */
function seasonNames(seasons: Season[]) {
  const ashras = seasons.filter((s) => ASHRAS.includes(s)).map((s) => SHORT[s]);
  const others = seasons.filter((s) => !ASHRAS.includes(s)).map((s) => SHORT[s]);
  const a = ashras.length ? `${ashras.length > 1 ? `${ashras.slice(0, -1).join(", ")} & ${ashras.at(-1)}` : ashras[0]} Ashra` : "";
  return [...others, a].filter(Boolean).join(" · ");
}

/**
 * One tag per rate a hotel has, with its dates: "Before Ramadan · till 10 Dec", "Before Ramadan · 10 Dec–6 Feb",
 * "1st & 2nd Ashra · 6–27 Feb". Ashras that share one printed date range (one rate) share one tag.
 * Availability only — never a price.
 */
export function hotelRateTags(hotel: RateHotel): string[] {
  const periods = sortPeriods(Object.entries(hotel.rates).filter(([, rooms]) => Object.values(rooms).some((v) => (v ?? 0) > 0)).map(([p]) => p));
  const groups = new Map<string, Season[]>();
  for (const p of periods) {
    const s = seasonOf(p);
    if (!s) continue;
    const dates = shortDates(periodLabel(p));
    // Ramadan Ashras printed under one heading share their dates; other seasons stay apart
    const key = ASHRAS.includes(s) && dates ? `ashra|${dates}` : `${s}|${dates}`;
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }
  return [...groups].map(([key, seasons]) => {
    const dates = key.slice(key.indexOf("|") + 1);
    const names = seasonNames(SEASONS.filter((s) => seasons.includes(s)));
    return dates ? `${names} · ${dates}` : names;
  });
}

type Props = {
  label: string;
  value: string;
  hotels: Record<string, RateHotel>;
  onChange: (id: string) => void;
};

/**
 * Hotel dropdown. Inside the open list every hotel carries small tags for each rate it has, with the
 * dates ("Before Ramadan · 10 Dec–6 Feb", "1st & 2nd Ashra · 6–27 Feb"), since rates change every few days; the closed box shows only the clean hotel name. Type to search; arrows, Enter and Esc work.
 */
export function HotelPicker({ label, value, hotels, onChange }: Props) {
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [box, setBox] = useState<{ left: number; width: number; top?: number; bottom?: number; maxHeight: number } | null>(null);

  const options = Object.entries(hotels)
    .map(([hid, h]) => ({ id: hid, name: h.name, tags: hotelRateTags(h) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const q = query.trim().toLowerCase();
  const shown = q ? options.filter((o) => o.name.toLowerCase().includes(q) || o.tags.some((t) => t.toLowerCase().includes(q))) : options;
  const selected = hotels[value];

  // the list is portalled to <body> (the package card clips overflow) and placed under the box,
  // or above it when there is no room below
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = button.current!.getBoundingClientRect();
      const below = window.innerHeight - r.bottom - 8;
      const above = r.top - 8;
      const up = below < 260 && above > below;
      setBox({ left: r.left, width: Math.max(r.width, 280), maxHeight: Math.min(380, up ? above : below), ...(up ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }) });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!button.current?.contains(t) && !list.current?.parentElement?.contains(t)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  useEffect(() => {
    if (open) list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const choose = (hid: string) => {
    onChange(hid);
    setOpen(false);
    setQuery("");
    button.current?.focus();
  };

  const show = () => {
    setActive(Math.max(0, options.findIndex((o) => o.id === value)));
    setQuery("");
    setOpen(true);
  };

  const keys = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, shown.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (shown[active]) choose(shown[active].id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      button.current?.focus();
    }
  };

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            show();
          }
        }}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white p-2 text-left text-sm text-slate-800 outline-none transition focus:border-[#8e1b34] focus:ring-3 focus:ring-[#8e1b34]/10"
      >
        {/* closed: the clean hotel name only */}
        <span className={`min-w-0 truncate ${selected ? "" : "text-slate-500"}`}>{selected?.name ?? "Select hotel"}</span>
        <svg aria-hidden viewBox="0 0 20 20" className={`size-4 shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`}>
          <path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open &&
        box &&
        createPortal(
          <div
            style={{ position: "fixed", left: box.left, width: box.width, top: box.top, bottom: box.bottom, maxHeight: box.maxHeight }}
            className="z-[85] flex max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
          >
            <input
              autoFocus
              aria-label={`Search ${label}`}
              aria-controls={`${id}-list`}
              aria-activedescendant={shown[active] ? `${id}-${shown[active].id}` : undefined}
              placeholder="Search hotel or season…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={keys}
              className="border-b border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none"
            />
            <ul ref={list} id={`${id}-list`} role="listbox" aria-label={label} className="min-h-0 flex-1 overflow-y-auto py-1">
              {shown.length === 0 && <li className="px-3 py-3 text-sm text-slate-500">{options.length ? `No hotel matches “${query}”.` : "Loading hotels…"}</li>}
              {shown.map((o, i) => (
                <li
                  key={o.id}
                  id={`${id}-${o.id}`}
                  data-index={i}
                  role="option"
                  aria-selected={o.id === value}
                  onPointerEnter={() => setActive(i)}
                  onClick={() => choose(o.id)}
                  className={`cursor-pointer px-3 py-2 text-sm ${i === active ? "bg-[#e0f2fe]" : ""} ${o.id === value ? "font-semibold text-[#8e1b34]" : "text-slate-800"}`}
                >
                  <span className="block">{o.name}</span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {o.tags.length === 0 && <span className="text-[10px] text-slate-400">no rates yet</span>}
                    {o.tags.map((t) => {
                      const [names, dates] = t.split(" · ").length > 1 ? [t.slice(0, t.lastIndexOf(" · ")), t.slice(t.lastIndexOf(" · ") + 3)] : [t, ""];
                      return (
                        <span key={t} className="rounded-full border border-slate-200 bg-slate-50 px-1.5 py-px text-[10px] font-medium whitespace-nowrap text-slate-500">
                          {names}
                          {dates && <span className="font-semibold text-[#044064]"> · {dates}</span>}
                        </span>
                      );
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </div>,
          document.body,
        )}
    </>
  );
}
