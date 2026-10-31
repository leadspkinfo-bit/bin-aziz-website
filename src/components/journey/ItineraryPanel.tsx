"use client";

import { useId, type ReactNode } from "react";
import { AIRPORTS, type Airport, type ItineraryInput } from "@/lib/journey/itinerary";
import { useJourney } from "./JourneyContext";

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="text-[11px] font-semibold tracking-[0.25em] text-gold-300 uppercase">
        {label}
      </label>
      <div className="mt-2">{children(id)}</div>
      {error ? <p className="mt-1.5 text-xs text-rose-300">{error}</p> : hint && <p className="mt-1.5 text-xs text-ivory-100/50">{hint}</p>}
    </div>
  );
}

function AirportSelect({ field }: { field: "arrival" | "departure" }) {
  const { input, set } = useJourney();
  return (
    <Field label={field === "arrival" ? "Arrival airport" : "Departure airport"}>
      {(id) => (
        <div className="relative">
          <select
            id={id}
            value={input[field]}
            onChange={(e) => set(field, e.target.value as Airport)}
            className="w-full appearance-none rounded-2xl border border-ivory-100/15 bg-night-900 px-4 py-3 pr-10 text-sm text-ivory-50 outline-none transition focus:border-gold-400"
          >
            {Object.values(AIRPORTS).map((a) => (
              <option key={a.code} value={a.code}>
                {a.city} ({a.code})
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-gold-400" aria-hidden>
            ▾
          </span>
        </div>
      )}
    </Field>
  );
}

function DaysInput({ field, label, hint, disabled }: { field: "makkahDays" | "madinahDays" | "secondMakkahDays"; label: string; hint?: string; disabled?: boolean }) {
  const { input, issues, set } = useJourney();
  const error = issues.find((i) => i.field === field)?.message;
  const value = input[field];
  const change = (n: number) => set(field, Math.min(60, Math.max(0, n)) as ItineraryInput[typeof field]);
  return (
    <Field label={label} hint={hint} error={disabled ? undefined : error}>
      {(id) => (
        <div className={`flex items-stretch overflow-hidden rounded-2xl border bg-night-900 transition ${disabled ? "border-ivory-100/5 opacity-40" : "border-ivory-100/15 focus-within:border-gold-400"}`}>
          <button type="button" disabled={disabled} onClick={() => change(value - 1)} aria-label={`Fewer ${label.toLowerCase()}`} className="px-4 text-lg text-gold-300 transition hover:bg-ivory-50/5 disabled:cursor-not-allowed">
            −
          </button>
          <input
            id={id}
            type="number"
            inputMode="numeric"
            min={0}
            max={60}
            disabled={disabled}
            value={Number.isFinite(value) ? value : ""}
            onChange={(e) => change(e.target.value === "" ? 0 : Number(e.target.value))}
            className="w-full min-w-0 bg-transparent py-3 text-center text-sm text-ivory-50 tabular-nums outline-none [appearance:textfield] disabled:cursor-not-allowed [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button type="button" disabled={disabled} onClick={() => change(value + 1)} aria-label={`More ${label.toLowerCase()}`} className="px-4 text-lg text-gold-300 transition hover:bg-ivory-50/5 disabled:cursor-not-allowed">
            +
          </button>
        </div>
      )}
    </Field>
  );
}

/** The control panel at the top of /umrah-journey: everything below rearranges itself from these five answers. */
export function ItineraryPanel() {
  const { route, days, umrahs, secondMakkahAvailable, reset } = useJourney();
  return (
    <section aria-labelledby="planner-title" className="relative overflow-hidden rounded-[2rem] bg-night-950 p-6 text-ivory-50 shadow-[0_40px_80px_-40px_rgb(10_17_40/0.7)] ring-1 ring-gold-500/20 md:p-10">
      <div className="bg-islamic-pattern absolute inset-0 opacity-70" aria-hidden />
      <div className="absolute -top-32 -right-24 size-80 rounded-full bg-gold-500/15 blur-3xl" aria-hidden />
      <div className="relative">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-gold-400 uppercase">Your itinerary</p>
            <h2 id="planner-title" className="mt-2 font-display text-3xl md:text-4xl">
              Plan the journey, <span className="text-gold-gradient italic">then scroll through it.</span>
            </h2>
          </div>
          <button type="button" onClick={reset} className="rounded-full border border-ivory-100/20 px-4 py-2 text-xs text-ivory-100/70 transition hover:border-gold-400 hover:text-gold-300">
            Reset
          </button>
        </div>

        <form className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5" onSubmit={(e) => e.preventDefault()}>
          <AirportSelect field="arrival" />
          <DaysInput field="makkahDays" label="Days in Makkah" />
          <DaysInput field="madinahDays" label="Days in Madinah" />
          <DaysInput
            field="secondMakkahDays"
            label="Second Makkah stay"
            hint={secondMakkahAvailable ? "Optional — Makkah → Madinah → Makkah" : "For Jeddah arrivals with a Madinah stay"}
            disabled={!secondMakkahAvailable}
          />
          <AirportSelect field="departure" />
        </form>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-ivory-100/10 pt-6 text-sm">
          <p className="font-display text-xl text-ivory-50 md:text-2xl">{route}</p>
          <p className="text-ivory-100/60">
            <span className="font-semibold text-gold-300 tabular-nums">{days}</span> days ·{" "}
            <span className="font-semibold text-gold-300 tabular-nums">{umrahs}</span> Umrah{umrahs === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </section>
  );
}
